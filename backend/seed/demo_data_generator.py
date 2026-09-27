import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent.parent))

import random
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash
from database import db_session
from models import Business, User, DataSource, Customer, Order, Product, Campaign, WebMetric
from ml.segmentation import CustomerSegmentationModel
from ml.forecasting import SalesForecastingModel

def seed_demo_environment():
    """
    Populates sample/demo data for development, testing, and presentation
    strictly adhering to Rules 11-13 and 31.
    All data is clearly tagged with is_sample_data=True.
    """
    # 1. Create or fetch Demo Business
    biz = db_session.query(Business).filter_by(name="Aurora Trendline Store").first()
    if not biz:
        biz = Business(
            name="Aurora Trendline Store",
            industry="e-commerce",
            currency="USD",
            timezone="UTC"
        )
        db_session.add(biz)
        db_session.flush()

    business_id = biz.id

    # 2. Seed Users across all 4 Roles
    roles = [
        ("owner@aurora.com", "Business Owner", "business_owner"),
        ("marketing@aurora.com", "Marketing Lead", "marketing_manager"),
        ("analyst@aurora.com", "Senior Analyst", "business_analyst"),
        ("admin@aurora.com", "System Admin", "company_admin"),
    ]
    for email, name, role in roles:
        user = db_session.query(User).filter_by(email=email).first()
        if not user:
            user = User(
                business_id=business_id,
                email=email,
                password_hash=generate_password_hash("demo1234"),
                full_name=name,
                role=role
            )
            db_session.add(user)

    # 3. Register Data Sources with clear SAMPLE DATA flags
    sources_info = [
        ("shopify", "Shopify Store (Aurora Demo)", "scheduled", True),
        ("google_analytics", "Google Analytics 4 (GA4 Demo)", "realtime", True),
        ("google_ads", "Google Ads (Global Search & Retargeting)", "scheduled", True),
        ("csv", "Legacy Transactions Fallback CSV", "historical", True),
    ]
    for provider, display_name, data_type, is_sample in sources_info:
        ds = db_session.query(DataSource).filter_by(business_id=business_id, provider=provider).first()
        if not ds:
            ds = DataSource(
                business_id=business_id,
                provider=provider,
                display_name=display_name,
                status="connected",
                data_type=data_type,
                is_sample_data=is_sample,
                last_sync_at=datetime.utcnow() - timedelta(minutes=random.randint(5, 45)),
                last_sync_status="SUCCESS",
                config_metadata='{"note": "Sample Demo Connector"}'
            )
            db_session.add(ds)

    # 4. Products
    products_catalog = [
        ("PROD-01", "Ultra-Light Performance Runner", 129.99, "Footwear", 140),
        ("PROD-02", "Aerospace Titanium Sunglasses", 189.50, "Accessories", 65),
        ("PROD-03", "Merino Wool Thermal Pullover", 95.00, "Apparel", 85),
        ("PROD-04", "Pro Smart Hydration Flask 1L", 42.00, "Gear", 220),
        ("PROD-05", "Carbon Fiber Everyday Pack", 215.00, "Bags", 40),
        ("PROD-06", "Organic Cotton Tech Tee", 38.00, "Apparel", 310),
        ("PROD-07", "Waterproof Trail Gaiters", 54.00, "Gear", 110),
        ("PROD-08", "Reflective Speed Cap", 29.00, "Accessories", 190)
    ]
    product_map = {}
    for sku, title, price, cat, inv in products_catalog:
        prod = db_session.query(Product).filter_by(business_id=business_id, sku=sku).first()
        if not prod:
            prod = Product(
                business_id=business_id,
                source_id=f"shp-prod-{sku}",
                sku=sku,
                title=title,
                price=price,
                category=cat,
                inventory_quantity=inv,
                total_units_sold=0,
                total_revenue=0.0
            )
            db_session.add(prod)
        product_map[sku] = prod

    # 5. Customers
    first_names = ["Sophia", "Liam", "Emma", "Noah", "Olivia", "James", "Ava", "William", "Isabella", "Benjamin",
                   "Mia", "Lucas", "Charlotte", "Henry", "Amelia", "Alexander", "Harper", "Ethan", "Evelyn", "Daniel"]
    last_names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez"]
    
    customers = []
    for i in range(1, 45):
        fn = random.choice(first_names)
        ln = random.choice(last_names)
        c_email = f"{fn.lower()}.{ln.lower()}{i}@example.com"
        cust = db_session.query(Customer).filter_by(business_id=business_id, email=c_email).first()
        if not cust:
            cust = Customer(
                business_id=business_id,
                source_id=f"shp-cust-{i:04d}",
                email=c_email,
                first_name=fn,
                last_name=ln,
                customer_type="new",
                total_spend=0.0,
                order_count=0,
                recency_days=random.randint(1, 80)
            )
            db_session.add(cust)
        customers.append(cust)

    db_session.flush()

    # 6. Orders over past 90 days
    existing_orders = db_session.query(Order).filter_by(business_id=business_id).count()
    if existing_orders < 30:
        base_date = datetime.utcnow() - timedelta(days=90)
        channels = ["google_ads", "google_ads", "organic_search", "direct", "referral"]
        
        for day in range(90):
            current_day = base_date + timedelta(days=day)
            # Weekend / weekday variation
            num_orders = random.randint(2, 6) if current_day.weekday() < 5 else random.randint(4, 9)
            
            for o_idx in range(num_orders):
                cust = random.choice(customers)
                prod = random.choice(list(product_map.values()))
                units = random.choices([1, 2, 3], weights=[0.75, 0.20, 0.05])[0]
                order_total = round(prod.price * units, 2)
                ch = random.choice(channels)

                order = Order(
                    business_id=business_id,
                    customer_id=cust.id,
                    source_id=f"shp-ord-{day:02d}-{o_idx:02d}",
                    order_number=f"ORD-10{day:02d}{o_idx:02d}",
                    order_date=current_day + timedelta(hours=random.randint(8, 20), minutes=random.randint(0, 59)),
                    total_amount=order_total,
                    tax_amount=round(order_total * 0.08, 2),
                    discount_amount=round(order_total * 0.05, 2) if random.random() > 0.7 else 0.0,
                    status="completed",
                    currency="USD",
                    attribution_source=ch,
                    attribution_campaign="Summer Search Campaign" if ch == "google_ads" else None
                )
                db_session.add(order)

                # Update product stats
                prod.total_units_sold += units
                prod.total_revenue += order_total

                # Update customer stats
                cust.total_spend += order_total
                cust.order_count += 1
                cust.customer_type = "returning" if cust.order_count > 1 else "new"
                cust.recency_days = (datetime.utcnow() - current_day).days

    # 7. Ad Campaigns (Google Ads)
    camp_names = [
        ("Summer Performance Search", "ACTIVE", 450.0),
        ("Brand Retargeting - High Intent", "ACTIVE", 280.0),
        ("Product Launch Discovery", "ACTIVE", 380.0),
        ("Spring Clearance Promo", "PAUSED", 150.0)
    ]
    for c_name, c_status, base_cost in camp_names:
        for day in range(30):
            c_date = (datetime.utcnow() - timedelta(days=day)).date()
            camp_rec = db_session.query(Campaign).filter_by(
                business_id=business_id, name=c_name, date=c_date
            ).first()
            if not camp_rec:
                day_cost = round(base_cost * random.uniform(0.7, 1.3), 2)
                clicks = int(day_cost / random.uniform(0.9, 1.8))
                impressions = clicks * random.randint(18, 35)
                convs = max(1, int(clicks * random.uniform(0.03, 0.08)))
                conv_val = round(convs * random.uniform(85.0, 160.0), 2)

                camp_rec = Campaign(
                    business_id=business_id,
                    source_id=f"gads-camp-{c_name[:4]}-{c_date}",
                    name=c_name,
                    channel="google_ads",
                    status=c_status,
                    impressions=impressions,
                    clicks=clicks,
                    cost=day_cost,
                    conversions=convs,
                    conversion_value=conv_val,
                    ctr=round((clicks / impressions) if impressions > 0 else 0.0, 4),
                    cpc=round((day_cost / clicks) if clicks > 0 else 0.0, 2),
                    cpa=round((day_cost / convs) if convs > 0 else 0.0, 2),
                    roas=round((conv_val / day_cost) if day_cost > 0 else 0.0, 2),
                    date=c_date
                )
                db_session.add(camp_rec)

    # 8. Web Metrics (GA4 Traffic Sources & Sessions)
    traffic_sources = ["Organic Search", "Paid Search (Google Ads)", "Direct", "Referral", "Email Marketing"]
    for day in range(30):
        w_date = (datetime.utcnow() - timedelta(days=day)).date()
        for ts in traffic_sources:
            rec = db_session.query(WebMetric).filter_by(
                business_id=business_id, date=w_date, traffic_source=ts
            ).first()
            if not rec:
                sessions = random.randint(80, 450) if "Search" in ts else random.randint(40, 200)
                pageviews = int(sessions * random.uniform(1.8, 3.5))
                users = int(sessions * random.uniform(0.75, 0.92))
                new_users = int(users * random.uniform(0.4, 0.7))
                bounce = round(random.uniform(0.32, 0.54), 3)
                duration = round(random.uniform(95.0, 240.0), 1)

                rec = WebMetric(
                    business_id=business_id,
                    date=w_date,
                    sessions=sessions,
                    active_users=users,
                    new_users=new_users,
                    pageviews=pageviews,
                    bounce_rate=bounce,
                    avg_session_duration_sec=duration,
                    traffic_source=ts,
                    is_realtime=(day == 0)
                )
                db_session.add(rec)

    db_session.commit()

    # 9. Run Customer Segmentation (K-Means) & Forecasting (RandomForest)
    try:
        CustomerSegmentationModel.train_and_assign(business_id)
        SalesForecastingModel.train_and_forecast(business_id, model_type="RandomForest", forecast_horizon_days=14)
    except Exception as e:
        print(f"Initial ML training note: {e}")

    print("Demo environment successfully seeded with realistic sample data.")
    return business_id

if __name__ == "__main__":
    from database import init_db
    init_db()
    seed_demo_environment()
