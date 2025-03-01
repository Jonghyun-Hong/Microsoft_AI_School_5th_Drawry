let PointCalibrate = 0;
let CalibrationPoints = {};
let webgazerInitialized = false;
const mooSound = document.getElementById("mooSound");
let gazeData = [];
let currentWord = "";
let startTime = 0;
let isStarted = false;
let section1 = document.getElementById("section-1");
let startBtn = document.getElementById("startBtn");

document.getElementById("startBtn").addEventListener("pointerdown", startGame);

function startGame(event) {
  event.preventDefault();
  if (isStarted) return;
  isStarted = true;
  document.getElementById("section-1").style.display = "none";
  document.getElementById("section-2").style.display = "block";
  initWebgazer();
}

document
  .getElementById("speakIntro")
  .addEventListener("pointerdown", () => speakTextWithAzure("동화!읽어보자!"));

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
    "소 여덟 마리를 눌러볼까 ? 소 한마리를 세번씩 눌러줘 ! 소를 꼭 바라보면서 눌러야돼! 소가 회색으로 변하면 다른 소를 누르면 돼! 그리고 문장의 부분들을 눌러가면서 소리를 들어보자!"
  );
}

async function checkWebcamPermission() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    stream.getTracks().forEach((track) => track.stop());
    return true;
  } catch (err) {
    console.error("Webcam permission denied:", err);
    return false;
  }
}

async function initWebgazer() {
  if (webgazerInitialized) return;

  // const statusEl = document.getElementById('status');
  const loadingEl = document.getElementById("loading");

  try {
    const hasPermission = await checkWebcamPermission();
    if (!hasPermission) throw new Error("카메라 권한이 거부되었습니다.");

    // statusEl.textContent = 'Status: WebGazer 초기화 중...';
    await webgazer.setRegression("ridge").setTracker("TFFacemesh").begin();

    webgazer
      .showVideoPreview(true)
      .showPredictionPoints(true)
      .applyKalmanFilter(true);

    webgazerInitialized = true;
    // statusEl.textContent = 'Status: 준비완료';
    loadingEl.style.display = "none";
    document.getElementById("CalibrateButton").style.display = "block";

    setCalibrationPoints();
    showCalibrationPoints();
  } catch (error) {
    console.error("WebGazer initialization error:", error);
    // statusEl.textContent = 'Status: 초기화 실패';
    loadingEl.innerHTML = `초기화 실패<br>${error.message}<br>페이지를 새로고침하여 다시 시도해주세요.`;
  }
}

function setCalibrationPoints() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const padding = 50;
  const points = {
    Pt1: [padding, padding], // 새로운 Pt1 (왼쪽 상단)
    Pt3: [width - padding, padding],
    Pt4: [padding, height / 2],
    Pt5: [width / 2, height / 2],
    Pt6: [width - padding, height / 2],
    Pt7: [padding, height - padding],
    Pt8: [width / 2, height - padding],
    Pt9: [width - padding, height - padding],
  };

  Object.keys(points).forEach((pointId) => {
    let point = document.getElementById(pointId);
    if (point) {
      point.style.left = points[pointId][0] - 10 + "px";
      point.style.top = points[pointId][1] - 10 + "px";
    }
  });
}

async function restart() {
  if (!webgazerInitialized) {
    await initWebgazer();
    return;
  }
  webgazer.clearData();
  clearCalibration();
  showCalibrationPoints();
}

function clearCalibration() {
  document.querySelectorAll(".Calibration").forEach((el) => {
    el.style.display = "none";
    el.style.backgroundColor = "red";
    el.classList.remove("calibrated");
    el.style.opacity = "1";
  });
  CalibrationPoints = {};
  PointCalibrate = 0;
}

function showCalibrationPoints() {
  document.getElementById("calibrationDiv").style.display = "block";
  document.querySelectorAll(".Calibration").forEach((el) => {
    el.style.display = "block";
  });
}

document.querySelectorAll(".Calibration").forEach((el) => {
  el.addEventListener("pointerdown", function (event) {
    if (!webgazerInitialized) return;

    CalibrationPoints[event.target.id] =
      (CalibrationPoints[event.target.id] || 0) + 1;
    mooSound.currentTime = 0;
    mooSound.play();

    el.style.opacity = 0.2 + CalibrationPoints[event.target.id] * 0.15;

    if (CalibrationPoints[event.target.id] === 3) {
      el.style.backgroundColor = "green";
      el.style.opacity = "0.7";
      el.classList.add("calibrated");
      PointCalibrate++;
    }

    if (PointCalibrate === 8) {
      console.log("모든 포인트 캘리브레이션 완료!");
      document.getElementById("calibrationDiv").style.display = "none"; // 캘리브레이션 UI 숨김
      setTimeout(goToReadingSection, 1000); // 1초 후 다음 화면으로 이동
    }

    function goToReadingSection() {
      document.getElementById("section-2").style.display = "none"; // 캘리브레이션 화면 숨김
      document.getElementById("section-3").style.display = "block"; // 문장 읽기 화면 표시
    }
  });
});

