-- Marketing Business Analytics Tool — MySQL Database Schema
-- Academic Year 2026–2027

CREATE DATABASE IF NOT EXISTS marketing_analytics CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE marketing_analytics;

-- Businesses
CREATE TABLE IF NOT EXISTS businesses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(100) DEFAULT 'e-commerce',
    currency VARCHAR(10) DEFAULT 'USD',
    timezone VARCHAR(50) DEFAULT 'UTC',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Users and Roles
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    business_id INT,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'business_owner',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Connected Data Sources
CREATE TABLE IF NOT EXISTS data_sources (
    id INT AUTO_INCREMENT PRIMARY KEY,
    business_id INT NOT NULL,
    provider VARCHAR(50) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'disconnected',
    data_type VARCHAR(50) DEFAULT 'scheduled',
    is_sample_data BOOLEAN DEFAULT FALSE,
    last_sync_at DATETIME NULL,
    last_sync_status VARCHAR(50) DEFAULT 'NEVER',
    last_error_message TEXT NULL,
    config_metadata TEXT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Synchronization Audit Log
CREATE TABLE IF NOT EXISTS sync_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    business_id INT NOT NULL,
    data_source_id INT NULL,
    provider VARCHAR(50) NOT NULL,
    sync_type VARCHAR(50) DEFAULT 'manual_sync_now',
    status VARCHAR(50) NOT NULL,
    records_processed INT DEFAULT 0,
    error_details TEXT NULL,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME NULL,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
    FOREIGN KEY (data_source_id) REFERENCES data_sources(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Normalized Customers
CREATE TABLE IF NOT EXISTS customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    business_id INT NOT NULL,
    source_id VARCHAR(100) NOT NULL,
    email VARCHAR(255) NULL,
    first_name VARCHAR(100) NULL,
    last_name VARCHAR(100) NULL,
    customer_type VARCHAR(50) DEFAULT 'new',
    total_spend DOUBLE DEFAULT 0.0,
    order_count INT DEFAULT 0,
    recency_days INT DEFAULT 0,
    frequency_score DOUBLE DEFAULT 0.0,
    monetary_score DOUBLE DEFAULT 0.0,
    cluster_id INT NULL,
    segment_label VARCHAR(100) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_biz_customer (business_id, source_id),
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Normalized Products
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    business_id INT NOT NULL,
    source_id VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    sku VARCHAR(100) NULL,
    price DOUBLE DEFAULT 0.0,
    category VARCHAR(100) DEFAULT 'General',
    inventory_quantity INT DEFAULT 0,
    total_units_sold INT DEFAULT 0,
    total_revenue DOUBLE DEFAULT 0.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_biz_product (business_id, source_id),
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Normalized Orders
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    business_id INT NOT NULL,
    customer_id INT NULL,
    source_id VARCHAR(100) NOT NULL,
    order_number VARCHAR(100) NOT NULL,
    order_date DATETIME NOT NULL,
    total_amount DOUBLE NOT NULL DEFAULT 0.0,
    tax_amount DOUBLE DEFAULT 0.0,
    discount_amount DOUBLE DEFAULT 0.0,
    status VARCHAR(50) DEFAULT 'completed',
    currency VARCHAR(10) DEFAULT 'USD',
    attribution_source VARCHAR(100) DEFAULT 'direct',
    attribution_campaign VARCHAR(100) NULL,
    UNIQUE KEY uk_biz_order (business_id, source_id),
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Normalized Advertising Campaigns
CREATE TABLE IF NOT EXISTS campaigns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    business_id INT NOT NULL,
    source_id VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    channel VARCHAR(50) DEFAULT 'google_ads',
    status VARCHAR(50) DEFAULT 'ACTIVE',
    impressions INT DEFAULT 0,
    clicks INT DEFAULT 0,
    cost DOUBLE DEFAULT 0.0,
    conversions INT DEFAULT 0,
    conversion_value DOUBLE DEFAULT 0.0,
    ctr DOUBLE DEFAULT 0.0,
    cpc DOUBLE DEFAULT 0.0,
    cpa DOUBLE DEFAULT 0.0,
    roas DOUBLE DEFAULT 0.0,
    date DATE NOT NULL,
    UNIQUE KEY uk_biz_campaign (business_id, source_id, date),
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Website Analytics & Visitor Activity (GA4)
CREATE TABLE IF NOT EXISTS web_metrics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    business_id INT NOT NULL,
    date DATE NOT NULL,
    sessions INT DEFAULT 0,
    active_users INT DEFAULT 0,
    new_users INT DEFAULT 0,
    pageviews INT DEFAULT 0,
    bounce_rate DOUBLE DEFAULT 0.0,
    avg_session_duration_sec DOUBLE DEFAULT 0.0,
    traffic_source VARCHAR(100) DEFAULT 'Organic Search',
    is_realtime BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Predictive Analytics Records
CREATE TABLE IF NOT EXISTS prediction_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    business_id INT NOT NULL,
    model_name VARCHAR(100) NOT NULL,
    target_metric VARCHAR(100) DEFAULT 'sales_revenue',
    forecast_date DATE NOT NULL,
    predicted_value DOUBLE NOT NULL,
    lower_bound DOUBLE DEFAULT 0.0,
    upper_bound DOUBLE DEFAULT 0.0,
    metric_mae DOUBLE DEFAULT 0.0,
    metric_rmse DOUBLE DEFAULT 0.0,
    metric_r2 DOUBLE DEFAULT 0.0,
    training_sample_size INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
