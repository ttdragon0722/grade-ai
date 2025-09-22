from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, File,Request, Form,Query
import time
from pathlib import Path
import shutil
import json
import os
from datetime import datetime
import mimetypes

# 從你的自訂模組中匯入初始化函數
# ai
from model_loader import initialize_model
from detect import detect_images,detect_images_v2


from schemas import *
from fastapi import FastAPI, Depends, HTTPException, status, Response
from fastapi.responses import JSONResponse, FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import text  # 匯入 text 模組
from sqlalchemy.exc import SQLAlchemyError
from sql.database import get_db
from sql.models import Teacher,Class, Exam, AiResult
from security import get_password_hash, verify_password, create_session_token, verify_session_token
from uuid import uuid4
from schemas import LoginRequest, TeacherPublic # 從 schemas.py 匯入新的模型
from typing import Optional, List, Dict


# 全域變數來儲存模型和相關配置
app_state = {}
UPLOAD_FOLDER = "upload"

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 啟動事件
    print("Application startup...")
    
    # 載入並暖機模型
    weights_file = Path("weights/yolobest.pt")
    model_data = initialize_model(str(weights_file))
    
    # 將模型和相關資料儲存到 app_state
    app_state["model"] = model_data["model"]
    app_state["device"] = model_data["device"]
    app_state["half"] = model_data["half"]
    app_state["imgsz"] = model_data["imgsz"]
    
    yield
    
    # 關閉事件
    print("Application shutdown...")
    # 在這裡可以釋放資源，例如關閉資料庫連線等

# 2. 創建 FastAPI 應用程式，並傳入 lifespan
app = FastAPI(lifespan=lifespan)

@app.get("/")
def root():
    return {"root": "HelloWorld"}

@app.get("/test_demo")
def test_demo():
    return detect_images(
        "data/demo.jpg",
        app_state["model"],
        app_state["device"],
        app_state["half"],
        app_state["imgsz"],
        ""
    )
# --- 登入 API ---
@app.post("/login")
def login(request_data: LoginRequest, response: Response, db: Session = Depends(get_db)):
    """
    驗證使用者帳號和密碼，並建立登入 Session
    """
    # 1. 使用 SQL 字串依據帳號查詢資料庫
    sql_query = text("SELECT id, name, office, account, password FROM Teachers WHERE account = :account LIMIT 1")
    result = db.execute(sql_query, {"account": request_data.account}).first()
    
    # 將查詢結果轉換為字典
    if not result:
        db_teacher = None
    else:
        db_teacher = {
            "id": result.id,
            "name": result.name,
            "office": result.office,
            "account": result.account,
            "password": result.password
        }

    # 如果找不到帳號
    if not db_teacher:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid account or password",
        )

    # 2. 驗證密碼
    if not verify_password(request_data.password, db_teacher['password']):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid account or password",
        )

    # 3. 如果驗證成功，建立 Session Token
    session_data = {"user_id": db_teacher['id'], "account": db_teacher['account']}
    session_token = create_session_token(session_data)

    # 4. 將 Session Token 存在瀏覽器的 Cookie 中
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        samesite="strict"
    )

    # 5. 回傳成功的訊息與使用者資訊
    teacher_public = TeacherPublic(
        id=db_teacher['id'],
        name=db_teacher['name'],
        office=db_teacher['office'],
        account=db_teacher['account']
    )
    return {"message": "Login successful", "user_info": teacher_public}


@app.get("/auth")
def authenticate_session(request: Request, db: Session = Depends(get_db)):
    """
    驗證 Session Token，並回傳登入者的公開資訊
    """
    # 1. 從請求的 Cookie 中取得 Session Token
    session_token = request.cookies.get("session_token")
    if not session_token:
        # 如果沒有 Token，表示未登入
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    # 2. 驗證 Session Token 是否有效且未過期
    session_data = verify_session_token(session_token)
    if not session_data:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired or invalid")

    # 3. 從 Session Data 取得使用者 ID
    user_id = session_data.get("user_id")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session data")

    # 4. 使用 SQL 語法查詢資料庫，取得使用者資訊
    sql_query = text("SELECT id, name, office, account FROM Teachers WHERE id = :user_id LIMIT 1")
    result = db.execute(sql_query, {"user_id": user_id}).first()

    if not result:
        # 如果找不到使用者，表示 Token 雖然有效但使用者不存在
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    
    # 將結果轉換為 Pydantic 模型並回傳
    teacher_public = TeacherPublic(
        id=result.id,
        name=result.name,
        office=result.office,
        account=result.account
    )

    return {"message": "Authenticated successfully", "user_info": teacher_public}


