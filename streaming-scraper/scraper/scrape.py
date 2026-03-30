"""
Depensa Streaming Scraper — Canada/Québec
=========================================
Scrape les prix mensuels des abonnements streaming et publie data/streaming-prices.json.

Services couverts:
- Netflix
- Amazon Prime
- Crave
- Disney+
- Illico+
- Tou.tv
- Apple TV+
- Paramount+
- Tubi

Stratégie:
1) HTTP (curl_cffi impersonation navigateur)
2) Extraction par regex prix + signaux "mois/month"
3) Fallback intelligent: prix du jour précédent, sinon valeur par défaut
4) Détection de baisse de prix vs précédent (price_drop, delta)
"""

from __future__ import annotations

import datetime as dt
import json
import os
import re
from dataclasses import dataclass
from typing import Optional

from bs4 import BeautifulSoup
from curl_cffi import requests

OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "streaming-prices.json")


@dataclass
class ServiceConfig:
    provider: str
    url: str
    fallback_price: float
    plan_name: str
    min_price: float
    max_price: float
    note: str = ""
    is_free: bool = False


SERVICES: list[ServiceConfig] = [
    ServiceConfig("Netflix", "https://www.netflix.com/ca/", 8.99, "Standard avec pub", 6.0, 30.0),
    ServiceConfig("Amazon Prime", "https://www.primevideo.com/", 9.99, "Prime Video", 6.0, 30.0),
    ServiceConfig("Crave", "https://www.crave.ca/en/subscribe", 11.99, "De base avec pubs", 6.0, 35.0),
    ServiceConfig("Disney+", "https://www.disneyplus.com/en-ca", 8.99, "Standard avec pub", 6.0, 30.0),
    ServiceConfig("Illico+", "https://www.videotron.com/television/illico-plus", 15.0, "Mensuel", 6.0, 35.0),
    ServiceConfig("Tou.tv", "https://ici.tou.tv/abonnement", 7.99, "Extra", 4.0, 25.0),
    ServiceConfig("Apple TV+", "https://tv.apple.com/ca", 14.99, "Mensuel", 8.0, 35.0),
    ServiceConfig("Paramount+", "https://www.paramountplus.com/ca/", 8.99, "Mensuel", 5.0, 30.0),
    ServiceConfig("Tubi", "https://tubitv.com/", 0.0, "Gratuit (pub)", 0.0, 0.5, is_free=True),
]

MONTHLY_HINTS = [
    "month", "monthly", "/month", "per month",
    "mois", "mensuel", "/mois", "par mois",
]
NEGATIVE_HINTS = [
    "year", "annuel", "annually", "/an", "per year",
    "free trial", "essai gratuit", "rent", "buy",
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
        if 0 <= val <= 80:
            return round(val, 2)
    except ValueError:
        return None
    return None


def extract_price_candidates(page_text: str) -> list[dict]:
    txt = page_text.lower()
    candidates: list[dict] = []

    for m in re.finditer(r"\$\s*([0-9]{1,2}(?:[\.,][0-9]{2})?)", txt):
        raw = m.group(1)
        price = parse_numeric_price(raw)
        if price is None:
            continue

        i0, i1 = m.span()
        win0 = max(0, i0 - 90)
        win1 = min(len(txt), i1 + 90)
        context = txt[win0:win1]

        score = 0
        if any(h in context for h in MONTHLY_HINTS):
            score += 4
        if any(h in context for h in NEGATIVE_HINTS):
            score -= 4
        if "ad" in context or "pub" in context or "base" in context or "standard" in context:
            score += 1

        candidates.append({"price": price, "score": score, "context": context})

    return candidates


def pick_monthly_price(page_text: str) -> Optional[float]:
    candidates = extract_price_candidates(page_text)
    if not candidates:
        return None

    weighted = [c for c in candidates if c["score"] >= 1]
    pool = weighted if weighted else candidates

    # Choix stable: meilleur score puis prix le plus bas plausible
    best = sorted(pool, key=lambda c: (-c["score"], c["price"]))[0]
    return best["price"]


def looks_like_non_cad(text: str) -> bool:
    t = text.lower()
    # If a page mostly exposes US pricing and no CAD hint, we avoid trusting it.
    has_us = ("us$" in t) or (" usd" in t) or ("u.s." in t)
    has_cad = ("cad" in t) or ("ca$" in t) or ("$ cad" in t) or ("canada" in t)
    return has_us and not has_cad


def fetch_page_text(url: str, timeout: int = 25) -> str:
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
    soup = BeautifulSoup(r.text, "lxml")
    return soup.get_text(" ", strip=True)


def scrape_service(cfg: ServiceConfig) -> tuple[Optional[float], bool, str]:
    if cfg.is_free:
        return 0.0, True, "free_tier"

    try:
        text = fetch_page_text(cfg.url)
        if looks_like_non_cad(text):
            return None, False, "non_cad_detected"
        price = pick_monthly_price(text)
        if price is None:
            return None, False, "no_price_found"
        if not (cfg.min_price <= price <= cfg.max_price):
            return None, False, "out_of_range"
        return price, True, "http_regex"
    except Exception:
        return None, False, "fetch_error"


def build_plan(
    cfg: ServiceConfig,
    scraped_price: Optional[float],
    scraped_ok: bool,
    source: str,
    prev_by_provider: dict[str, dict],
) -> dict:
    prev = prev_by_provider.get(cfg.provider, {})
    prev_price = prev.get("price")

    if scraped_price is None:
        if isinstance(prev_price, (int, float)):
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

    return {
        "provider": cfg.provider,
        "plan_name": cfg.plan_name,
        "price": round(final_price, 2),
        "currency": "CAD",
        "url": cfg.url,
        "note": cfg.note,
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

    for cfg in SERVICES:
        scraped_price, scraped_ok, source = scrape_service(cfg)
        plan = build_plan(cfg, scraped_price, scraped_ok, source, prev_map)
        plans.append(plan)

        if plan["scraped_ok"]:
            scraped_count += 1
        else:
            fallback_count += 1

        print(f"- {cfg.provider:<12} ${plan['price']:>5.2f} ({'ok' if plan['scraped_ok'] else 'fallback'})")

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
