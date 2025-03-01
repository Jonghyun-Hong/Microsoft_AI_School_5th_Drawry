import os
import torch
import base64
import threading
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from diffusers import StableDiffusionControlNetPipeline, ControlNetModel
from PIL import Image, ImageEnhance
from io import BytesIO
from dotenv import load_dotenv


#이미지 저장 위치 수정 static/output에서 output으로

# ✅ .env 파일 로드
load_dotenv()

# ✅ 환경 변수 가져오기
FLASK_SERVER = os.getenv("FLASK_SERVER", "http://localhost:5000")

app = Flask(__name__, static_folder="static")
CORS(app, resources={r"/*": {
    "origins": "*", 
    "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"],
    "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}})

# ✅ Flask 서버 URL 확인
print(f"Flask Server is running at: {FLASK_SERVER}")

# ✅ 생성된 이미지 저장 폴더 설정
OUTPUT_FOLDER = "static/output"
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

# ✅ CUDA 디바이스 설정
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Using device: {device}")

# ✅ ControlNet 모델 로드
controlnet = ControlNetModel.from_pretrained(
    "lllyasviel/control_v11p_sd15_scribble",  
    torch_dtype=torch.float16
).to(device)

# ✅ Stable Diffusion 모델 로드
pipe = StableDiffusionControlNetPipeline.from_pretrained(
    "Yntec/Wonder",
    controlnet=controlnet,
    torch_dtype=torch.float16
).to(device)

pipe.enable_model_cpu_offload()
pipe.enable_vae_slicing()

# ✅ 부정적 프롬프트 설정
negative_prompt = (
    "extra limbs,extra arms, extra legs, extra fingers, malformed hands, missing fingers, extra hands, "
    "mutated hands, deformed hands, unnatural hand position, bad anatomy, close-up, horse legs, horse body, horse, "
    "disfigured body, asymmetrical hands, incorrect fingers, long unnatural fingers, "
    "multiple people, extra person, extra face, no person, no face, extra hands, multiple faces, extra heads, multiple heads, mutated, distorted face, disfigured,  "
    "floating fingers, deformed arms, blurry, distorted, glitch, disproportioned features, deformed face, missing eyeballs, "
    "low-quality, low-resolution, grainy, overly saturated, poorly rendered, distorted face, extra faces"
    "candle lamp, alcohol burner, modern lamp, candles, electric lamp, glass lamp, chandelier, lantern,"
    "muscles, angry face, mustache, muscular body, muscular arms, bulky bodyshape, creepy, angry, ugly, wrinkly skin, old, cranky, " 
    "scary, blurry, hyper-realistic, overly defined muscles, bodybuilder, superhero physique, deformed face, deformed nose, malformed face"
)

# ✅ 상태 변수 (비동기 작업 상태 관리)
image_generation_status = {
    "processing": False,
    "image_urls": []
}

# ✅ 이미지 전처리 (명암 & 선명도 조정)
def preprocess_sketch(image):
    contrast = ImageEnhance.Contrast(image).enhance(1.8)
    sharpness = ImageEnhance.Sharpness(contrast).enhance(1.5)
    return sharpness.resize((380, 380), Image.Resampling.LANCZOS)

# ✅ 비동기 이미지 생성 함수 (스케치 포함)
def generate_images(prompt, control_image):
    global image_generation_status

    # ✅ 상태 변경 (이미지 생성 중)
    image_generation_status["processing"] = True
    image_generation_status["image_urls"] = []

    generator = torch.Generator(device).manual_seed(42)
    output_paths = []

    for i in range(3):
        output = pipe(
            prompt=prompt,
            negative_prompt=negative_prompt,
            image=control_image,
            num_inference_steps=75,
            guidance_scale=9.0,
            generator=generator
        ).images[0]

        output_filename = f"output_{i+1}.png"
        output_path = os.path.join(OUTPUT_FOLDER, output_filename)
        output.save(output_path)
        output_paths.append(f"/static/output/{output_filename}")

    # ✅ 상태 변경 (이미지 생성 완료)
    image_generation_status["processing"] = False
    image_generation_status["image_urls"] = output_paths
    print(f"✅ Image generation complete: {output_paths}")

# ✅ 클라이언트에서 `/api/generate` 호출 시 실행
@app.route('/api/generate', methods=['POST'])
def generate():
    try:
        data = request.json
        image_data = data.get("image", None)
        prompt = data.get("prompt", "A default prompt")

        if not image_data:
            return jsonify({"error": "이미지가 전송되지 않았습니다."}), 400

        # ✅ Base64 → PIL 변환
        image_bytes = base64.b64decode(image_data.split(",")[1])
        image = Image.open(BytesIO(image_bytes)).convert("RGB")

        # ✅ 이미지 전처리
        control_image = preprocess_sketch(image)

        # ✅ 상태 초기화
        global image_generation_status
        image_generation_status = {
            "processing": True,
            "image_urls": []
        }

        # ✅ 비동기 이미지 생성 실행
        threading.Thread(target=generate_images, args=(prompt, control_image)).start()

        return jsonify({"message": "이미지 생성 중", "status": "processing"}), 202

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ✅ makeimage.html에서 호출
@app.route('/api/status', methods=['GET'])
def check_status():
    return jsonify(image_generation_status)

# ✅ 생성된 이미지 제공
@app.route('/output/<filename>')
def static_files(filename):
    return send_from_directory('static/output', filename)

# ✅ 프롬프트 API
@app.route('/api/generate_prompt', methods=['POST'])
def generate_prompt():
    try:
        data = request.json
        prompts = data.get("prompts", [])

        # ✅ 프롬프트 개수 제한 (최소 1개, 최대 4개)
        if not isinstance(prompts, list) or not (1 <= len(prompts) <= 4):
            return jsonify({"error": "프롬프트는 최소 1개, 최대 4개까지 입력 가능합니다."}), 400

        # ✅ 상태 초기화
        global image_generation_status
        image_generation_status = {"processing": True, "image_urls": []}

        # ✅ ControlNet에 넘길 빈 이미지 생성 (스케치 없이 프롬프트만 사용)
        blank_image = Image.new("RGB", (512, 512), (255, 255, 255))

        # ✅ 비동기 이미지 생성 실행
        threading.Thread(target=generate_images_from_prompts, args=(prompts, blank_image)).start()

        return jsonify({"message": "이미지 생성 중", "status": "processing"}), 202

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ✅ 비동기 이미지 생성 함수 (프롬프트 개수에 맞게 이미지 생성)
def generate_images_from_prompts(prompts, control_image):
    global image_generation_status

    image_generation_status["processing"] = True
    image_generation_status["image_urls"] = []

    generator = torch.Generator(device).manual_seed(42)
    output_paths = []

    for i, prompt in enumerate(prompts):
        output = pipe(
            prompt=prompt,
            negative_prompt=negative_prompt,
            image=control_image,
            num_inference_steps=75,
            guidance_scale=9.0,
            generator=generator
        ).images[0]

        output_filename = f"output_{i+1}.png"
        output_path = os.path.join(OUTPUT_FOLDER, output_filename)
        output.save(output_path)
        output_paths.append(f"/static/output/{output_filename}")

    image_generation_status["processing"] = False
    image_generation_status["image_urls"] = output_paths
    print(f"✅ Image generation complete: {output_paths}")

if __name__ == '__main__':
    app.run(
        host='0.0.0.0', 
        port=443,
        ssl_context=('/etc/letsencrypt/live/drawry.r-e.kr/fullchain.pem', 
                     '/etc/letsencrypt/live/drawry.r-e.kr/privkey.pem')
    )

# # ✅ Flask 서버 실행
# if __name__ == '__main__':
#     app.run(
#         host='0.0.0.0',
#         port=443,  # 5000 대신 443 사용
#         ssl_context=('cert.pem', 'key.pem')
#     )

#아래 명령어로 서버 가동할 수 있습니다.
#sudo /home/azureuser/venv/bin/python app.py