# --- 創建老師帳號 API ---
@app.post("/register", status_code=status.HTTP_201_CREATED)
def create_teacher(teacher_data: TeacherCreate, db: Session = Depends(get_db)):
    """
    使用 SQL 字串創建老師帳號
    """
    # 1. 使用 SQL 字串檢查帳號是否已存在
    sql_check = text("SELECT account FROM Teachers WHERE account = :account LIMIT 1")
    result = db.execute(sql_check, {"account": teacher_data.account}).first()
    
    if result:
        raise HTTPException(status_code=400, detail="Account already registered")

    # 2. 密碼雜湊
    hashed_password = get_password_hash(teacher_data.password)

    # 3. 準備 SQL 插入語法
    new_teacher_id = str(uuid4())
    sql_insert = text("""
        INSERT INTO Teachers (id, name, office, account, password)
        VALUES (:id, :name, :office, :account, :password)
    """)
    
    # 4. 執行 SQL 插入
    db.execute(sql_insert, {
        "id": new_teacher_id,
        "name": teacher_data.name,
        "office": teacher_data.office,
        "account": teacher_data.account,
        "password": hashed_password
    })
    
    # 5. 提交交易
    db.commit()

    # 6. 回傳成功訊息
    return {"message": "Teacher created successfully", "teacher_id": new_teacher_id}


# 定義 POST API 端點來創建一個新班級
@app.post("/create_class", response_model=Class)
async def create_class(request: Request, request_data: CreateClassRequest, db: str = Depends(get_db)):
    """
    創建一個新班級。

    這個端點接收科目和班級名稱，並自動從 session 中獲取老師 ID。
    """
    try:
        # 從請求的 Cookie 中取得 Session Token
        session_token = request.cookies.get("session_token")
        if not session_token:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

        # 驗證 Session Token 是否有效
        session_data = verify_session_token(session_token)
        if not session_data:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired or invalid")

        # 從 Session Data 取得使用者 ID
        teacher_id = session_data.get("user_id")
        if not teacher_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session data")

        # 使用提供的資料和自動生成的 ID 創建一個新的 Class 物件
        new_class = Class(
            teacher_id=teacher_id,
            subject=request_data.subject,
            class_name=request_data.class_name
        )
        # 執行 SQL 插入語法
        # 這裡假設您的資料表名稱為 'classes'
        insert_query = text("INSERT INTO classes (id, teacher_id, subject, class_name) VALUES (:id, :teacher_id, :subject, :class_name)")
        db.execute(
            insert_query,
            {
                "id": new_class.id,
                "teacher_id": new_class.teacher_id,
                "subject": new_class.subject,
                "class_name": new_class.class_name,
            }
        )
        db.commit()

        print(f"新班級已創建: {new_class}")

        return new_class
    except Exception as e:
        # 處理任何可能發生的錯誤
        raise HTTPException(status_code=500, detail=str(e))

