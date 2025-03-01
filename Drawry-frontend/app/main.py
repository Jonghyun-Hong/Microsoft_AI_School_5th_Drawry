# 필요한 라이브러리 임포트
from fastapi import FastAPI, Request, File, UploadFile, Form, Depends, HTTPException, status, Response
from starlette.middleware.httpsredirect import HTTPSRedirectMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from jinja2 import pass_context
from fastapi.responses import HTMLResponse, StreamingResponse, JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
import azure.cognitiveservices.speech as speechsdk
import os
import io
import typing
import json
import time
import numpy as np
from dotenv import load_dotenv
import speech_recognition as sr
from difflib import SequenceMatcher
import subprocess
from pydantic import BaseModel
import requests
import logging
import secrets
import re
from typing import List, Dict, Optional
#main에서 https 설정할 수 있는 방법을 찾아야됨 지금은 각 static에서 강제적으로 https로 바꿔주는중.
# 로깅 설정 - 개발 환경용 간단한 설정

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("api")

# FastAPI 앱 초기화 및 환경변수 로드
app = FastAPI(
    # docs_url=None,  # /docs 비활성화
    # redoc_url=None  # /redoc 비활성화
)
load_dotenv()
# app.add_middleware(HTTPSRedirectMiddleware)

# 보안 헤더 미들웨어
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # 보안 헤더 추가
        # response.headers["X-XSS-Protection"] = "1; mode=block"
        # response.headers["X-Content-Type-Options"] = "nosniff" 
        # response.headers["X-Frame-Options"] = "DENY"
        # response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        # CSP - Content-Security-Policy 수정
        # response.headers["Content-Security-Policy"] = (
        #     "default-src 'self'; "
        #     "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; "
        #     "style-src 'self' 'unsafe-inline'; "
        #     "img-src 'self' data: https: https://your-allowed-image-source.com; "
        #     "connect-src 'self' https://*.openai.azure.com https://*.search.windows.net "
        #     f"https://{AZURE_OPENAI_ENDPOINT.replace('https://', '').split('/')[0]} "
        #     "http://127.0.0.1:8001 http://localhost:8001 http://20.41.118.218 "
        #     "http://20.41.118.218:5000 http://20.41.118.218:5000/static/output; "
        #     "font-src 'self' data:; "
        #     "media-src 'self' blob:;"
        # )
        return response

# Rate Limiting 미들웨어
class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(
        self, 
        app, 
        requests_per_minute: int = 60,
        excluded_paths: List[str] = None
    ):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.excluded_paths = excluded_paths or []
        self.ip_tracker: Dict[str, List[float]] = {}
    
    async def dispatch(self, request: Request, call_next):
        # # 제외된 경로는 rate limit 적용하지 않음
        # if any(request.url.path.startswith(path) for path in self.excluded_paths):
        #     return await call_next(request)
            
        # ip = request.client.host
        # current_time = time.time()
        
        # # IP별 요청 기록 정리 (1분 이상 지난 기록 제거)
        # if ip in self.ip_tracker:
        #     self.ip_tracker[ip] = [
        #         timestamp for timestamp in self.ip_tracker[ip] 
        #         if current_time - timestamp < 60
        #     ]
        # else:
        #     self.ip_tracker[ip] = []
        
        # # 요청 수 확인 
        # if len(self.ip_tracker[ip]) >= self.requests_per_minute:
        #     logger.warning(f"Rate limit exceeded: {ip} - {request.url.path}")
        #     return Response(
        #         content=json.dumps({"detail": "Too many requests"}),
        #         status_code=429,
        #         media_type="application/json"
        #     )
        
        # # 현재 요청 추가
        # self.ip_tracker[ip].append(current_time)
        
        return await call_next(request)

