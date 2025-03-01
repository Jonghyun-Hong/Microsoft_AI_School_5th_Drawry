import CONFIG from "./config.js";

// 요소 가져오기
const canvas = document.getElementById("drawingCanvas");
const ctx = canvas.getContext("2d");
const startDrawingBtn = document.getElementById("startDrawingBtn");
const stopDrawingBtn = document.getElementById("stopDrawingBtn");
const clearBtn = document.getElementById("clearBtn");
const saveBtn = document.getElementById("saveBtn");
const colorPicker = document.getElementById("colorPicker");
const penSize = document.getElementById("penSize");
const container = document.getElementById("container");

let drawing = false;
let isDrawingActive = false; // 그리기 모드 활성화 여부

/**
 * 프롬프트 생성 함수 - 선택된 장소, 시간, 행동에 따른 적절한 프롬프트 반환
 */
function generatePrompt() {
  const time = localStorage.getItem("time") || "알 수 없는 시간";
  const place = localStorage.getItem("place") || "알 수 없는 장소";
  const action = localStorage.getItem("action") || "알 수 없는 행동";

  const prompts = {
    아그라바: {
      "마법의 램프로 세가지 소원을 빌기 시작했어!":
        "(A young Arabian street boy:1.8) making wishes with a mystical (antique brass tea kettle:1.8) in Agrabah, a grand desert city where golden domes shimmer under the sun and bustling markets echo with lively chatter.",
      "반짝이는 보물을 발견했어!":
        "(A young Arabian street boy:1.8) discovering (sparkling treasures:1.6) in Agrabah, hidden within an ancient palace adorned with intricate carvings and towering marble columns. The treasures are gleaming gold coins, ornate gemstone-encrusted goblets, and intricately crafted jewelry.",
      "마법의 양탄자를 타고 날아다니고 있어!":
        "(A young Arabian boy:1.8) flying around on a (flying magic carpet:1.8) in Agrabah, gliding over sunlit alleys, bustling spice markets, and golden domes gleaming under the bright desert sky. The magic carpet was woven with golden threads, adorned with intricate patterns, and shimmered with an enchanted glow.",
    },
    시장: {
      "마법의 램프로 세가지 소원을 빌기 시작했어!":
        "(A young Arabian boy:1.8) making wishes with a mystical (antique brass tea kettle:1.8) in a narrow market filled with antique lamps, intricate carpets, and glass bottles. The brass kettle gleamed with golden engravings, radiating a faint, mystical aura.",
      "반짝이는 보물을 발견했어!":
        "(A young Arabian boy:1.9), a single character, discovering a pile of treasures with glittering jewels and gold in the middle of the (market:1.6). The market is a maze of narrow alleys, filled with antique lamps, intricate carpets, and mysterious glass bottles.",
      "마법의 양탄자를 타고 날아다니고 있어!":
        "(A young Arabian boy:1.9) soaring above the bustling market on a (flying magic carpet:1.8), weaving through narrow alleys lined with colorful stalls, glowing lanterns, and exotic goods.",
    },
    왕궁: {
      "마법의 램프로 세가지 소원을 빌기 시작했어!":
        "(A young Arabian boy:1.8) making wishes with a mystical (antique brass tea-kettle:1.8) in the palace. The brass kettle gleamed with golden engravings, radiating a faint, mystical aura.",
      "반짝이는 보물을 발견했어!":
        "(A young Arabian boy:1.8) discovering (sparkling Arabian treasures:1.6) with glittering jewels and gold in the palace.",
      "마법의 양탄자를 타고 날아다니고 있어!":
        "(A young Arabian prince:1.8) flying on a magical (flying Arabian carpet:1.6) in the palace.",
    },
    "마법의 동굴": {
      "마법의 램프로 세가지 소원을 빌기 시작했어!":
        "(A young Arabian boy:1.8) making wishes with a mystical (antique brass tea kettle:1.6) in the (cave:1.5) of wonders. His face is lit with hopefulness and happiness.",
      "반짝이는 보물을 발견했어!":
        "(A young Arabian boy:1.8) discovering sparkling golden (Arabian treasures:1.6) in the cave of wonders.",
      "마법의 양탄자를 타고 날아다니고 있어!":
        "(A young Arabian prince:1.8) flying on a magical (flying Arabian carpet:1.6) in the cave. The magical flying Arabian carpet was richly woven with intricate geometric patterns and deep crimson and sapphire hues. Its edges fluttered gently as it soared through the air, leaving behind a faint trail of shimmering dust.",
    },
    "지니의 세계": {
      "마법의 램프로 세가지 소원을 빌기 시작했어!":
        "(A young Arabian boy:1.8) making wishes in the genie's world, holding an antique brass tea kettle. His eyes shine with wonder as the glowing blue realm surrounds him. Floating sapphire crystals sparkle, mist swirls with whispers of magic, and waterfalls of stardust cascade from floating islands.",
      "반짝이는 보물을 발견했어!":
        "(A young Arabian boy:1.8) discovering (sparkling treasures:1.6) in the world of the genie. Piles of gold and jewels shimmered under the blue glow, while enchanted artifacts pulsed with mystical energy.",
      "마법의 양탄자를 타고 날아다니고 있어!":
        "(A young Arabian prince:1.8) flying on a magical (flying Arabian carpet:1.6) in the world of genie. The magical flying Arabian carpet was richly woven with intricate geometric patterns, and deep crimson and sapphire hues. Its edges fluttered gently as it soared through the air, leaving behind a faint trail of shimmering dust.",
    },
  };

  // 프롬프트 객체에서 적절한 값 가져오기, 없을 경우 기본값 사용
  let prompt = prompts[place]?.[action] || "A character in a fantasy world";

  // 밤인 경우 처리
  if (time === "밤") {
    // sun, bright, sunlit 관련 문구 제거
    prompt = prompt.replace(
      /under the sun|under the bright desert sky|sunlit/,
      ""
    );

    // 마지막에 at night 추가 (마침표 있으면 그 앞에 추가)
    if (prompt.endsWith(".")) {
      prompt = prompt.slice(0, -1) + " at night.";
    } else {
      prompt = prompt + " at night.";
    }
  }

  return prompt;
}

