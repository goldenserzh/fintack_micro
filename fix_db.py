from app.core.config import engine
from sqlalchemy import text

with engine.connect() as conn:
    conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false"))
    conn.execute(text("ALTER TABLE profile ADD COLUMN IF NOT EXISTS goal_amount NUMERIC(10,2)"))
    conn.commit()
    print("Готово! Колонки добавлены.")