# 봇 필터링 미들웨어
class BotFilterMiddleware(BaseHTTPMiddleware):
    def __init__(
        self, 
        app, 
        blocked_user_agents: List[str] = None,
        blocked_paths: List[str] = None,
        excluded_paths: List[str] = None
    ):
        super().__init__(app)
        self.blocked_user_agents = blocked_user_agents or [
            "zgrab", "semrushbot", "ahrefsbot", "mj12bot", "dotbot", 
            "scanner", "sqlmap", "nikto", "nessus", "masscan",
            "python-requests", "go-http-client", "nmap"
        ]
        # 민감한 경로 패턴 추가
        self.blocked_paths = blocked_paths or [
            r"\.(?:git|svn|bzr|hg|env|config|cfg|ini|log|bak|old|backup|sql|db|frm)$",
            r"(?:data|admin|mysql|config|backup|\.well-known|wp-content|wp-admin)",
            r"(?:phpMyAdmin|phpmyadmin|myadmin|mysql|admin|administrator)",
            r"(?:\.php|\.asp|\.jsp|\.env|\.git|\.svn)$"
        ]
        self.excluded_paths = excluded_paths or ["/static"]
        self.suspicious_ips = {}
        
    async def dispatch(self, request: Request, call_next):
        # client_ip = request.client.host
        # current_time = time.time()
        
        # # 제외된 경로는 검사하지 않음
        # if any(request.url.path.startswith(path) for path in self.excluded_paths):
        #     return await call_next(request)

        # # HEAD 요청 카운트 및 차단
        # if request.method == "HEAD":
        #     if client_ip not in self.suspicious_ips:
        #         self.suspicious_ips[client_ip] = {"count": 1, "first_seen": current_time}
        #     else:
        #         self.suspicious_ips[client_ip]["count"] += 1

        #     # 1분 내 HEAD 요청이 5회 이상이면 차단
        #     if (self.suspicious_ips[client_ip]["count"] >= 5 and 
        #         current_time - self.suspicious_ips[client_ip]["first_seen"] < 60):
        #         logger.warning(f"Suspicious HEAD requests blocked: {client_ip}")
        #         return Response(
        #             content=json.dumps({"detail": "Suspicious activity detected"}),
        #             status_code=403,
        #             media_type="application/json"
        #         )

        # # 차단된 경로 패턴 검사
        # path = request.url.path.lower()
        # if any(re.search(pattern, path) for pattern in self.blocked_paths):
        #     logger.warning(f"Blocked suspicious path access: {client_ip} - {path}")
        #     return Response(
        #         content=json.dumps({"detail": "Access denied"}),
        #         status_code=403,
        #         media_type="application/json"
        #     )

        # # User-Agent 검사
        # user_agent = request.headers.get("user-agent", "").lower()
        # if (user_agent == "" or 
        #     any(agent in user_agent for agent in self.blocked_user_agents)):
        #     logger.warning(f"Blocked bot: {client_ip} - {user_agent}")
        #     return Response(
        #         content=json.dumps({"detail": "Access denied"}),
        #         status_code=403,
        #         media_type="application/json"
        #     )

        return await call_next(request)

# 요청 로깅 미들웨어
class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # start_time = time.time()
        
        # 요청 처리
        response = await call_next(request)
        
        # # 처리 시간 계산
        # process_time = time.time() - start_time
        
        # # 로그 남기기
        # logger.info(
        #     f"IP: {request.client.host} - "
        #     f"Method: {request.method} - "
        #     f"Path: {request.url.path} - "
        #     f"Status: {response.status_code} - "
        #     f"Time: {process_time:.4f}s - "
        #     f"UA: {request.headers.get('user-agent', '')}"
        # )
        
        return response

# 생성된 파일 남용 방지를 위한 유틸리티 함수
def validate_filename(filename: str) -> bool:
    """파일명에 악의적인 문자열이 있는지 확인"""
    # # 경로 순회 방지
    # if '..' in filename or '/' in filename or '\\' in filename:
    #     return False
    
    # # 허용되는 파일 확장자 (필요에 따라 조정)
    # allowed_extensions = ['.mp3', '.wav', '.webm']
    # if not any(filename.endswith(ext) for ext in allowed_extensions):
    #     return False
    
    # # 안전한 파일명 패턴 (알파벳, 숫자, 일부 특수문자만 허용)
    # safe_pattern = re.compile(r'^[a-zA-Z0-9_.-]+$')
    # if not safe_pattern.match(filename):
    #     return False
    
    return True

# CORS 미들웨어 설정 (수정된 버전)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 개발 환경에서는 모든 origin 허용
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 보안 미들웨어 추가
# app.add_middleware(SecurityHeadersMiddleware)
# app.add_middleware(LoggingMiddleware)
# app.add_middleware(BotFilterMiddleware, excluded_paths=["/static"])
# app.add_middleware(RateLimitMiddleware, requests_per_minute=30, excluded_paths=["/static"])

