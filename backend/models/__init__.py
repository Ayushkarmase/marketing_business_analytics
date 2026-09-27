from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Date, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class Business(Base):
    __tablename__ = "businesses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    industry = Column(String(100), default="e-commerce")
    currency = Column(String(10), default="USD")
    timezone = Column(String(50), default="UTC")
    created_at = Column(DateTime, default=datetime.utcnow)

    users = relationship("User", back_populates="business", cascade="all, delete-orphan")
    data_sources = relationship("DataSource", back_populates="business", cascade="all, delete-orphan")
    customers = relationship("Customer", back_populates="business", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="business", cascade="all, delete-orphan")
    products = relationship("Product", back_populates="business", cascade="all, delete-orphan")
    campaigns = relationship("Campaign", back_populates="business", cascade="all, delete-orphan")
    web_metrics = relationship("WebMetric", back_populates="business", cascade="all, delete-orphan")
    predictions = relationship("PredictionRecord", back_populates="business", cascade="all, delete-orphan")
    sync_logs = relationship("SyncLog", back_populates="business", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "industry": self.industry,
            "currency": self.currency,
            "timezone": self.timezone,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=True)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default="business_owner")  # business_owner, marketing_manager, business_analyst, company_admin
    created_at = Column(DateTime, default=datetime.utcnow)

    business = relationship("Business", back_populates="users")

    def to_dict(self):
        return {
            "id": self.id,
            "business_id": self.business_id,
            "email": self.email,
            "full_name": self.full_name,
            "role": self.role,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class DataSource(Base):
    __tablename__ = "data_sources"

    id = Column(Integer, primary_key=True, autoincrement=True)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False)
    provider = Column(String(50), nullable=False)  # google_analytics, google_ads, shopify, csv
    display_name = Column(String(100), nullable=False)
    status = Column(String(50), default="disconnected")  # connected, disconnected, syncing, error
    data_type = Column(String(50), default="scheduled")  # realtime, near_realtime, scheduled, historical, sample_demo
    is_sample_data = Column(Boolean, default=False)
    last_sync_at = Column(DateTime, nullable=True)
    last_sync_status = Column(String(50), default="NEVER")  # SUCCESS, FAILED, NEVER
    last_error_message = Column(Text, nullable=True)
    config_metadata = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    business = relationship("Business", back_populates="data_sources")
    sync_logs = relationship("SyncLog", back_populates="data_source", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "business_id": self.business_id,
            "provider": self.provider,
            "display_name": self.display_name,
            "status": self.status,
            "data_type": self.data_type,
            "is_sample_data": self.is_sample_data,
            "last_sync_at": self.last_sync_at.isoformat() if self.last_sync_at else None,
            "last_sync_status": self.last_sync_status,
            "last_error_message": self.last_error_message,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class SyncLog(Base):
    __tablename__ = "sync_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False)
    data_source_id = Column(Integer, ForeignKey("data_sources.id"), nullable=True)
    provider = Column(String(50), nullable=False)
    sync_type = Column(String(50), default="manual_sync_now")  # manual_sync_now, scheduled, initial
    status = Column(String(50), nullable=False)  # SUCCESS, FAILED, IN_PROGRESS
    records_processed = Column(Integer, default=0)
    error_details = Column(Text, nullable=True)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    business = relationship("Business", back_populates="sync_logs")
    data_source = relationship("DataSource", back_populates="sync_logs")

    def to_dict(self):
        return {
            "id": self.id,
            "business_id": self.business_id,
            "data_source_id": self.data_source_id,
            "provider": self.provider,
            "sync_type": self.sync_type,
            "status": self.status,
            "records_processed": self.records_processed,
            "error_details": self.error_details,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None
        }


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, autoincrement=True)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False)
    source_id = Column(String(100), nullable=False)  # Stable external identifier
    email = Column(String(255), nullable=True)
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    customer_type = Column(String(50), default="new")  # new, returning
    total_spend = Column(Float, default=0.0)
    order_count = Column(Integer, default=0)
    recency_days = Column(Integer, default=0)  # Days since last order
    frequency_score = Column(Float, default=0.0)
    monetary_score = Column(Float, default=0.0)
    cluster_id = Column(Integer, nullable=True)
    segment_label = Column(String(100), nullable=True)  # Dynamic cluster interpretation
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    business = relationship("Business", back_populates="customers")
    orders = relationship("Order", back_populates="customer")

    def to_dict(self):
        return {
            "id": self.id,
            "business_id": self.business_id,
            "source_id": self.source_id,
            "email": self.email,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "customer_type": self.customer_type,
            "total_spend": round(self.total_spend, 2),
            "order_count": self.order_count,
            "recency_days": self.recency_days,
            "cluster_id": self.cluster_id,
            "segment_label": self.segment_label,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, autoincrement=True)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False)
    source_id = Column(String(100), nullable=False)
    title = Column(String(255), nullable=False)
    sku = Column(String(100), nullable=True)
    price = Column(Float, default=0.0)
    category = Column(String(100), default="General")
    inventory_quantity = Column(Integer, default=0)
    total_units_sold = Column(Integer, default=0)
    total_revenue = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    business = relationship("Business", back_populates="products")

    def to_dict(self):
        return {
            "id": self.id,
            "business_id": self.business_id,
            "source_id": self.source_id,
            "title": self.title,
            "sku": self.sku,
            "price": round(self.price, 2),
            "category": self.category,
            "inventory_quantity": self.inventory_quantity,
            "total_units_sold": self.total_units_sold,
            "total_revenue": round(self.total_revenue, 2)
        }


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, autoincrement=True)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    source_id = Column(String(100), nullable=False)
    order_number = Column(String(100), nullable=False)
    order_date = Column(DateTime, nullable=False)
    total_amount = Column(Float, nullable=False, default=0.0)
    tax_amount = Column(Float, default=0.0)
    discount_amount = Column(Float, default=0.0)
    status = Column(String(50), default="completed")
    currency = Column(String(10), default="USD")
    attribution_source = Column(String(100), default="direct")
    attribution_campaign = Column(String(100), nullable=True)

    business = relationship("Business", back_populates="orders")
    customer = relationship("Customer", back_populates="orders")

    def to_dict(self):
        return {
            "id": self.id,
            "business_id": self.business_id,
            "customer_id": self.customer_id,
            "source_id": self.source_id,
            "order_number": self.order_number,
            "order_date": self.order_date.isoformat() if self.order_date else None,
            "total_amount": round(self.total_amount, 2),
            "status": self.status,
            "currency": self.currency,
            "attribution_source": self.attribution_source,
            "attribution_campaign": self.attribution_campaign
        }


