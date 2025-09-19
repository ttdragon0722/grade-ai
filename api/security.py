from passlib.context import CryptContext
from itsdangerous import URLSafeTimedSerializer
from typing import Optional
from datetime import datetime, timedelta

# 設定密碼加密演算法
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 密碼雜湊與驗證
def get_password_hash(password: str) -> str:
    """將密碼雜湊（加鹽）"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """驗證明文密碼是否與雜湊密碼相符"""
    return pwd_context.verify(plain_password, hashed_password)

# Session 相關設定
# 請務必更改此 SECRET_KEY，它用於簽名，確保 Session 資料安全
SECRET_KEY = "rex&happy_alisa"
serializer = URLSafeTimedSerializer(SECRET_KEY)

# 創建 Session Token
def create_session_token(data: dict) -> str:
    """創建一個帶簽名和過期時間的 Session Token"""
    return serializer.dumps(data)

# 驗證 Session Token
def verify_session_token(token: str, max_age: Optional[int] = 3600) -> Optional[dict]:
    """驗證 Session Token，如果有效則回傳資料，否則回傳 None"""
    try:
        # max_age 參數設定 Token 的最長有效期限（秒）
        data = serializer.loads(token, max_age=max_age)
        return data
    except Exception:
        # Token 無效或過期時會拋出異常
        return None