import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent.parent))

import pytest
from connectors import get_connector, MissingCredentialsError
from connectors.google_analytics import GoogleAnalyticsConnector
from connectors.google_ads import GoogleAdsConnector
from connectors.shopify import ShopifyConnector
from connectors.csv_fallback import CSVFallbackConnector

def test_missing_credentials_raised_for_unconfigured_connectors():
    ga = GoogleAnalyticsConnector({})
    missing = ga.validate_credentials()
    assert len(missing) > 0
    with pytest.raises(MissingCredentialsError):
        ga.fetch_data()

    ads = GoogleAdsConnector({})
    assert len(ads.validate_credentials()) > 0
    with pytest.raises(MissingCredentialsError):
        ads.fetch_data()

    shp = ShopifyConnector({})
    assert len(shp.validate_credentials()) > 0
    with pytest.raises(MissingCredentialsError):
        shp.fetch_data()

def test_connector_factory():
    c1 = get_connector("google_analytics", {})
    assert isinstance(c1, GoogleAnalyticsConnector)
    c2 = get_connector("google_ads", {})
    assert isinstance(c2, GoogleAdsConnector)
    c3 = get_connector("shopify", {})
    assert isinstance(c3, ShopifyConnector)
    c4 = get_connector("csv", {})
    assert isinstance(c4, CSVFallbackConnector)
