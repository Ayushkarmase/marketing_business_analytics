import os
import requests
from typing import Dict, Any, List, Optional
from datetime import datetime
from connectors.base import BaseConnector, MissingCredentialsError

class ShopifyConnector(BaseConnector):
    """
    Official Shopify Admin REST API Connector.
    Retrieves store information including Products, Orders, and Customers.
    """
    def __init__(self, config: Dict[str, Any]):
        super().__init__("shopify", config)
        shop_url = config.get("shop_url") or os.getenv("SHOPIFY_SHOP_URL", "")
        # Normalize shop domain: remove https:// and trailing slashes
        shop_url = shop_url.replace("https://", "").replace("http://", "").strip("/")
        self.shop_url = shop_url
        self.access_token = config.get("access_token") or os.getenv("SHOPIFY_ACCESS_TOKEN", "")
        self.api_version = config.get("api_version", "2024-01")

    def validate_credentials(self) -> List[str]:
        missing = []
        if not self.shop_url:
            missing.append("shop_url (e.g. your-store.myshopify.com)")
        if not self.access_token:
            missing.append("access_token (Shopify Admin Access Token)")
        return missing

    @property
    def base_url(self) -> str:
        return f"https://{self.shop_url}/admin/api/{self.api_version}"

    @property
    def headers(self) -> Dict[str, str]:
        return {
            "X-Shopify-Access-Token": self.access_token,
            "Content-Type": "application/json"
        }

    def test_connection(self) -> Dict[str, Any]:
        missing = self.validate_credentials()
        if missing:
            return {
                "success": False,
                "provider": self.provider_name,
                "message": f"Shopify requires: {', '.join(missing)}",
                "missing_credentials": missing
            }
        
        try:
            res = requests.get(f"{self.base_url}/shop.json", headers=self.headers, timeout=10)
            if res.status_code == 200:
                shop_data = res.json().get("shop", {})
                return {
                    "success": True,
                    "provider": self.provider_name,
                    "message": f"Connected to Shopify Store: {shop_data.get('name', self.shop_url)}",
                    "shop_name": shop_data.get("name"),
                    "currency": shop_data.get("currency")
                }
            return {"success": False, "provider": self.provider_name, "message": f"Shopify API Error: {res.text}", "status_code": res.status_code}
        except Exception as e:
            return {"success": False, "provider": self.provider_name, "message": str(e)}

    def fetch_data(self, start_date: Optional[str] = None, end_date: Optional[str] = None, **kwargs) -> Dict[str, Any]:
        missing = self.validate_credentials()
        if missing:
            raise MissingCredentialsError(self.provider_name, missing)

        orders_params = {"status": "any", "limit": 250}
        if start_date:
            orders_params["created_at_min"] = start_date

        # 1. Fetch Orders
        orders_res = requests.get(f"{self.base_url}/orders.json", headers=self.headers, params=orders_params, timeout=15)
        if orders_res.status_code != 200:
            raise Exception(f"Failed to fetch Shopify orders: {orders_res.text}")
        raw_orders = orders_res.json().get("orders", [])

        # 2. Fetch Products
        products_res = requests.get(f"{self.base_url}/products.json", headers=self.headers, params={"limit": 250}, timeout=15)
        raw_products = products_res.json().get("products", []) if products_res.status_code == 200 else []

        # 3. Fetch Customers
        customers_res = requests.get(f"{self.base_url}/customers.json", headers=self.headers, params={"limit": 250}, timeout=15)
        raw_customers = customers_res.json().get("customers", []) if customers_res.status_code == 200 else []

        # Normalize Orders
        normalized_orders = []
        for o in raw_orders:
            cust = o.get("customer") or {}
            normalized_orders.append({
                "source_id": str(o.get("id")),
                "order_number": str(o.get("order_number", o.get("name", ""))),
                "order_date": o.get("created_at"),
                "total_amount": float(o.get("total_price", 0.0)),
                "tax_amount": float(o.get("total_tax", 0.0)),
                "discount_amount": float(o.get("total_discounts", 0.0)),
                "status": o.get("financial_status", "completed"),
                "currency": o.get("currency", "USD"),
                "customer_source_id": str(cust.get("id")) if cust.get("id") else None,
                "attribution_source": o.get("referring_site") or "direct"
            })

        # Normalize Products
        normalized_products = []
        for p in raw_products:
            variants = p.get("variants", [{}])
            first_variant = variants[0] if variants else {}
            total_inv = sum(v.get("inventory_quantity", 0) for v in variants if v.get("inventory_quantity") is not None)
            normalized_products.append({
                "source_id": str(p.get("id")),
                "title": p.get("title", "Untitled Product"),
                "sku": first_variant.get("sku", ""),
                "price": float(first_variant.get("price", 0.0)),
                "category": p.get("product_type") or "General",
                "inventory_quantity": total_inv
            })

        # Normalize Customers
        normalized_customers = []
        for c in raw_customers:
            normalized_customers.append({
                "source_id": str(c.get("id")),
                "email": c.get("email"),
                "first_name": c.get("first_name", ""),
                "last_name": c.get("last_name", ""),
                "total_spend": float(c.get("total_spent", 0.0)),
                "order_count": int(c.get("orders_count", 0)),
                "customer_type": "returning" if int(c.get("orders_count", 0)) > 1 else "new"
            })

        return {
            "provider": self.provider_name,
            "orders": normalized_orders,
            "products": normalized_products,
            "customers": normalized_customers
        }