# 환경변수 설정
AZURE_SPEECH_KEY = os.getenv("AZURE_SPEECH_KEY")
AZURE_SPEECH_REGION = os.getenv("AZURE_SPEECH_REGION")
VOICE_NAME = os.getenv("VOICE_NAME")
model_path = os.getenv("MODEL_PATH")
AZURE_OPENAI_KEY = os.getenv("AZURE_OPENAI_KEY")
AZURE_OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT")
AZURE_OPENAI_MODEL_DEPLOYMENT_NAME = os.getenv("AZURE_OPENAI_MODEL_DEPLOYMENT_NAME")
AZURE_OPENAI_API_VERSION = os.getenv("AZURE_OPENAI_API_VERSION")
SEARCH_ENDPOINT = os.getenv("SEARCH_ENDPOINT")
SEARCH_INDEX = os.getenv("SEARCH_INDEX")
SEARCH_KEY = os.getenv("SEARCH_KEY")

# 디렉토리 경로 설정
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEMPLATES_DIR = os.path.join(BASE_DIR, "templates")
STATIC_PATH = os.path.join(BASE_DIR, "static")

# 필요한 디렉토리 생성
os.makedirs(os.path.join(STATIC_PATH, "uploads"), exist_ok=True)
os.makedirs(os.path.join(STATIC_PATH, "speaking"), exist_ok=True)

# 정적 파일 및 템플릿 설정
app.mount("/static", StaticFiles(directory=STATIC_PATH), name="static")
templates = Jinja2Templates(directory=TEMPLATES_DIR)
# try:
#     import jinja2

#     if hasattr(jinja2, "pass_context"):
#         pass_context = jinja2.pass_context
#     else:  # pragma: nocover
#         pass_context = jinja2.contextfunction  # type: ignore[attr-defined]
# except ImportError:  # pragma: nocover
#     jinja2 = None  # type: ignore

# @pass_context  # noqa
# def url_for(context: dict, name: str, **path_params: typing.Any) -> str:
#     request = context["request"]
#     http_url = request.url_for(name, **path_params)
#     if request.url.scheme == 'https' or "x-forwarded-for" in request.headers.keys():
#         return http_url.replace("http", "https", 1)
#     else:
#         return http_url
# templates = Jinja2Templates(directory=TEMPLATES_DIR)
# templates.env.globals["url_for"] = url_for

# 주기적으로 임시 파일 정리하는 함수
def cleanup_temp_files():
    """30일 이상 된 임시 파일 삭제"""
    dirs_to_clean = ["static/uploads", "static/speaking"]
    current_time = time.time()
    
    for directory in dirs_to_clean:
        if not os.path.exists(directory):
            continue
            
        for filename in os.listdir(directory):
            file_path = os.path.join(directory, filename)
            
            # 파일 수정 시간 확인
            if os.path.isfile(file_path):
                file_age = current_time - os.path.getmtime(file_path)
                
                # 30일(2592000초) 이상 된 파일 삭제
                if file_age > 2592000:
                    try:
                        os.remove(file_path)
                        logger.info(f"오래된 파일 삭제: {file_path}")
                    except Exception as e:
                        logger.error(f"파일 삭제 실패: {file_path} - {str(e)}")


@pass_context
def url_for(context: dict, name: str, **path_params: typing.Any) -> str:
    request = context["request"]
    http_url = request.url_for(name, **path_params)

    # 🔥 HTTPS 강제 변환
    if request.headers.get("x-forwarded-proto", request.url.scheme) == "https":
        return http_url.replace("http", "https", 1)
    
    return http_url

templates.env.globals["url_for"] = url_for

# 앱 시작 시 이벤트
@app.on_event("startup")
async def startup_event():
    # 임시 파일 정리
    cleanup_temp_files()
    logger.info("애플리케이션 시작됨")

# 메인 페이지 라우팅
@app.get("/", response_class=HTMLResponse)
async def logo_page(request: Request):
    return templates.TemplateResponse("1_logo.html", {"request": request, "scheme": 'https', "str": str})