# 新增 GET API 端點來獲取某位老師的所有班級
@app.get("/get_my_classes", response_model=List[Class])
async def get_my_classes(request: Request, db: Session = Depends(get_db)):
    """
    獲取當前登入老師所創建的所有班級。
    """
    try:
        # 從請求的 Cookie 中取得 Session Token
        session_token = request.cookies.get("session_token")
        if not session_token:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

        # 驗證 Session Token 是否有效
        session_data = verify_session_token(session_token)
        if not session_data:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired or invalid")

        # 從 Session Data 取得使用者 ID
        teacher_id = session_data.get("user_id")
        if not teacher_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session data")
        
        # 使用 SQL 語法查詢資料庫，篩選出該老師的所有班級
        sql_query = text("SELECT id, teacher_id, subject, class_name FROM classes WHERE teacher_id = :teacher_id")
        result = db.execute(sql_query, {"teacher_id": teacher_id}).fetchall()
        
        # 將資料庫結果轉換為 Class 物件列表
        teacher_classes = [Class(**row._asdict()) for row in result]
        
        return teacher_classes
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
# 獲取單一班級的 API 端點
@app.get("/get_class", response_model=Class)
async def get_class(id: str, request: Request, db: Session = Depends(get_db)):
    """
    根據 UUID 獲取單一班級的詳細資料。
    """
    try:
        # 從請求的 Cookie 中取得 Session Token
        session_token = request.cookies.get("session_token")
        if not session_token:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

        # 驗證 Session Token 是否有效
        session_data = verify_session_token(session_token)
        if not session_data:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired or invalid")

        # 從 Session Data 取得使用者 ID
        teacher_id = session_data.get("user_id")
        if not teacher_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session data")
        
        # 使用 SQL 語法查詢資料庫，同時比對班級ID和老師ID
        sql_query = text("SELECT id, teacher_id, subject, class_name FROM classes WHERE id = :class_id AND teacher_id = :teacher_id LIMIT 1")
        result = db.execute(sql_query, {"class_id": id, "teacher_id": teacher_id}).first()
        
        if not result:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found or you do not have permission to view it")
        
        # 將資料庫結果轉換為 Class 物件並回傳
        return Class(**result._asdict())

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/add_test")
async def add_test(
    request: Request,
    test_data: TestCreate,
    db: Session = Depends(get_db)
):
    """
    為指定班級新增一個測驗。
    """
    try:
        # 從請求的 Cookie 中取得 Session Token
        session_token = request.cookies.get("session_token")
        if not session_token:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="未驗證")

        # 驗證 Session Token 是否有效
        session_data = verify_session_token(session_token)
        if not session_data:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session 過期或無效")
        
        teacher_id = session_data.get("user_id")
        if not teacher_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session 資料無效")

        new_test_id = str(uuid4())
        # 將新的 correct_answer 字典結構轉換為 JSON 字串
        correct_answer_json = json.dumps({
            q_num: item.model_dump() for q_num, item in test_data.correct_answer.items()
        })
        # 獲取當前時間戳
        created_at = datetime.now()

        # 檢查 class_id 是否存在並屬於當前老師
        class_query = text("SELECT id FROM classes WHERE id = :class_id AND teacher_id = :teacher_id")
        class_result = db.execute(class_query, {"class_id": test_data.class_id, "teacher_id": teacher_id}).fetchone()
        if not class_result:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="班級不存在或無權存取")

        # 使用 SQL 語法插入資料
        sql_query = text("INSERT INTO exams (id, teacher_id, class_id, exam_name, total_pages, correct_answer, created_at) VALUES (:id, :teacher_id, :class_id, :exam_name, :total_pages, :correct_answer, :created_at)")
        db.execute(sql_query, {
            "id": new_test_id,
            "teacher_id": teacher_id,
            "class_id": test_data.class_id,
            "exam_name": test_data.exam_name,
            "total_pages": test_data.total_pages,
            "correct_answer": correct_answer_json,
            "created_at": created_at
        })
        db.commit()
        return {"message": "測驗新增成功", "test_id": new_test_id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    
# 新增 GET API 端點來獲取某個班級的所有測驗
@app.get("/get_exams/{class_id}", response_model=List[Exam])
async def get_exams_by_class(class_id: str, request: Request, db: Session = Depends(get_db)):
    """
    根據班級 ID 獲取該班級所有相關的測驗。
    """
    try:
        # 從請求的 Cookie 中取得 Session Token
        session_token = request.cookies.get("session_token")
        if not session_token:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="未驗證")

        # 驗證 Session Token 是否有效
        session_data = verify_session_token(session_token)
        if not session_data:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session 過期或無效")
        
        teacher_id = session_data.get("user_id")
        if not teacher_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session 資料無效")

        # 首先，驗證老師對此班級有存取權限
        class_query = text("SELECT id FROM classes WHERE id = :class_id AND teacher_id = :teacher_id LIMIT 1")
        class_result = db.execute(class_query, {"class_id": class_id, "teacher_id": teacher_id}).fetchone()
        if not class_result:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="班級不存在或無權存取。")

        # 獲取該班級的所有測驗
        sql_query = text("SELECT id, teacher_id, class_id, exam_name, total_pages, correct_answer FROM exams WHERE class_id = :class_id ORDER BY created_at DESC")
        result = db.execute(sql_query, {"class_id": class_id}).fetchall()
        
        exams_list = [Exam(**row._asdict()) for row in result]
        
        return exams_list

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 新增 GET API 端點來獲取單一測驗
@app.get("/get_exam/{exam_id}", response_model=Exam)
async def get_exam_by_id(exam_id: str, request: Request, db: Session = Depends(get_db)):
    """
    根據測驗 ID 獲取單一測驗的詳細資料。
    """
    try:
        # 從請求的 Cookie 中取得 Session Token
        session_token = request.cookies.get("session_token")
        if not session_token:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="未驗證")

        # 驗證 Session Token 是否有效
        session_data = verify_session_token(session_token)
        if not session_data:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session 過期或無效")
        
        teacher_id = session_data.get("user_id")
        if not teacher_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session 資料無效")
        
        # 查詢資料庫，同時比對測驗 ID 和老師 ID
        sql_query = text("SELECT id, teacher_id, class_id, exam_name, total_pages, correct_answer FROM exams WHERE id = :exam_id AND teacher_id = :teacher_id LIMIT 1")
        result = db.execute(sql_query, {"exam_id": exam_id, "teacher_id": teacher_id}).first()
        
        if not result:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="測驗不存在或您無權存取。")
        
        return Exam(**result._asdict())

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
# --- API 端點 ---
@app.post("/add_students")
async def add_students_bulk(payload: AddStudentsPayload, db: Session = Depends(get_db)):
    """
    處理批量新增學生的 API 請求。
    接收一個 JSON 物件，並將資料存入資料庫。
    """
    try:
        if not payload.members:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="成員列表不能為空。")

        # 準備要插入的學生資料，包含新生成的 UUID
        students_to_insert = []
        for member in payload.members:
            students_to_insert.append({
                "id": str(uuid4()),
                "student_id": member.student_id,
                "name": member.name,
                "class_id": payload.class_id,
                "class": member.class_name
            })
            
        # 使用一個 SQL 語句來執行批量插入，效率比迴圈單獨插入更高
        sql_query = text("INSERT INTO students (id, student_id, name, class_id, class) VALUES (:id, :student_id, :name, :class_id, :class)")
        
        # 執行插入操作
        db.execute(sql_query, students_to_insert)
        
        # 提交變更
        db.commit()

        return {
            "message": "學生資料已成功新增。",
            "added_count": len(students_to_insert),
            "class_id": payload.class_id
        }
    
    except Exception as e:
        # 如果發生任何錯誤，回溯變更並回傳 500 內部伺服器錯誤
        db.rollback()
        raise HTTPException(status_code=500, detail=f"處理請求時發生錯誤: {str(e)}")

