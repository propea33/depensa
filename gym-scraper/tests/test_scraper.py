import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from scraper.scrape import (
    parse_numeric_price,
    extract_econofitness_monthly_from_html,
    extract_progym_monthly_from_html,
)


def test_parse_numeric_price_fr():
    assert parse_numeric_price("29,99") == 29.99


def test_parse_numeric_price_en():
    assert parse_numeric_price("35.00") == 35.0


def test_extract_econofitness_annual_to_monthly():
    html = """
    <a me:view:data="{&quot;event&quot;:&quot;select_item&quot;,&quot;ecommerce&quot;:{&quot;items&quot;:[{&quot;item_name&quot;:&quot;Econo&quot;,&quot;price&quot;:&quot;285.75&quot;}]}}"></a>
    <a me:view:data="{&quot;event&quot;:&quot;select_item&quot;,&quot;ecommerce&quot;:{&quot;items&quot;:[{&quot;item_name&quot;:&quot;Weekend&quot;,&quot;price&quot;:&quot;129.75&quot;}]}}"></a>
    """
    assert extract_econofitness_monthly_from_html(html) == 10.81


def test_extract_progym_biweekly_to_monthly():
    html = """
    <div class="new-price">
      <h3>10</h3>
      <h4>99$</h4>
      <span>/ 2 semaines</span>
    </div>
    <div class="new-price">
      <h3>14</h3>
      <h4>99$</h4>
      <span>/ 2 semaines</span>
    </div>
    """
    # 10.99 * 26 / 12 = 23.81
    assert extract_progym_monthly_from_html(html) == 23.81


def test_extract_progym_returns_none_without_matching_markup():
    assert extract_progym_monthly_from_html("<html><body>no plan here</body></html>") is None