@app.get("/intro", response_class=HTMLResponse)
async def intro_page(request: Request):
    return templates.TemplateResponse("2_intro.html", {"request": request, "scheme": 'https', "str": str})

@app.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    return templates.TemplateResponse("3_login.html", {"request": request, "scheme": 'https', "str": str})

@app.get("/register", response_class=HTMLResponse)
async def register_page(request: Request):
    return templates.TemplateResponse("3.5_register.html", {"request": request, "scheme": 'https', "str": str})

@app.get("/userinfo", response_class=HTMLResponse)
async def userinfo_page(request: Request):
    return templates.TemplateResponse("4_userinfo.html", {"request": request, "scheme": 'https', "str": str})

@app.get("/maintab", response_class=HTMLResponse)
async def maintab_page(request: Request):
    return templates.TemplateResponse("5_maintab.html", {"request": request, "scheme": 'https', "str": str})

@app.get("/startfairytale", response_class=HTMLResponse)
async def start_fairytale_page(request: Request):
    return templates.TemplateResponse("6_startfairytale.html", {"request": request, "scheme": 'https', "str": str})

@app.get("/getcharacter", response_class=HTMLResponse)
async def get_character_page(request: Request):
    return templates.TemplateResponse("7_getcharacter.html", {"request": request, "scheme": 'https', "str": str})

@app.get("/drawing", response_class=HTMLResponse)
async def drawing_page(request: Request):
    return templates.TemplateResponse("8_Drawing.html", {"request": request, "scheme": 'https', "str": str})

@app.get("/makeimage", response_class=HTMLResponse)
async def make_image_page(request: Request):
    return templates.TemplateResponse("9_makeimage.html", {"request": request, "scheme": 'https', "str": str})

@app.get("/makestory", response_class=HTMLResponse)
async def make_story_page(request: Request):
    return templates.TemplateResponse("10_makestory.html", {"request": request, "scheme": 'https', "str": str})

@app.get("/storyopenai", response_class=HTMLResponse)
async def story_openai_page(request: Request):
    return templates.TemplateResponse("11_storyopenAI.html", {"request": request, "scheme": 'https', "str": str})

@app.get("/turtle", response_class=HTMLResponse)
async def turtle_page(request: Request):
    return templates.TemplateResponse("12_turtle.html", {"request": request, "scheme": 'https', "str": str})

@app.get("/turtleend", response_class=HTMLResponse)
async def turtle_end_page(request: Request):
    return templates.TemplateResponse("13_turtle_end.html", {"request": request, "scheme": 'https', "str": str})

@app.get("/fairytale", response_class=HTMLResponse)
async def fairytale_page(request: Request):
    return templates.TemplateResponse("14_fairytale.html", {"request": request, "scheme": 'https', "str": str})

@app.get("/score", response_class=HTMLResponse)
async def score_page(request: Request):
    return templates.TemplateResponse("15_score.html", {"request": request, "scheme": 'https', "str": str})

@app.get("/book", response_class=HTMLResponse)
async def book_page(request: Request):
    return templates.TemplateResponse("15_book.html", {"request": request, "scheme": 'https', "str": str})

# 게임 페이지 라우팅
@app.get("/turtlegame", response_class=HTMLResponse)
async def turtlegame_page(request: Request):
    return templates.TemplateResponse("games/0.turtlegame.html", {"request": request, "scheme": 'https', "str": str})

@app.get("/game", response_class=HTMLResponse)
async def game_page(request: Request):
    return templates.TemplateResponse("games/0.game.html", {"request": request, "scheme": 'https', "str": str})

@app.get("/appletree", response_class=HTMLResponse)
async def appletree_game_page(request: Request):
    return templates.TemplateResponse("games/1.appletree_game.html", {"request": request, "scheme": 'https', "str": str})

@app.get("/pull", response_class=HTMLResponse)
async def pull_game_page(request: Request):
    return templates.TemplateResponse("games/2.pull_game.html", {"request": request, "scheme": 'https', "str": str})

@app.get("/ox", response_class=HTMLResponse)
async def ox_game_page(request: Request):
    return templates.TemplateResponse("games/3.ox_game.html", {"request": request, "scheme": 'https', "str": str})