@app.get("/get_students/{class_id}", response_model=List[StudentResponse])
async def get_students_by_class(class_id: str, request: Request, db: Session = Depends(get_db)):
    """
    根據班級 ID 獲取該班級所有學生的清單。
    """
    try:
        # 從請求的 Cookie 中取得 Session Token
        session_token = request.cookies.get("session_token")
        if not session_token:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="未驗證")

        # 驗證 Session Token 是否有效
        session_data = verify_session_token(session_token)
        if not session_data:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session 過期或無效")
        
        teacher_id = session_data.get("user_id")
        if not teacher_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session 資料無效")

        # 首先，驗證老師對此班級有存取權限
        class_query = text("SELECT id FROM classes WHERE id = :class_id AND teacher_id = :teacher_id LIMIT 1")
        class_result = db.execute(class_query, {"class_id": class_id, "teacher_id": teacher_id}).fetchone()
        if not class_result:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="班級不存在或無權存取。")

        # 獲取該班級的所有學生
        sql_query = text("SELECT id, student_id, name, class_id, class FROM students WHERE class_id = :class_id ORDER BY student_id ASC")
        result = db.execute(sql_query, {"class_id": class_id}).fetchall()
        
        # 將資料轉換為 Pydantic 模型列表
        students_list = [StudentResponse(**row._asdict()) for row in result]
        
        return students_list

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@app.get("/get_students_test_data/{class_id}/{exam_id}", response_model=List[StudentTestResponse])
async def get_students_by_class(class_id: str, exam_id: str, request: Request, db: Session = Depends(get_db)):
    """
    根據班級 ID 獲取該班級所有學生的清單，並顯示每位學生已上傳的測驗頁面數量。
    """
    try:
        # 從請求的 Cookie 中取得 Session Token
        session_token = request.cookies.get("session_token")
        if not session_token:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="未驗證")

        # 驗證 Session Token 是否有效
        session_data = verify_session_token(session_token)
        if not session_data:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session 過期或無效")
        
        teacher_id = session_data.get("user_id")
        if not teacher_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session 資料無效")

        # 首先，驗證老師對此班級和測驗有存取權限
        class_query = text("SELECT id FROM classes WHERE id = :class_id AND teacher_id = :teacher_id LIMIT 1")
        class_result = db.execute(class_query, {"class_id": class_id, "teacher_id": teacher_id}).fetchone()
        if not class_result:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="班級不存在或無權存取。")

        exam_query = text("SELECT id FROM exams WHERE id = :exam_id AND class_id = :class_id LIMIT 1")
        exam_result = db.execute(exam_query, {"exam_id": exam_id, "class_id": class_id}).fetchone()
        if not exam_result:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="測驗不存在或不屬於此班級。")

        # 獲取該班級的所有學生及其上傳狀態
        sql_query = text("""
    SELECT
        s.id,
        s.student_id,
        s.name,
        s.class_id,
        s.class,
        COUNT(DISTINCT ep.id) AS uploaded_pages_count,
        COUNT(DISTINCT ar.id) AS ai_result_count
    FROM students s
    LEFT JOIN exam_pages ep 
        ON s.id = ep.student_id AND ep.exam_id = :exam_id
    LEFT JOIN ai_result ar 
        ON ar.exam_page_id = ep.id  -- 這裡用 exam_pages.id 連到 ai_result
    WHERE s.class_id = :class_id
    GROUP BY s.id, s.student_id, s.name, s.class_id, s.class
    ORDER BY s.student_id ASC
""")

        result = db.execute(sql_query, {"class_id": class_id, "exam_id": exam_id}).fetchall()
        
        # 將資料轉換為 Pydantic 模型列表
        students_list = [StudentTestResponse(**row._asdict()) for row in result]
        
        return students_list

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    
    