class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(Integer, primary_key=True, autoincrement=True)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False)
    source_id = Column(String(100), nullable=False)
    name = Column(String(255), nullable=False)
    channel = Column(String(50), default="google_ads")
    status = Column(String(50), default="ACTIVE")
    impressions = Column(Integer, default=0)
    clicks = Column(Integer, default=0)
    cost = Column(Float, default=0.0)
    conversions = Column(Integer, default=0)
    conversion_value = Column(Float, default=0.0)
    ctr = Column(Float, default=0.0)
    cpc = Column(Float, default=0.0)
    cpa = Column(Float, default=0.0)
    roas = Column(Float, default=0.0)
    date = Column(Date, nullable=False)

    business = relationship("Business", back_populates="campaigns")

    def to_dict(self):
        return {
            "id": self.id,
            "business_id": self.business_id,
            "source_id": self.source_id,
            "name": self.name,
            "channel": self.channel,
            "status": self.status,
            "impressions": self.impressions,
            "clicks": self.clicks,
            "cost": round(self.cost, 2),
            "conversions": self.conversions,
            "conversion_value": round(self.conversion_value, 2),
            "ctr": round(self.ctr, 4),
            "cpc": round(self.cpc, 2),
            "cpa": round(self.cpa, 2),
            "roas": round(self.roas, 2),
            "date": self.date.isoformat() if self.date else None
        }


class WebMetric(Base):
    __tablename__ = "web_metrics"

    id = Column(Integer, primary_key=True, autoincrement=True)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False)
    date = Column(Date, nullable=False)
    sessions = Column(Integer, default=0)
    active_users = Column(Integer, default=0)
    new_users = Column(Integer, default=0)
    pageviews = Column(Integer, default=0)
    bounce_rate = Column(Float, default=0.0)
    avg_session_duration_sec = Column(Float, default=0.0)
    traffic_source = Column(String(100), default="Organic Search")
    is_realtime = Column(Boolean, default=False)

    business = relationship("Business", back_populates="web_metrics")

    def to_dict(self):
        return {
            "id": self.id,
            "business_id": self.business_id,
            "date": self.date.isoformat() if self.date else None,
            "sessions": self.sessions,
            "active_users": self.active_users,
            "new_users": self.new_users,
            "pageviews": self.pageviews,
            "bounce_rate": round(self.bounce_rate, 4),
            "avg_session_duration_sec": round(self.avg_session_duration_sec, 1),
            "traffic_source": self.traffic_source,
            "is_realtime": self.is_realtime
        }


class PredictionRecord(Base):
    __tablename__ = "prediction_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False)
    model_name = Column(String(100), nullable=False)
    target_metric = Column(String(100), default="sales_revenue")
    forecast_date = Column(Date, nullable=False)
    predicted_value = Column(Float, nullable=False)
    lower_bound = Column(Float, default=0.0)
    upper_bound = Column(Float, default=0.0)
    metric_mae = Column(Float, default=0.0)
    metric_rmse = Column(Float, default=0.0)
    metric_r2 = Column(Float, default=0.0)
    training_sample_size = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    business = relationship("Business", back_populates="predictions")

    def to_dict(self):
        return {
            "id": self.id,
            "business_id": self.business_id,
            "model_name": self.model_name,
            "target_metric": self.target_metric,
            "forecast_date": self.forecast_date.isoformat() if self.forecast_date else None,
            "predicted_value": round(self.predicted_value, 2),
            "lower_bound": round(self.lower_bound, 2),
            "upper_bound": round(self.upper_bound, 2),
            "metric_mae": round(self.metric_mae, 2),
            "metric_rmse": round(self.metric_rmse, 2),
            "metric_r2": round(self.metric_r2, 4),
            "training_sample_size": self.training_sample_size,
            "is_model_estimate": True,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
