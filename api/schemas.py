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

# 新增一個 Pydantic 模型來處理每個題目的答案和分數
class CorrectAnswerItem(BaseModel):
    answer: str = Field(..., description="The correct answer for the question.")
    score: int = Field(..., ge=0, description="The score for the question.")

# 更新 TestCreate 模型，使其 correct_answer 欄位接受字典，
# 且字典的值為我們剛剛建立的 CorrectAnswerItem 模型
class TestCreate(BaseModel):
    class_id: str
    exam_name: str
    total_pages: int
    correct_answer: dict[str, CorrectAnswerItem]


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
    ai_result_count:int
    

# 定義 Pydantic 模型來處理輸出的資料格式
class StudentWithPhotos(BaseModel):
    id: str  # students table id
    student_id: str  # students table students_id
    name: str  # students table name
    class_name: str  # students table class
    photos: List[str]  # photo_id list from exam_pages table
    