@app.post("/upload_exam_photos")
async def upload_exam_photos(
    exam_id: str = Form(...),
    student_id: str = Form(...),
    files: List[UploadFile] = Form(...)
):
    """
    上傳學生測驗照片並儲存到資料庫中。
    """
    db = next(get_db())
    try:
        # 根據 exam_id 和 student_id 建立路徑
        save_dir = os.path.join(UPLOAD_FOLDER, exam_id, student_id)
        if not os.path.exists(save_dir):
            os.makedirs(save_dir)

        # 準備批量插入的資料
        insert_data = []

        for i, file in enumerate(files):
            file_extension = os.path.splitext(file.filename)[1]
            unique_filename = f"{uuid4()}{file_extension}"
            file_path = os.path.join(save_dir, unique_filename)
            
            # 將檔案儲存到伺服器
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

            # 準備插入資料庫的記錄
            record = {
                "id": str(uuid4()),
                "exam_id": exam_id,
                "student_id": student_id,
                "page_number": i + 1,
                "photo_path": file_path,
                "ai_result": "{}",
            }
            insert_data.append(record)

        # 將資料插入資料庫
        for record in insert_data:
            sql_query = text("""
                INSERT INTO exam_pages (id, exam_id, student_id, page_number, photo_path, ai_result)
                VALUES (:id, :exam_id, :student_id, :page_number, :photo_path, :ai_result)
            """)
            db.execute(sql_query, record)

        db.commit()
        return {"message": "檔案上傳成功", "uploaded_files": [d['photo_path'] for d in insert_data]}

    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"資料庫錯誤: {e}")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"上傳錯誤: {e}")
    
