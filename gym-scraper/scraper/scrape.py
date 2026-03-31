"""
Depensa Gym Scraper — Canada/Québec
===================================
Scrape les prix mensuels des abonnements gym et publie data/gym-prices.json.

Gyms couverts:
- Éconofitness
- Pro Gym
- YMCA
- World Gym
- Energie Cardio

Stratégie:
1) HTTP (curl_cffi impersonation navigateur)
2) Extraction spécifique par fournisseur (sources tarifaires officielles)
3) Normalisation en prix mensuel CAD
4) Garde-fous de plage + fallback précédent/local
"""

from __future__ import annotations

import datetime as dt
import html as html_lib
import json
import os
import re
from dataclasses import dataclass
from typing import Optional

from bs4 import BeautifulSoup
from curl_cffi import requests

OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "gym-prices.json")


@dataclass
class GymConfig:
    provider: str
    url: str
    fallback_price: float
    plan_name: str
    min_price: float
    max_price: float
    scrape_mode: str = "none"
    note: str = ""


GYMS: list[GymConfig] = [
    GymConfig(
        "Éconofitness",
        "https://econofitness.ca/fr/abonnements",
        10.81,
        "Plan de base (mensualisé)",
        8.0,
        40.0,
        scrape_mode="econofitness_annual",
        note="Prix de base annualisé en mensuel",
    ),
    GymConfig(
        "Pro Gym",
        "https://www.progym.ca/abonnements/",
        23.81,
        "Régulier (mensualisé)",
        15.0,
        60.0,
        scrape_mode="progym_biweekly",
        note="Prix par 2 semaines converti en mensuel",
    ),
    GymConfig(
        "YMCA",
        "https://ymca.ca/en/",
        58.0,
        "Mensuel estimé",
        25.0,
        120.0,
        scrape_mode="none",
        note="Prix variable selon centre; estimation locale",
    ),
    GymConfig(
        "World Gym",
        "https://www.worldgym.com/",
        34.99,
        "Mensuel estimé",
        20.0,
        120.0,
        scrape_mode="none",
        note="Prix variable selon succursale; estimation locale",
    ),
    GymConfig(
        "Energie Cardio",
        "https://energiecardio.com/",
        29.99,
        "Mensuel estimé",
        20.0,
        120.0,
        scrape_mode="none",
        note="Prix variable selon club; estimation locale",
    ),
]

def load_previous_payload(path: str = OUTPUT_PATH) -> dict:
    if not os.path.exists(path):
        return {}
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def previous_plan_map(payload: dict) -> dict[str, dict]:
    plans = payload.get("plans") or []
    out: dict[str, dict] = {}
    for p in plans:
        provider = (p.get("provider") or "").strip()
        if provider:
            out[provider] = p
    return out


def parse_numeric_price(text: str) -> Optional[float]:
    text = text.replace("\u00a0", " ").replace(" ", "")
    text = text.replace(",", ".")
    try:
        val = float(text)
        if 0 <= val <= 200:
            return round(val, 2)
    except ValueError:
        return None
    return None


def looks_like_non_cad(text: str) -> bool:
    t = text.lower()
    has_us = ("us$" in t) or (" usd" in t) or ("u.s." in t)
    has_cad = ("cad" in t) or ("ca$" in t) or ("$ cad" in t) or ("canada" in t)
    return has_us and not has_cad


def fetch_page_html(url: str, timeout: int = 25) -> str:
    r = requests.get(
        url,
        timeout=timeout,
        impersonate="chrome124",
        headers={
            "Accept-Language": "fr-CA,fr;q=0.9,en-CA;q=0.8,en;q=0.7",
            "Cache-Control": "no-cache",
        },
    )
    r.raise_for_status()
    return r.text


def extract_econofitness_monthly_from_html(html: str) -> Optional[float]:
    # Éconofitness exposes annual prices in GTM data attributes:
    # me:view:data="{... item_name:'Econo', price:'285.75' ...}"
    # We take the cheapest annual membership and convert to monthly.
    annual_prices: list[float] = []
    decoded = html_lib.unescape(html)
    for m in re.finditer(r'"item_name":"([^"]+)".{0,220}?"price":"([0-9]+(?:\.[0-9]{2})?)"', decoded):
        raw_name = m.group(1).strip().lower()
        raw_price = m.group(2)
        if raw_name not in {"weekend", "econo", "platine", "extra"}:
            continue
        p = parse_numeric_price(raw_price)
        if p is None:
            continue
        annual_prices.append(p)

    if not annual_prices:
        # Backup: parse SEO text "à partir de 129,75$/année"
        meta_match = re.search(r"([0-9]{2,4}[,\.][0-9]{2})\s*\$/ann[ée]e", decoded, re.IGNORECASE)
        if meta_match:
            p = parse_numeric_price(meta_match.group(1))
            if p is not None:
                annual_prices.append(p)

    if not annual_prices:
        return None

    annual_min = min(annual_prices)
    monthly = round(annual_min / 12.0, 2)
    return monthly


