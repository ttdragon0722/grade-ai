from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# 這裡使用 PyMySQL 驅動程式。
# "mysql+pymysql://" 表示使用 pymysql 驅動連線到 MySQL。
# 格式為：mysql+pymysql://使用者名稱:密碼@主機:port/資料庫名稱
SQLALCHEMY_DATABASE_URL = "mysql+pymysql://root:22371627@localhost:3306/gradeai"

# 建立資料庫引擎
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# 建立 SessionLocal 物件
# autocommit=False：表示當操作完成後，不會自動提交交易。
# autoflush=False：表示在 commit 之前，不會自動將 SQL 語句發送到資料庫。
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 建立一個依賴注入函式，用於在每個請求中獲取資料庫會話
def get_db():
    db = SessionLocal()
    try:
        yield db  # 將會話傳遞給 API 路由
    finally:
        db.close() # 請求結束後，關閉會話