@app.get("/photo/{id}", response_class=FileResponse)
async def get_photo_by_id(id: str, db: Session = Depends(get_db)):
    """
    根據 exam_pages 的 ID 獲取並回傳圖片檔案。
    """
    try:
        # 使用 SQL 查詢來尋找 photo_path
        sql_query = text("SELECT photo_path FROM exam_pages WHERE id = :id")
        result = db.execute(sql_query, {"id": id}).fetchone()

        if not result:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="找不到對應的圖片。")

        photo_path = result.photo_path

        # 檢查檔案是否存在
        if not os.path.exists(photo_path):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="圖片檔案不存在於伺服器。")

        # 回傳圖片檔案
        return FileResponse(photo_path)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.get("/data/{file_path:path}")
async def serve_image(file_path: str):
    """
    根據檔案路徑回傳圖片檔案。
    """
    DATA_DIR = Path("./data")
    full_path = DATA_DIR / file_path

    # 檢查路徑是否在指定資料夾內，以防止路徑遍歷攻擊
    try:
        resolved_path = full_path.resolve()
        if not resolved_path.is_relative_to(DATA_DIR.resolve()):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="禁止存取此路徑。")
    except Exception:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="路徑解析失敗。")

    # 檢查檔案是否存在
    if not resolved_path.exists() or not resolved_path.is_file():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="找不到檔案。")

    # 猜測檔案類型，並回傳檔案
    media_type, _ = mimetypes.guess_type(resolved_path)
    return FileResponse(resolved_path, media_type=media_type)



@app.get("/api/get_photos/{exam_id}/{student_id}", response_model=List[str])
async def get_student_photos(exam_id: str, student_id: str, db: Session = Depends(get_db)):
    """
    根據測驗ID和學生ID，回傳該學生已上傳的所有圖片ID，並依頁碼排序。
    """
    try:
        # 查詢 exam_pages 表格，找出符合 exam_id 和 student_id 的所有圖片，並依 page_number 排序
        sql_query = text("""
            SELECT id
            FROM exam_pages
            WHERE exam_id = :exam_id AND student_id = :student_id
            ORDER BY page_number ASC
        """)
        
        result = db.execute(sql_query, {"exam_id": exam_id, "student_id": student_id}).fetchall()
        
        # 將結果轉換為 ID 的列表
        photo_ids = [row.id for row in result]
        
        if not photo_ids:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="找不到該學生在本次測驗中上傳的任何圖片。")
        
        return photo_ids
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
# 新增 GET API 端點來獲取特定測驗的學生和照片列表
@app.get("/get_exam_gallery/{exam_id}", response_model=List[StudentWithPhotos])
async def get_exam_gallery(exam_id: str, request: Request, db: Session = Depends(get_db)):
    """
    根據測驗 ID 獲取所有相關學生的上傳照片列表。
    """
    try:
        # 從請求的 Cookie 中取得 Session Token
        session_token = request.cookies.get("session_token")
        if not session_token:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="未驗證")

        # 驗證 Session Token 是否有效
        session_data = verify_session_token(session_token)
        if not session_data:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session 過期或無效")
        
        teacher_id = session_data.get("user_id")
        if not teacher_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session 資料無效")
        
        # 1. 首先，驗證老師對此測驗有存取權限
        exam_query = text("SELECT id FROM exams WHERE id = :exam_id AND teacher_id = :teacher_id LIMIT 1")
        exam_result = db.execute(exam_query, {"exam_id": exam_id, "teacher_id": teacher_id}).fetchone()
        if not exam_result:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="測驗不存在或您無權存取。")
        
        # 2. 從 exam_pages 中獲取與該測驗相關的所有照片和學生 ID
        pages_query = text("SELECT student_id, id FROM exam_pages WHERE exam_id = :exam_id")
        pages_result = db.execute(pages_query, {"exam_id": exam_id}).fetchall()
        
        if not pages_result:
            return []  # 如果沒有照片，直接返回空列表

        # 3. 創建一個字典，將照片按學生分組
        student_photos: Dict[str, List[str]] = {}
        unique_student_ids = set()
        for row in pages_result:
            student_id = row.student_id
            photo_id = row.id
            unique_student_ids.add(student_id)
            if student_id not in student_photos:
                student_photos[student_id] = []
            student_photos[student_id].append(photo_id)

        # 4. 根據學生 ID 列表從 students 表中獲取學生資訊
        students_query = text("SELECT id, student_id, name, class AS class_name FROM students WHERE id IN :student_id")
        students_result = db.execute(students_query, {"student_id": list(unique_student_ids)}).fetchall()
        
        # 5. 組合最終結果
        final_gallery: List[StudentWithPhotos] = []
        for student_row in students_result:
            student_id = student_row.id
            final_gallery.append(
                StudentWithPhotos(
                    id=student_row.id,
                    student_id=student_row.student_id,
                    name=student_row.name,
                    class_name=student_row.class_name,
                    photos=student_photos.get(student_id, [])
                )
            )

        return final_gallery

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    


