from app.services.crud_user import _normalize_password_for_bcrypt
result = _normalize_password_for_bcrypt('a' * 100)
print("Length:", len(result.encode('utf-8')))