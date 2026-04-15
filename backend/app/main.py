from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from . import models
from .database import engine, Base, SessionLocal
from .routers import router

Base.metadata.create_all(bind=engine)


def seed_default_users() -> None:
    db = SessionLocal()
    try:
        default_users = [
            {"name": "Avery Chen", "role": "rep"},
            {"name": "Morgan Lee", "role": "manager"},
            {"name": "Jordan Patel", "role": "finance"},
        ]

        for user in default_users:
            existing_user = (
                db.query(models.User)
                .filter(models.User.name == user["name"], models.User.role == user["role"])
                .first()
            )
            if not existing_user:
                db.add(models.User(name=user["name"], role=user["role"]))

        db.commit()
    finally:
        db.close()


seed_default_users()

app = FastAPI(title="Quote to Invoice API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://quote-to-invoice.vercel.app",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")

@app.get("/")
def root():
    return {"message": "Quote to Invoice API is running"}
