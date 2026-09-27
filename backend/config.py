import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "marketing-analytics-secret-key-ay2026-2027")
    
    # Database configuration
    # Can use MySQL: mysql+pymysql://root:password@localhost:3306/marketing_analytics
    # Fallback to local SQLite if MySQL URL is not configured
    MYSQL_USER = os.getenv("MYSQL_USER", "")
    MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "")
    MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
    MYSQL_PORT = os.getenv("MYSQL_PORT", "3306")
    MYSQL_DB = os.getenv("MYSQL_DB", "marketing_analytics")
    
    if MYSQL_USER and MYSQL_PASSWORD:
        DATABASE_URL = f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DB}"
    else:
        DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'marketing_analytics.db'}")

    SQLALCHEMY_DATABASE_URI = DATABASE_URL
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Upload folder for CSV Fallback
    UPLOAD_FOLDER = BASE_DIR / "uploads"
    
    # Official API Credentials (Stored exclusively on the backend)
    GA_PROPERTY_ID = os.getenv("GA_PROPERTY_ID", "")
    GA_CREDENTIALS_PATH = os.getenv("GA_CREDENTIALS_PATH", "")
    
    GOOGLE_ADS_DEVELOPER_TOKEN = os.getenv("GOOGLE_ADS_DEVELOPER_TOKEN", "")
    GOOGLE_ADS_CLIENT_ID = os.getenv("GOOGLE_ADS_CLIENT_ID", "")
    GOOGLE_ADS_CLIENT_SECRET = os.getenv("GOOGLE_ADS_CLIENT_SECRET", "")
    GOOGLE_ADS_REFRESH_TOKEN = os.getenv("GOOGLE_ADS_REFRESH_TOKEN", "")
    GOOGLE_ADS_CUSTOMER_ID = os.getenv("GOOGLE_ADS_CUSTOMER_ID", "")
    
    SHOPIFY_SHOP_URL = os.getenv("SHOPIFY_SHOP_URL", "")
    SHOPIFY_ACCESS_TOKEN = os.getenv("SHOPIFY_ACCESS_TOKEN", "")
    
    # Freshness / Sync interval (minutes)
    SCHEDULED_SYNC_INTERVAL_MINUTES = int(os.getenv("SCHEDULED_SYNC_INTERVAL_MINUTES", "60"))
