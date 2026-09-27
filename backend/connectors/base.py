from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
import logging

logger = logging.getLogger(__name__)

class MissingCredentialsError(Exception):
    """Raised when required official API credentials or OAuth tokens are missing."""
    def __init__(self, provider: str, missing_keys: List[str]):
        self.provider = provider
        self.missing_keys = missing_keys
        super().__init__(
            f"Missing required configuration/credentials for official API connector '{provider}': {', '.join(missing_keys)}"
        )


class ConnectorRateLimitError(Exception):
    """Raised when an external API rate limit is exceeded."""
    def __init__(self, provider: str, retry_after: int = 60):
        self.provider = provider
        self.retry_after = retry_after
        super().__init__(f"API rate limit exceeded for '{provider}'. Retry after {retry_after}s.")


class BaseConnector(ABC):
    """
    Abstract Base Connector defining the contract for all external API connectors.
    Ensures modularity, uniform error handling, pagination, and credentials isolation.
    """
    def __init__(self, provider_name: str, config: Dict[str, Any]):
        self.provider_name = provider_name
        self.config = config
        self.is_authenticated = False

    @abstractmethod
    def validate_credentials(self) -> List[str]:
        """Returns a list of missing configuration keys, empty if all required keys exist."""
        pass

    @abstractmethod
    def test_connection(self) -> Dict[str, Any]:
        """Tests the official API connection and returns status/metadata."""
        pass

    @abstractmethod
    def fetch_data(self, start_date: Optional[str] = None, end_date: Optional[str] = None, **kwargs) -> Dict[str, Any]:
        """Requests authorized data from external API within specified parameters."""
        pass
