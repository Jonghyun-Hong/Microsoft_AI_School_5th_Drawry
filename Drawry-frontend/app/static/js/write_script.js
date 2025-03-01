let canvas, ctx, isDrawing;
let words = [
  "마 법",
  "램 프",
  "보 물",
  "양 탄 자",
  "날 다",
  "세 가 지",
  "세 계",
  "타 다",
  "발 견",
  "소 원",
  "시 장",
  "왕 궁",
  "동 굴",
];
let word = words[Math.floor(Math.random() * words.length)];
let isStarted = false;

function startGame(event) {
  event.preventDefault();
  if (isStarted) return;
  isStarted = true;
  document.getElementById("section-1").style.display = "none";
  document.getElementById("section-2").style.display = "block";
}

document.getElementById("startBtn").addEventListener("pointerdown", startGame);
document
  .getElementById("speakIntro")
  .addEventListener("pointerdown", () => speakTextWithAzure("날따라써봐요!"));
document.querySelectorAll(".help").forEach((helpButton) => {
  helpButton.addEventListener("pointerdown", openInfoModal);
});
document
  .getElementById("helpCloseBtn")
  .addEventListener("pointerdown", closeInfoModal);
document
  .getElementById("helpModalOverlay")
  .addEventListener("pointerdown", closeInfoModal);
document
  .getElementById("helpSpeakBtn")
  .addEventListener("pointerdown", speakGameInstructions);

document.getElementById("wordSpeakBtn").addEventListener("pointerdown", () => {
  speakTextWithAzure(word);
});

function openInfoModal(event) {
  event.preventDefault();
  document.getElementById("helpModal").style.display = "block";
  document.getElementById("helpModalOverlay").style.display = "block";
}

function closeInfoModal(event) {
  event.preventDefault();
  document.getElementById("helpModal").style.display = "none";
  document.getElementById("helpModalOverlay").style.display = "none";
}

function speakGameInstructions(event) {
  event.preventDefault();
  speakTextWithAzure(
    "듣기 버튼을 눌러서 단어를 들어봐. 화면에 보이는 단어를 따라써보자. 지우기 버튼을 누르면 지울 수 있어. 다 썼으면 채점 버튼을 눌러줘."
  );
}

// 🎨 캔버스 초기화
window.onload = function () {
  canvas = document.getElementById("drawCanvas");
  ctx = canvas.getContext("2d", { willReadFrequently: true });

  canvas.width = 800;
  canvas.height = 400;
  isDrawing = false;

  drawWord();
  addCanvasListeners();
};

// 📌 캔버스에 단어 표시
function drawWord() {
  ctx.fillStyle = "rgba(150, 150, 150, 0.5)";
  ctx.font = "200px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(word, canvas.width / 2, canvas.height / 2);
}

// ✍️ 캔버스 이벤트 리스너 등록
function addCanvasListeners() {
  canvas.addEventListener("mousedown", startDraw);
  canvas.addEventListener("mousemove", draw);
  canvas.addEventListener("mouseup", stopDraw);
  canvas.addEventListener("mouseleave", stopDraw);
  canvas.addEventListener("touchstart", startDraw);
  canvas.addEventListener("touchmove", draw);
  canvas.addEventListener("touchend", stopDraw);
}

function startDraw(event) {
  isDrawing = true;
  ctx.beginPath();
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.strokeStyle = "black";
  draw(event);
}

function draw(event) {
  if (!isDrawing) return;
  let x, y;
  if (event.touches) {
    x = event.touches[0].clientX - canvas.getBoundingClientRect().left;
    y = event.touches[0].clientY - canvas.getBoundingClientRect().top;
  } else {
    x = event.clientX - canvas.getBoundingClientRect().left;
    y = event.clientY - canvas.getBoundingClientRect().top;
  }
  ctx.lineTo(x, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y);
  event.preventDefault();
}

function stopDraw() {
  isDrawing = false;
  ctx.beginPath();
}

function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawWord();
}

// ✅ 주변 3x3 픽셀까지 검사하여 정확도를 높임
function isNearBlack(x, y, imageData) {
  let width = imageData.width;
  let data = imageData.data;

  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      let nx = x + dx;
      let ny = y + dy;

      if (nx < 0 || ny < 0 || nx >= width || ny >= imageData.height) continue;

      let index = (ny * width + nx) * 4;
      let r = data[index],
        g = data[index + 1],
        b = data[index + 2];

      if (r < 80 && g < 80 && b < 80) return true; // 검은색(또는 어두운 회색) 픽셀 발견
    }
  }
  return false;
}

// ✅ 글자 채점 함수 수정
async function gradeHandwriting() {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  let totalPixels = 0;
  let correctPixels = 0;
  let hasDrawing = false;

  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      let i = (y * canvas.width + x) * 4;
      const red = data[i],
        green = data[i + 1],
        blue = data[i + 2];

      // 검은색 선을 그렸는지 확인
      if (red < 80 && green < 80 && blue < 80) {
        hasDrawing = true;
      }

      // 회색 글자 픽셀 확인
      if (
        red >= 140 &&
        red <= 160 &&
        green >= 140 &&
        green <= 160 &&
        blue >= 140 &&
        blue <= 160
      ) {
        totalPixels++;

        // ✅ 주변 픽셀까지 검사하여 사용자가 덮어썼는지 확인
        if (isNearBlack(x, y, imageData)) {
          correctPixels++;
        }
      }
    }
  }

  console.log(
    `📊 totalPixels: ${totalPixels}, correctPixels: ${correctPixels}`
  );

  let score =
    totalPixels > 0 ? Math.round((correctPixels / totalPixels) * 100) : 0;
  console.log(`📊 채점된 점수: ${score}`);

  let isCorrect = score >= 14;
  let resultText = score > 0 ? "참 잘 했어요! 😊" : "다시 시도해보세요! ❌";
  document.getElementById("resultText").innerText = resultText;
  document.getElementById("resultModal").style.display = "block";
  document.getElementById("modalOverlay").style.display = "block";
  speakTextWithAzure("딩동댕");

  // ✅ 시도에 따라 결과 전송
  if (isCorrect) {
    submitGameResult(true);
  } else {
    submitGameResult(false);
  }

  // ✅ 서버로 점수 전송
  try {
    let response = await fetch("/submit-score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score: score }),
    });

    if (!response.ok) throw new Error("서버 응답 오류");

    let result = await response.json();
    console.log("✅ 서버 응답:", result);
  } catch (error) {
    console.error("❌ 서버 전송 실패:", error);
  }
}

// "채점" 버튼 이벤트 리스너 등록
document.querySelector(".score").addEventListener("click", gradeHandwriting);

// ✅ 모달 닫기 기능 추가
document.getElementById("confirmButton").addEventListener("click", () => {
  document.getElementById("resultModal").style.display = "none";
  document.getElementById("modalOverlay").style.display = "none";
  window.location.href = "/makestory";
});

function submitGameResult(isCorrect) {
  const gameName = "쓰기"; // ✍️ 글쓰기 게임
  fetch("https://52.141.27.150/submit_evaluation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ game_name: gameName, success: isCorrect ? 1 : 0 }),
  })
    .then((response) => response.json())
    .then((data) => console.log(`✅ ${gameName} 결과 전송 완료:`, data))
    .catch((error) => console.error(`❌ ${gameName} 결과 전송 실패:`, error));
}
