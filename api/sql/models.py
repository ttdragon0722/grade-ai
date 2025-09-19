# File: models.py

from dataclasses import dataclass, field
from typing import Optional
import uuid

# Teachers (老師)
@dataclass
class Teacher:
    """Represents a teacher in the database."""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    account: str
    password: str
    office: Optional[str] = None

# Classes (班級)
@dataclass
class Class:
    """Represents a class taught by a teacher."""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    teacher_id: str
    subject: str
    class_name: str

# Students (學生)
@dataclass
class Student:
    """Represents a student enrolled in a class."""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    student_id: str
    name: str
    class_id: str

# Exams (考試)
@dataclass
class Exam:
    """Represents an exam given to a class."""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    teacher_id: str
    class_id: str
    exam_name: str
    total_pages: int
    correct_answer: dict

# Exam_Pages (考卷頁面)
@dataclass
class ExamPage:
    """Represents a single page of a student's exam."""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    exam_id: str
    student_id: str
    page_number: int
    photo_path: str
    ai_result: dict