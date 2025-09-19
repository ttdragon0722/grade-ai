from pydantic import BaseModel
from typing import Optional

# 這是老師註冊時，從前端接收的資料格式
class TeacherCreate(BaseModel):
    name: str
    account: str
    password: str
    office: Optional[str] = None

# 這是回傳給前端的老師公開資料格式，不包含密碼
class TeacherPublic(BaseModel):
    id: str
    name: str
    office: Optional[str]
    account: str