@app.get("/ai/detect_exam/{exam_id}")
async def detect_exam(
    exam_id: str,
    request: Request,
    db: Session = Depends(get_db),
    mode: str = Query("single", description="模式: single (預設) / all")
):
    """
    根據測驗 ID 獲取所有相關的測驗圖片路徑，並進行 AI 批改，
    最後將結果儲存到資料庫中。
    
    Query parameter:
    - mode=single (預設)：已生成的圖片不再重做
    - mode=all：全部圖片都重做
    """
    try:
        # 驗證 session
        session_token = request.cookies.get("session_token")
        if not session_token:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="未驗證")

        session_data = verify_session_token(session_token)
        if not session_data:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session 過期或無效")
        
        teacher_id = session_data.get("user_id")
        if not teacher_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session 資料無效")

        # 取 exams 的 id + correct_answer
        exam_query = text("""
            SELECT id, correct_answer 
            FROM exams 
            WHERE id = :exam_id AND teacher_id = :teacher_id 
            LIMIT 1
        """)
        exam_result = db.execute(
            exam_query, 
            {"exam_id": exam_id, "teacher_id": teacher_id}
        ).fetchone()

        if not exam_result:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="測驗不存在或您無權存取。")

        correct_answer = {}
        if exam_result.correct_answer:
            try:
                correct_answer = json.loads(exam_result.correct_answer)
            except Exception:
                pass

        # 獲取與該測驗 ID 相關的所有圖片路徑和 exam_page_id
        sql_query = text("""
            SELECT id, photo_path 
            FROM exam_pages 
            WHERE exam_id = :exam_id 
            ORDER BY page_number ASC
        """)
        result = db.execute(sql_query, {"exam_id": exam_id}).fetchall()
        
        photo_paths = []
        page_ids = []

        # 根據模式決定要處理哪些圖片
        for row in result:
            page_id = str(row.id)
            photo_path = row.photo_path

            if mode == "single":
                # single 模式下，先檢查 ai_result 是否已經存在
                existing_record = db.execute(
                    text("SELECT id FROM ai_result WHERE exam_page_id = :page_id LIMIT 1"),
                    {"page_id": page_id}
                ).fetchone()
                if existing_record:
                    continue  # 已經生成過就跳過

            # 將需要處理的圖片加入列表
            photo_paths.append(photo_path)
            page_ids.append(page_id)

        if not photo_paths:
            return {"message": "所有圖片已生成結果，無需重新批改。", "paths": [row.photo_path for row in result]}

        print(f"Detecting images for paths: {photo_paths}")

        # 呼叫 AI 偵測並批改
        ai_results = detect_images_v2(
            photo_paths,
            page_ids,
            app_state["model"],
            app_state["device"],
            app_state["half"],
            app_state["imgsz"],
            exam_id,
            correct_answer or {}
        )

        # 將結果儲存到資料庫
        for result in ai_results:
            page_id = result['exam_page_id']
            grading_result = result['grading_results']
            save_paths = [str(p) for p in result['save_paths']]  # WindowsPath -> str

            # 檢查是否已存在
            existing_record = db.execute(
                text("SELECT id FROM ai_result WHERE exam_page_id = :page_id LIMIT 1"),
                {"page_id": page_id}
            ).fetchone()

            params = {
                "result": json.dumps(grading_result['details']),
                "score": grading_result['total_score'],
                "save_path": json.dumps(save_paths),
                "updated_at": datetime.now()
            }

            if existing_record:
                db.execute(
                    text("""
                        UPDATE ai_result
                        SET result = :result, score = :score, save_path = :save_path, updated_at = :updated_at
                        WHERE id = :id
                    """),
                    {**params, "id": str(existing_record.id)}
                )
            else:
                db.execute(
                    text("""
                        INSERT INTO ai_result (id, exam_page_id, result, score, save_path, created_at, updated_at)
                        VALUES (:id, :exam_page_id, :result, :score, :save_path, :created_at, :updated_at)
                    """),
                    {
                        **params,
                        "id": str(uuid4()),
                        "exam_page_id": page_id,
                        "created_at": datetime.now()
                    }
                )

        db.commit()
        return {"message": "批改完成，結果已儲存到資料庫。", "paths": photo_paths}

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        print(f"Error occurred: {e}")
        raise HTTPException(status_code=500, detail=f"內部伺服器錯誤：{str(e)}")
