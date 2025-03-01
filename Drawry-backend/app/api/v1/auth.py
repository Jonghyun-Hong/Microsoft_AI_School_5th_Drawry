# app/api/v1/auth.py
from datetime import timedelta, datetime
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer  # OAuth2PasswordRequestForm 추가
from sqlalchemy.orm import Session
from app.core.security import verify_password, create_access_token, validate_password, get_password_hash
from app.core.config import settings
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserResponse, UserCreate
from app.schemas.token import Token
from app.api.dependencies import get_current_user

router = APIRouter()

@router.post("/register", response_model=UserResponse)
async def register(
   user_data: UserCreate,
   db: Session = Depends(get_db)
):
   # 이메일 중복 체크
   if db.query(User).filter(User.email == user_data.email).first():
       raise HTTPException(
           status_code=400,
           detail="Email already registered"
       )
   
   # 비밀번호 검증
   validate_password(user_data.password)
   
   # 새 사용자 생성
   user = User(
       email=user_data.email,
       hashed_password=get_password_hash(user_data.password),
       nickname=user_data.nickname,
       birth_date=user_data.birth_date,
       is_active=True
   )
   
   try:
       db.add(user)
       db.commit()
       db.refresh(user)
       return user
   except Exception as e:
       db.rollback()
       raise HTTPException(
           status_code=400,
           detail=f"Could not register user: {str(e)}"
       )

@router.post("/login", response_model=Token)
async def login(
   form_data: OAuth2PasswordRequestForm = Depends(),
   db: Session = Depends(get_db)
):
   # 사용자 조회
   user = db.query(User).filter(User.email == form_data.username).first()

   if not user or not verify_password(form_data.password, user.hashed_password):
       raise HTTPException(
           status_code=status.HTTP_401_UNAUTHORIZED,
           detail="Incorrect email or password",
           headers={"WWW-Authenticate": "Bearer"},
       )
   
   # 토큰 생성
   access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
   access_token = create_access_token(
       data={"sub": user.email}, expires_delta=access_token_expires
   )
   
   return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_user)):
   if not current_user.is_active:
       raise HTTPException(status_code=400, detail="Inactive user")
   return current_user

@router.post("/test-user")
async def create_test_user(db: Session = Depends(get_db)):
   if not settings.DEBUG:
       raise HTTPException(
           status_code=404,
           detail="Endpoint not found"
       )
   test_user = User(
       email="test@example.com",
       hashed_password=get_password_hash("testpassword123"),
       nickname="테스트유저",
       birth_date=datetime.now().date()
   )
   db.add(test_user)
   db.commit()
   db.refresh(test_user)
   return {"message": "Test user created", "email": test_user.email}