webgazer
  .setGazeListener((data, elapsedTime) => {
    if (data == null) return;
    gazeData.push({ x: data.x, y: data.y, time: Date.now() });
  })
  .begin();

document.querySelectorAll("[data-word]").forEach((span) => {
  span.addEventListener("pointerdown", async function (event) {
    event.preventDefault();
    currentWord = this.getAttribute("data-word");
    startTime = Date.now();
    gazeData = [];
    speakTextWithAzure(currentWord);

    // 클릭 시 텍스트 색상 변경 및 효과 추가
    this.style.color = "#4caf50";
    this.style.transition = "transform 0.3s ease, color 0.3s ease";
    this.style.transform = "scale(1.2) rotate(-5deg)";
    setTimeout(() => {
      this.style.transform = "scale(1) rotate(0)";
    }, 300);
  });
});

document.getElementById("nextBtn").addEventListener("pointerdown", () => {
  console.log("🛠️ 점수 계산 시작!");
  calculateAttentionScore();
});

function onSentenceComplete() {
  console.log("✅ 문장 읽기 완료!");
  document.getElementById("nextBtn").style.display = "block"; // 버튼 표시
}

function calculateAttentionScore() {
  let endTime = Date.now();
  let duration = endTime - startTime;
  console.log(`⏱️ Duration: ${duration}ms`); // 게임 진행 시간 확인

  let relevantGaze = gazeData.filter((g) => isGazeOnWord(g, currentWord));
  console.log(`📌 Relevant Gaze Data:`, relevantGaze); // 현재 단어에 대한 시선 추적 데이터 확인

  let focusRatio =
    gazeData.length > 0 ? relevantGaze.length / gazeData.length : 0;
  let attentionScore = focusRatio * 100;

  console.log(`🎯 Focus Ratio: ${focusRatio}`);
  console.log(`⭐ Attention Score: ${attentionScore}`);

  sendScoreToServer(attentionScore);
}

function isGazeOnWord(gaze, word) {
  let span = document.querySelector(`span[data-word="${word}"]`);
  if (!span) {
    console.warn(`⚠️ Span for word "${word}" not found!`);
    return false;
  }

  let rect = span.getBoundingClientRect();
  console.log(`📏 Word "${word}" Bounding Box:`, rect); // 단어 위치 확인

  let isOnWord =
    gaze.x >= rect.left &&
    gaze.x <= rect.right &&
    gaze.y >= rect.top &&
    gaze.y <= rect.bottom;
  console.log(`👀 Gaze (${gaze.x}, ${gaze.y}) on "${word}": ${isOnWord}`);

  return isOnWord;
}

function sendScoreToServer(score) {
  console.log(`🚀 Sending score... Word: ${currentWord}, Score: ${score}`);

  fetch("/submit_score", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ word: currentWord, score: score }),
  })
    .then((response) => response.json())
    .then((data) => console.log("✅ Score sent successfully:", data))
    .catch((error) => console.error("❌ Error sending score:", error));
}

document.getElementById("nextBtn").addEventListener("click", () => {
  // 🔹 Azure TTS로 "딩동댕!" 재생
  speakTextWithAzure("딩동댕!");

  // 결과 모달 띄우기
  document.getElementById("modalOverlay").style.display = "block";
  document.getElementById("resultModal").style.display = "block";

  // 결과 모달 메시지 업데이트
  document.getElementById("resultText").innerHTML =
    "우와 최고야 😆 다음 게임 하러 갈까 ?";
  document.getElementById("confirmButton").textContent = "좋아 .ᐟ";
  document.getElementById("confirmButton").onclick = function () {
    window.location.href = "/read";
  };
});
function submitAttentionScore(attentionScore) {
  const gameName = "집중력"; // 집중력 평가 게임
  fetch("https://52.141.27.150/submit_evaluation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      game_name: gameName,
      success: attentionScore / 100,
    }), // 0 ~ 1 범위로 변환
  })
    .then((response) => response.json())
    .then((data) => console.log(`✅ ${gameName} 결과 전송 완료:`, data))
    .catch((error) => console.error(`❌ ${gameName} 결과 전송 실패:`, error));
}