/**
 * 이벤트 좌표 보정 함수 - 터치/마우스 좌표를 캔버스 좌표로 변환
 */
function getEventPos(e) {
  const rect = canvas.getBoundingClientRect();
  let offsetX, offsetY;

  if (e.touches && e.touches[0]) {
    // 🖐️ 터치 이벤트 처리
    offsetX = e.touches[0].clientX - rect.left;
    offsetY = e.touches[0].clientY - rect.top;
  } else {
    // 🖱️ 마우스 이벤트 처리
    offsetX = e.offsetX;
    offsetY = e.offsetY;
  }

  // 📌 CSS 표시 크기와 실제 canvas 해상도 비율을 고려해 보정
  return {
    offsetX: offsetX * (canvas.width / rect.width),
    offsetY: offsetY * (canvas.height / rect.height),
  };
}

// 실제 그리기 시작
function startDrawing(e) {
  if (!isDrawingActive) return;
  drawing = true;

  // UI에서 설정한 색상, 굵기 적용
  ctx.strokeStyle = colorPicker.value;
  ctx.lineWidth = penSize.value;
  ctx.lineCap = "round";

  // 시작 좌표
  const pos = getEventPos(e);
  ctx.beginPath();
  ctx.moveTo(pos.offsetX, pos.offsetY);
  e.preventDefault();
}

// 그리기 진행
function draw(e) {
  if (!drawing || !isDrawingActive) return;
  const pos = getEventPos(e);
  ctx.lineTo(pos.offsetX, pos.offsetY);
  ctx.stroke();
  e.preventDefault();
}

// 그리기 종료
function stopDrawing(e) {
  if (!isDrawingActive) return;
  drawing = false;
  ctx.closePath();
  if (e) e.preventDefault();
}