def extract_progym_monthly_from_html(html: str) -> Optional[float]:
    # ProGym publishes a split bi-weekly amount in the pricing cards:
    # <h3>10</h3> + <h4>99$</h4> + "/ 2 semaines" -> 10.99 / 2 weeks.
    # Convert to monthly by *26/12.
    normalized = re.sub(r"\s+", " ", html)
    biweekly: list[float] = []
    pattern = re.compile(
        r"<h3>\s*([0-9]{1,2})\s*</h3>.*?<h4>\s*([0-9]{2})\s*\$\s*</h4>.*?/ 2 semaines",
        re.IGNORECASE,
    )
    for m in pattern.finditer(normalized):
        whole = int(m.group(1))
        cents = int(m.group(2))
        val = round(whole + (cents / 100.0), 2)
        if 5 <= val <= 40:
            biweekly.append(val)

    if not biweekly:
        return None

    biweekly_min = min(biweekly)
    monthly = round((biweekly_min * 26.0) / 12.0, 2)
    return monthly


def scrape_gym(cfg: GymConfig) -> tuple[Optional[float], bool, str]:
    if cfg.scrape_mode == "none":
        return None, False, "no_public_monthly_price"

    try:
        html = fetch_page_html(cfg.url)
        text = BeautifulSoup(html, "lxml").get_text(" ", strip=True)
        if looks_like_non_cad(text):
            return None, False, "non_cad_detected"

        if cfg.scrape_mode == "econofitness_annual":
            price = extract_econofitness_monthly_from_html(html)
            source = "econofitness_annual_to_monthly"
        elif cfg.scrape_mode == "progym_biweekly":
            price = extract_progym_monthly_from_html(html)
            source = "progym_biweekly_to_monthly"
        else:
            price = None
            source = "unsupported_mode"

        if price is None:
            return None, False, "no_price_found"
        if not (cfg.min_price <= price <= cfg.max_price):
            return None, False, "out_of_range"
        return price, True, source
    except Exception:
        return None, False, "fetch_error"


def build_plan(
    cfg: GymConfig,
    scraped_price: Optional[float],
    scraped_ok: bool,
    source: str,
    prev_by_provider: dict[str, dict],
) -> dict:
    prev = prev_by_provider.get(cfg.provider, {})
    prev_price = prev.get("price")

    if scraped_price is None:
        # If we intentionally don't scrape this provider (no public monthly price),
        # keep a curated baseline instead of drifting on older potentially stale values.
        if source == "no_public_monthly_price":
            final_price = cfg.fallback_price
        elif isinstance(prev_price, (int, float)):
            final_price = float(prev_price)
        else:
            final_price = cfg.fallback_price
        scraped_ok = False
    else:
        final_price = float(scraped_price)

    if isinstance(prev_price, (int, float)):
        delta = round(final_price - float(prev_price), 2)
        previous_price = round(float(prev_price), 2)
    else:
        delta = 0.0
        previous_price = None

    plan_note = cfg.note
    if not scraped_ok and source == "no_public_monthly_price":
        plan_note = (cfg.note + " (pas de tarif mensuel public national)") if cfg.note else "Pas de tarif mensuel public national"

    return {
        "provider": cfg.provider,
        "plan_name": cfg.plan_name,
        "price": round(final_price, 2),
        "currency": "CAD",
        "url": cfg.url,
        "note": plan_note,
        "scraped_ok": bool(scraped_ok),
        "source": source,
        "previous_price": previous_price,
        "delta": delta,
        "price_drop": delta < 0,
    }


def main() -> int:
    prev_payload = load_previous_payload(OUTPUT_PATH)
    prev_map = previous_plan_map(prev_payload)

    plans: list[dict] = []
    scraped_count = 0
    fallback_count = 0

    for cfg in GYMS:
        scraped_price, scraped_ok, source = scrape_gym(cfg)
        plan = build_plan(cfg, scraped_price, scraped_ok, source, prev_map)
        plans.append(plan)

        if plan["scraped_ok"]:
            scraped_count += 1
        else:
            fallback_count += 1

        print(f"- {cfg.provider:<14} ${plan['price']:>6.2f} ({'ok' if plan['scraped_ok'] else 'fallback'})")

    drops = [
        {
            "provider": p["provider"],
            "from": p["previous_price"],
            "to": p["price"],
            "delta": p["delta"],
        }
        for p in plans
        if p["price_drop"] and isinstance(p.get("previous_price"), (int, float))
    ]

    payload = {
        "updated_at": dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "scraped_count": scraped_count,
        "fallback_count": fallback_count,
        "region": "ca",
        "currency": "CAD",
        "plans": plans,
        "drops": drops,
    }

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

    print(f"\n✅ JSON écrit: {OUTPUT_PATH}")
    print(f"   scraped_count={scraped_count} | fallback_count={fallback_count} | drops={len(drops)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