@app.get("/grid", response_class=HTMLResponse)
async def grid_game_page(request: Request):
    return templates.TemplateResponse("games/4.grid_game.html", {"request": request, "scheme": 'https', "str": str})

@app.get("/flip", response_class=HTMLResponse)
async def flip_game_page(request: Request):
    return templates.TemplateResponse("games/5.flip_game.html", {"request": request, "scheme": 'https', "str": str})

@app.get("/write", response_class=HTMLResponse)
async def write_game_page(request: Request):
    return templates.TemplateResponse("games/6.write_game.html", {"request": request, "scheme": 'https', "str": str})

@app.get("/eye", response_class=HTMLResponse)
async def eye_game_page(request: Request):
    return templates.TemplateResponse("games/7.eye_game.html", {"request": request, "scheme": 'https', "str": str})

@app.get("/read", response_class=HTMLResponse)
async def read_game_page(request: Request):
    return templates.TemplateResponse("games/8.read_game.html", {"request": request, "scheme": 'https', "str": str})

#------------------------------------ score
# ✅ 게임 결과를 저장할 데이터 모델 및 리스트
class GameResult(BaseModel):
    game_name: str
    success: int  # 1: 성공, 0: 실패

# score 기능을 위해 추가한 부분
# ✅ 결과를 딕셔너리로 변경하여 최신 결과만 유지
results : Dict[str, int] = {}

# ✅ 그룹 정의 (게임 이름 → 그룹명)
GROUPS = {
    "appletree": "작업기억",
    "flip": "작업기억",
    "grid": "글자인식",
    "ox": "글자인식",
    "pull": "글자인식",
    "write": "쓰기"
}

# score 기능을 위해 추가한 부분
# ✅ 결과 전송 엔드포인트 (게임별로 결과 덮어쓰기)
@app.post("/submit_evaluation")
async def submit_evaluation(result: GameResult):
    results[result.game_name] = result.success  # ✅ 동일 게임 이름이면 기존 결과 덮어쓰기
    print(f"📩 결과 수신: {result.game_name} - {'✅' if result.success == 1 else '❌'}")  # ✅ 추가된 로그
    return {"message": "결과 저장 완료", "result": result}

# score 기능을 위해 추가한 부분
# ✅ 모든 결과 반환 엔드포인트
@app.get("/evaluation_results")
async def get_evaluation_results():
    # ✅ 그룹별 성공률 계산 (0% ~ 100%)
    group_scores = {"작업기억": [], "글자인식": [], "쓰기": [], "말하기": [], "집중력": []}

    # ✅ 결과를 그룹별로 분류하여 성공률을 저장
    print("📊 현재 저장된 결과:", results)  # 디버깅용 출력

    # ✅ 각 그룹에 점수를 추가 (GROUPS 사용 X)
    for group_name, success in results.items():
        if group_name in group_scores:  # ✅ 그룹명이 직접 사용되므로 바로 추가
            group_scores[group_name].append(success)

    # ✅ 그룹별 평균 성공률 계산 (없을 시 70%)
    group_avg = {
        group: int(sum(scores) / len(scores) * 100) if scores else 70
        for group, scores in group_scores.items()
    }

    print("✅ 그룹별 평균 성공률:", group_avg)  # 디버깅용 출력

    return {
        "results": [
            {"group_name": "작업기억", "score": group_avg.get("작업기억", 0)},
            {"group_name": "글자인식", "score": group_avg.get("글자인식", 0)},
            {"group_name": "쓰기", "score": group_avg.get("쓰기", 0)},
            {"group_name": "말하기", "score": group_avg.get("말하기", 0)},
            {"group_name": "집중력", "score": group_avg.get("집중력", 0)}
        ]
    }


# -------------------------------write
# 점수 요청을 위한 Pydantic 모델
class ScoreRequest(BaseModel):
    score: int

# 점수 제출 엔드포인트
@app.post("/submit-score")
async def receive_score(request: ScoreRequest):
    score = request.score
    logger.info(f"받은 점수: {score}")
    print(f"📊 받은 점수: {score}")
    return {"message": "점수 저장 완료!", "received_score": score}

