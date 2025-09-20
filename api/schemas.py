from pydantic import BaseModel,Field
from typing import Optional,Dict,List

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

# 新增這個模型來處理登入請求的 JSON 資料
class LoginRequest(BaseModel):
    account: str
    password: str
    
    # 定義 API 請求的資料模型，客戶端需要提供這些資訊。
class CreateClassRequest(BaseModel):
    subject: str
    class_name: str

# 定義 Pydantic 模型來接收前端的 JSON 酬載
class TestCreate(BaseModel):
    class_id: str
    exam_name: str
    total_pages: int
    correct_answer: Dict[str, str]


# --- Pydantic 資料模型 ---
class StudentData(BaseModel):
    """
    定義單一學生的資料結構，用於批量上傳。
    """
    student_id: str
    name: str
    class_name: str = Field(alias='class')

class AddStudentsPayload(BaseModel):
    """
    定義整個 API 請求的資料結構，包含班級 ID 和學生列表。
    """
    class_id: str
    members: List[StudentData]

class StudentResponse(BaseModel):
    """
    定義從 API 回傳的學生資料結構。
    """
    id: str
    student_id: str
    name: str
    class_id: str
    class_name: str = Field(alias='class')

class StudentTestResponse(StudentResponse):
    """
    定義從 API 回傳的學生資料結構。
    """
    uploaded_pages_count: int
    