// 페이지 로드 시 초기화
window.onload = function () {
  // 🎨 자동으로 그리기 활성화
  isDrawingActive = true;
  startDrawingBtn.disabled = true; // 연필 버튼 비활성화
  stopDrawingBtn.disabled = false; // 정지 버튼 활성화
  canvas.style.borderColor = "#FF4F03"; // 활성화 표시

  // 캔버스 실제 해상도 설정 (2:1 비율 유지)
  canvas.width = Math.min(container.clientWidth * 0.95, 1024);
  canvas.height = canvas.width / 2;

  // CSS 스타일에 반영 (화면 표시용 크기)
  canvas.style.width = `${canvas.width}px`;
  canvas.style.height = `${canvas.height}px`;

  // 이전 선택 정보 불러오기
  const time = localStorage.getItem("time") || "알 수 없는 시간";
  const place = localStorage.getItem("place") || "알 수 없는 장소";
  const action = localStorage.getItem("action") || "알 수 없는 행동";

  // 디버깅을 위한 로그
  console.log("시간:", time);
  console.log("장소:", place);
  console.log("행동:", action);

  // 프롬프트 생성 및 표시
  const prompt = generatePrompt();
  console.log("생성된 프롬프트:", prompt);

  // 📌 선택 정보 표시
  const selectedInfo = document.getElementById("selectedInfo");
  if (selectedInfo) {
    selectedInfo.innerText = `"알라딘 ${time}에 ${place}에서 ${action}"
  우리 이 장면을 한번 그려볼까 ? (눈👀, 코👃, 입👄까지 다 그려줘야 돼!)`;
    selectedInfo.style.display = "block"; // 페이지 로드되면 바로 표시
  }

  console.log("✅ 페이지 로드 시 자동으로 그리기 모드 활성화됨!");
};

// 이벤트 리스너 등록
// 마우스 이벤트 리스너
canvas.addEventListener("mousedown", startDrawing);
canvas.addEventListener("mousemove", draw);
canvas.addEventListener("mouseup", stopDrawing);
canvas.addEventListener("mouseleave", stopDrawing);

// 터치 이벤트 리스너 (모바일 지원)
canvas.addEventListener("touchstart", startDrawing);
canvas.addEventListener("touchmove", draw);
canvas.addEventListener("touchend", stopDrawing);
canvas.addEventListener("touchcancel", stopDrawing);

// 뒤로가기 버튼 이벤트
document.getElementById("backBtn").addEventListener("click", function () {
  window.location.href = "/getcharacter";
});

// 그리기 중지 버튼 이벤트
stopDrawingBtn.addEventListener("click", () => {
  isDrawingActive = false;
  drawing = false;
  startDrawingBtn.disabled = false;
  stopDrawingBtn.disabled = true;
  canvas.style.borderColor = "#ff8e03"; // 비활성화 표시
});

// 그리기 시작 버튼 이벤트
startDrawingBtn.addEventListener("click", () => {
  isDrawingActive = true;
  startDrawingBtn.disabled = true;
  stopDrawingBtn.disabled = false;
  canvas.style.borderColor = "#FF4F03"; // 활성화 표시
});

// 캔버스 지우기 버튼 이벤트
clearBtn.addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

// 그림 저장(생성) 버튼 이벤트
saveBtn.addEventListener("click", async () => {
  try {
    console.log("Flask 서버 URL:", CONFIG.FLASK_SERVER);
    const imageData = canvas.toDataURL("image/png");
    const prompt = generatePrompt();

    console.log("📤 Sending request to Flask...");
    console.log("Prompt:", prompt);

    localStorage.setItem("imageProcessing", "true");

    const fetchOptions = {
      method: "POST",
      body: JSON.stringify({
        image: imageData,
        prompt: prompt,
      }),
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      mode: "cors",
      cache: "no-cache",
    };

    console.log("Sending request to:", `${CONFIG.FLASK_SERVER}/api/generate`);
    const response = await fetch(
      `${CONFIG.FLASK_SERVER}/api/generate`,
      fetchOptions
    );
    console.log("Response status:", response.status);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Response data:", data);

    if (data.status === "processing") {
      // 성공적으로 처리 시작됨
      window.location.href = "/makeimage";
    } else {
      throw new Error("이미지 생성 실패");
    }
  } catch (error) {
    console.error("Error details:", error);
    alert("서버 통신 중 오류가 발생했습니다: " + error.message);
  }

  // 다른 페이지로 이동
  window.location.href = "/makeimage";
});
