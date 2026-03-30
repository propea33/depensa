import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from scraper.scrape import parse_numeric_price, extract_price_candidates, pick_monthly_price


def test_parse_numeric_price_fr():
    assert parse_numeric_price("12,99") == 12.99


def test_parse_numeric_price_en():
    assert parse_numeric_price("9.99") == 9.99


def test_pick_monthly_price_prefers_monthly_context():
    text = "Plan annuel 119.99/year. Standard $9.99/month."
    assert pick_monthly_price(text) == 9.99


def test_pick_monthly_price_handles_french_context():
    text = "Abonnement extra 6,99 $/mois."
    assert pick_monthly_price(text) == 6.99


def test_extract_price_candidates_ignores_large_values():
    text = "Ultra plan $149.99/month"  # out of allowed range
    candidates = extract_price_candidates(text)
    assert all(c["price"] <= 80 for c in candidates)
