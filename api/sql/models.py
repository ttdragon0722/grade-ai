# File: models.py
from dataclasses import dataclass, field
from typing import Optional, List, Dict
from datetime import datetime
import uuid

# Teachers (老師)

@dataclass
class Teacher:
    """Represents a teacher in the database."""
    # 將沒有預設值的欄位放在最前面
    name: str
    account: str
    password: str
    
    # 然後放有預設值的欄位
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    office: Optional[str] = None

# Classes (班級)
@dataclass
class Class:
    """Represents a class taught by a teacher."""
    teacher_id: str
    subject: str
    class_name: str
    id: str = field(default_factory=lambda: str(uuid.uuid4()))

# Students (學生)
@dataclass
class Student:
    """Represents a student enrolled in a class."""
    student_id: str
    name: str
    class_id: str
    id: str = field(default_factory=lambda: str(uuid.uuid4()))

# Exams (考試)
@dataclass
class Exam:
    """Represents an exam given to a class."""
    teacher_id: str
    class_id: str
    exam_name: str
    total_pages: int
    correct_answer: dict
    id: str = field(default_factory=lambda: str(uuid.uuid4()))

# Exam_Pages (考卷頁面)
@dataclass
class ExamPage:
    """Represents a single page of a student's exam."""
    exam_id: str
    student_id: str
    page_number: int
    photo_path: str
    ai_result: dict
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    
# Ai_Results (AI 批改結果)
@dataclass
class AiResult:
    """Represents the AI grading results for a single exam page."""
    __tablename__ = 'ai_result'
    exam_page_id: str
    result: Dict
    score: int
    save_path: List[str] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    id: str = field(default_factory=lambda: str(uuid.uuid4()))