#----------------------------------------
# 取得 AI 批改結果並進行資料處理
#----------------------------------------
@app.get("/ai/get_result/{exam_id}")
async def get_ai_results(
    exam_id: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    獲取指定測驗的所有 AI 批改結果，並按學生分組加總分數。
    """
    try:
        # 從請求的 Cookie 中取得 Session Token
        session_token = request.cookies.get("session_token")
        if not session_token:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="未驗證")

        # 驗證 Session Token 是否有效
        session_data = verify_session_token(session_token)
        if not session_data:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session 過期或無效")
        
        teacher_id = session_data.get("user_id")
        if not teacher_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session 資料無效")

        # 查詢所有相關資料
        sql_query = text("""
            SELECT
                ar.id AS ai_result_id,
                ar.score,
                ar.save_path,
                ep.student_id,
                ep.page_number,
                s.name AS student_name,
                s.student_id AS student_student_id,
                c.class_name
            FROM ai_result AS ar
            JOIN exam_pages AS ep ON ar.exam_page_id = ep.id
            JOIN students AS s ON ep.student_id = s.id
            JOIN classes AS c ON s.class_id = c.id
            WHERE ep.exam_id = :exam_id
            ORDER BY ep.page_number ASC
        """)

        db_results = db.execute(sql_query, {"exam_id": exam_id}).fetchall()

        if not db_results:
            return []

        # 將結果整理成字典，以 student_id 為鍵
        student_results = {}
        for row in db_results:
            student_id = str(row.student_id)
            if student_id not in student_results:
                student_results[student_id] = {
                    "id": student_id,
                    "student_id": row.student_student_id,
                    "name": row.student_name,
                    "class_name": row.class_name,
                    "score": 0,
                    "result_images": []
                }
            
            # 將分數加總
            student_results[student_id]["score"] += row.score
            
            # 建立圖片資料
            save_path_list = json.loads(row.save_path) if row.save_path else []
            student_results[student_id]["result_images"].append({
                "ai_result_id": str(row.ai_result_id),
                "save_paths": save_path_list
            })

        # 將字典轉換回列表
        final_results = list(student_results.values())

        return final_results

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        print(f"Error occurred: {e}")
        raise HTTPException(status_code=500, detail=f"內部伺服器錯誤：{str(e)}")
