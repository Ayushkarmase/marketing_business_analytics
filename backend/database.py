from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, scoped_session
from config import Config
import os

engine = create_engine(
    Config.DATABASE_URL,
    echo=False,
    connect_args={"check_same_thread": False} if Config.DATABASE_URL.startswith("sqlite") else {}
)

db_session = scoped_session(sessionmaker(autocommit=False, autoflush=False, bind=engine))

Base = declarative_base()
Base.query = db_session.query_property()

def init_db():
    import models  # Ensure all models are registered with Base
    Base.metadata.create_all(bind=engine)