# 텍스트 음성 변환 엔드포인트
@app.post("/speak")
async def speak_text(request: Request):
    data = await request.json()
    text = data.get("text", "")

    try:
        # Azure Speech SDK 설정
        speech_config = speechsdk.SpeechConfig(
            subscription=AZURE_SPEECH_KEY, 
            region=AZURE_SPEECH_REGION
        )
        speech_config.speech_synthesis_voice_name = VOICE_NAME

        timestamp = int(time.time())
        output_path = f"static/uploads/output_{timestamp}.mp3"

        audio_stream = io.BytesIO()
        audio_output = speechsdk.audio.AudioOutputConfig(filename=output_path)
        synthesizer = speechsdk.SpeechSynthesizer(
            speech_config=speech_config, 
            audio_config=audio_output
        )

        result = synthesizer.speak_text_async(text).get()

        if result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
            with open(output_path, "rb") as audio_file:
                audio_stream.write(audio_file.read())
            
            audio_stream.seek(0)
            return StreamingResponse(audio_stream, media_type="audio/mpeg")

        return JSONResponse({"error": "Speech synthesis failed"}, status_code=500)

    except Exception as e:
        logger.error(f"음성 합성 오류: {str(e)}")
        return JSONResponse({"error": str(e)}, status_code=500)

# 챗봇 대화 요청 모델
class ChatRequest(BaseModel):
    conversation_history: list

@app.get("/storyopenAI", response_class=HTMLResponse)
async def story_openai(request: Request):
    return templates.TemplateResponse(
        "11_storyopenAI.html", 
        {
            "request": request,
            "azure_openai_key": AZURE_OPENAI_KEY,
            "azure_openai_endpoint": AZURE_OPENAI_ENDPOINT,
            "azure_openai_model_deployment_name": AZURE_OPENAI_MODEL_DEPLOYMENT_NAME,
            "azure_openai_api_version": AZURE_OPENAI_API_VERSION,
            "search_endpoint": SEARCH_ENDPOINT,
            "search_index": SEARCH_INDEX,
            "search_key": SEARCH_KEY
        }
    )

# 음성 파일 변환 엔드포인트
@app.post("/convert-to-wav")
async def convert_to_wav(audio: UploadFile = File(...)):
    timestamp = int(time.time())
    input_path = f"static/uploads/input_{timestamp}.webm"
    output_path = input_path.replace(".webm", ".wav")

    with open(input_path, "wb") as f:
        f.write(await audio.read())

    try:
        subprocess.run([
            "ffmpeg", "-y", "-i", input_path,
            "-acodec", "pcm_s16le", "-ar", "16000", "-ac", "1",
            output_path
        ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except Exception as e:
        logger.error(f"파일 변환 오류: {str(e)}")
        return JSONResponse({"error": str(e)}, status_code=500)

    return FileResponse(output_path, media_type="audio/wav")

# 음성 비교 엔드포인트
@app.post("/compare")
async def compare_speech(file: UploadFile = File(...), expected_text: str = Form(...)):
    timestamp = int(time.time())
    audio_file_path = f"static/speaking/audio_{timestamp}.wav"

    with open(audio_file_path, "wb") as f:
        f.write(await file.read())

    corrected_audio_path = audio_file_path.replace(".wav", "_fixed.wav")
    try:
        subprocess.run([
            "ffmpeg", "-y", "-i", audio_file_path,
            "-acodec", "pcm_s16le", "-ar", "16000", "-ac", "1",
            corrected_audio_path
        ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

        recognizer = sr.Recognizer()
        with sr.AudioFile(corrected_audio_path) as source:
            audio = recognizer.record(source)

        recognized_text = recognizer.recognize_google(audio, language="ko-KR")
        similarity_score = int(SequenceMatcher(None, expected_text.strip(), recognized_text.strip()).ratio() * 100)

        logger.info(f"음성 인식 결과: {recognized_text}, 정확도: {similarity_score}%")
        return JSONResponse({
            "expected_text": expected_text,
            "recognized_text": recognized_text,
            "accuracy": similarity_score
        })

    except sr.UnknownValueError:
        logger.warning("음성 인식 실패")
        return JSONResponse(
            {"error": "음성을 인식할 수 없습니다. 더 크게, 천천히 말해보세요."}, 
            status_code=400
        )
    except Exception as e:
        logger.error(f"음성 처리 오류: {str(e)}")
        return JSONResponse({"error": str(e)}, status_code=500)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0", 
        port=8000
    )