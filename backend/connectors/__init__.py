from connectors.base import BaseConnector, MissingCredentialsError, ConnectorRateLimitError
from connectors.google_analytics import GoogleAnalyticsConnector
from connectors.google_ads import GoogleAdsConnector
from connectors.shopify import ShopifyConnector
from connectors.csv_fallback import CSVFallbackConnector

def get_connector(provider: str, config: dict) -> BaseConnector:
    """Factory function returning the corresponding official API connector instance."""
    if provider == "google_analytics":
        return GoogleAnalyticsConnector(config)
    elif provider == "google_ads":
        return GoogleAdsConnector(config)
    elif provider == "shopify":
        return ShopifyConnector(config)
    elif provider == "csv":
        return CSVFallbackConnector(config)
    else:
        raise ValueError(f"Unsupported connector provider: {provider}")
