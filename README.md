# Marketing Business Analytics Tool
**Final Year Project — Academic Year 2026-2027**

A unified marketing business analytics platform that connects authorized business data sources (Google Analytics 4, Google Ads, Shopify), ingests and cleans data through a 9-step automated pipeline, performs marketing analytics and ML-based customer segmentation/sales prediction, and presents the results through an interactive premium dashboard.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend API | Python 3.11, Flask, SQLAlchemy |
| Database | SQLite (dev fallback) / MySQL (production) |
| Data Pipeline | Pandas, NumPy |
| Machine Learning | scikit-learn (KMeans, RandomForestRegressor, LinearRegression) |
| External APIs | Google Analytics Data API v1, Google Ads API v18, Shopify Admin REST API |
| Frontend | React 18, Vite 8, Recharts, Lucide React |
| Tests | pytest (6 tests, 100% pass rate) |

---

## Core Workflow

`
CONNECT -> FETCH -> STORE -> CLEAN -> ANALYZE -> SEGMENT -> PREDICT -> VISUALIZE -> REPORT
`

Each step is tracked in the SyncLog audit table. Sync failures preserve previous valid data (validated in test suite).

---

## Quick Start

### Prerequisites
- Python 3.11+, pip
- Node.js 18+, npm
- MySQL (optional - SQLite auto-fallback is used if MySQL is unavailable)

### 1. Backend

`ash
cd backend
pip install -r requirements.txt
copy .env.example .env   # Edit .env with your real API keys
python app.py            # API at http://127.0.0.1:5000
`

The backend auto-seeds 90-day demo data on first run.

### 2. Frontend

`ash
cd frontend
npm install
npm run dev              # Dashboard at http://localhost:5173
`

### 3. Run Tests

`ash
cd backend
python -m pytest -v tests/
# Expected: 6 passed, 0 failed
`

---

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Business Owner | owner@aurora.com | demo1234 |
| Marketing Manager | marketing@aurora.com | demo1234 |
| Business Analyst | analyst@aurora.com | demo1234 |
| Company Admin | admin@aurora.com | demo1234 |

Use the Switch Role button in the Navbar to switch roles without re-logging in.

---

## Configuring Live API Connections

Edit backend/.env (copy from .env.example):

`ash
GA_PROPERTY_ID=123456789
GA_ACCESS_TOKEN=ya29.your_token
GOOGLE_ADS_DEVELOPER_TOKEN=xxxx
GOOGLE_ADS_CUSTOMER_ID=xxx-xxx-xxxx
SHOPIFY_SHOP_URL=your-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_xxxx
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DB=marketing_analytics
`

---

## API Reference

All endpoints are prefixed with /api.

### Auth
- POST /auth/login - Login with email + password
- POST /auth/register - Register new user
- GET  /auth/me - Get current user
- GET  /auth/users - List all users (admin)
- POST /auth/switch-role - Switch active user role

### Analytics
- GET /analytics/sales/summary - Revenue, AOV, orders, MoM growth
- GET /analytics/sales/trend - Daily revenue time-series
- GET /analytics/sales/products - Product performance ranking
- GET /analytics/customers/overview - CLV, churn rate, RFM summary
- GET /analytics/campaigns/summary - ROAS, CTR, CPC, conversion
- GET /analytics/campaigns/comparison - Per-campaign comparison
- GET /analytics/web/traffic-sources - GA4 traffic source breakdown
- GET /analytics/web/realtime - Live active users (GA4 Realtime)
- GET /analytics/funnel - Marketing funnel conversion rates

### Machine Learning
- GET/POST /ml/segmentation - K-Means RFM segmentation (dynamic labels)
- GET/POST /ml/forecast - Sales forecast (RandomForest or LinearRegression)

### Reports
- GET /reports/summary - Executive summary report
- GET /reports/actionable-insights - Business insights

### Data Sources
- GET  /datasources - List all data sources
- POST /datasources/:id/connect - Connect and test data source
- POST /datasources/:id/sync - Trigger manual sync
- POST /datasources/upload-csv - Upload CSV fallback data
- GET  /datasources/sync-logs - View sync audit logs

---

## Data Labeling (Specification Compliance)

| Badge | Meaning |
|-------|---------|
| REALTIME | Pulled live from GA4 Realtime API |
| SCHEDULED | Fetched on hourly sync schedule |
| HISTORICAL | CSV or historical import |
| SAMPLE DATA | Demo data - no live credentials configured |
| MODEL ESTIMATE | ML prediction - not a guaranteed outcome |

---

## User Roles

| Role | Capabilities |
|------|-------------|
| Business Owner | Full dashboard, reports, high-level KPIs |
| Marketing Manager | Campaigns, segmentation, funnel analytics |
| Business Analyst | All analytics, ML models, data export |
| Company Admin | All of the above + user management, system settings |

---

## Academic Compliance Notes

- Rule 8-9 (CSV Fallback): CSV upload is a fallback mechanism only, accessible in the Data Sources view.
- Rule 20-21 (Segmentation): K-Means cluster labels are dynamically derived from actual centroid RFM characteristics - not preset or hardcoded.
- Rule 22 (Model Disclaimers): All ML forecast outputs include explicit MODEL ESTIMATE disclaimers.
- Rule 11-13 (Sample Data): All demo/sample data records are tagged is_sample_data=True in the database.
- Rule 31 (Data Freshness): Every data panel displays its source, last sync timestamp, and freshness status.
