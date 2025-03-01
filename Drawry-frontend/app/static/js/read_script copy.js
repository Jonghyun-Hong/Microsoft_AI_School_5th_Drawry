let sentence = ""; // 초기 문장
let recordedAudioUrl = ""; // 녹음된 오디오 파일 URL 저장
let isStarted = false;

let bgMusic = document.getElementById("bg-music");
bgMusic.volume = 0.1; // 볼륨 조절

document.addEventListener("DOMContentLoaded", () => {
  loadRandomSentence(); // 초기 랜덤 문장 로드
});
function loadRandomSentence() {
  try {
    // 저장된 모든 응답 수집
    const responses = [];
    let i = 1;
    while (true) {
      const response = localStorage.getItem(`storyResponse_${i}`);
      if (!response) break;
      responses.push(response);
      i++;
    }

    if (responses.length > 0) {
      const randomIndex = Math.floor(Math.random() * responses.length);
      let sentence = responses[randomIndex];

      // 정규식으로 [ ] 안의 모든 내용 제거
      sentence = sentence.replace(/\[.*?\]/g, "").trim();

      // 문장을 마침표(.) 기준으로 분리
      let sentenceArray = sentence
        .split(/(?<=\.)\s+/)
        .map((s) => s.trim())
        .filter((s) => s);

      // 최대 글자 수 (예: 35자로 설정)
      const maxCharsPerLine = 35;

      // 문장에 줄바꿈 추가하는 함수
      function addLineBreaks(text, maxChars) {
        if (text.length <= maxChars) return text; // 길이가 maxChars보다 작으면 그대로 반환

        let result = "";
        let currentLine = "";

        for (let word of text.split(" ")) {
          if ((currentLine + word).length > maxChars) {
            result += currentLine.trim() + "<br>"; // 줄바꿈 추가
            currentLine = word + " ";
          } else {
            currentLine += word + " ";
          }
        }

        return result + currentLine.trim(); // 마지막 줄 추가
      }

      // 각 문장에 개별적인 듣기(🎧) & 녹음(🎤) 버튼 추가 + 줄바꿈 적용
      const formattedSentence = sentenceArray
        .map(
          (s, index) =>
            `<div class="sentence-block">
                      <span class="sentence" id="sentence-${index}">${addLineBreaks(
              s,
              maxCharsPerLine
            )}</span> 
                      <button class="tts-btn" onclick="speakTextWithAzure('${s}')">🎧</button>
                      <button class="record-btn" onclick="startRecording(${index}, '${s}')">🎤</button>
                      <span id="accuracy-${index}" class="accuracy-score"></span>
                  </div>`
        )
        .join("");

      document.getElementById("text-container").innerHTML = formattedSentence;
    } else {
      sentence = "저장된 문장이 없습니다. 동화를 먼저 만들어주세요!";
      document.getElementById("text-container").innerHTML = sentence;
    }
  } catch (error) {
    console.error("문장 로드 오류:", error);
    sentence = "문장을 불러오는데 실패했습니다.";
    document.getElementById("text-container").innerHTML = sentence;
  }
}
function loadAllResponses() {
  try {
    let i = 1;
    let lastResponse = "";
    while (true) {
      const response = localStorage.getItem(`storyResponse_${i}`);
      if (!response) break;
      lastResponse = response; // 마지막 저장된 문장으로 업데이트
      i++;
    }

    if (lastResponse) {
      document.getElementById("all-text-container").innerHTML = `
        <div class="sentence-all">
          <span class="sentence" id="sentence-all">${lastResponse.trim()}</span> 
          <button class="tts" onclick="speakTextWithAzure(${JSON.stringify(
            lastResponse.trim()
          )})">🎧</button>
          <button class="mic" onclick="startRecording(0, ${JSON.stringify(
            lastResponse.trim()
          )})">🎤</button>
          <span id="accuracy-0" class="accuracy-score"></span>
        </div>`;
    } else {
      document.getElementById("all-text-container").innerHTML =
        "저장된 문장이 없습니다.";
    }
  } catch (error) {
    console.error("문장 로드 오류:", error);
    document.getElementById("all-text-container").innerHTML =
      "문장을 불러오는데 실패했습니다.";
  }
}
document.addEventListener("click", function (event) {
  if (event.target.classList.contains("tts")) {
    const text = event.target.previousElementSibling.innerText.trim();
    speakTextWithAzure(text);
  }
});

// 새로운 문장 선택
function changeRandomSentence() {
  const currentSentence = sentence;
  loadRandomSentence();

  // 같은 문장이 선택되었다면 다시 시도
  if (sentence === currentSentence) {
    loadRandomSentence();
  }

  // 정확도 초기화
  document.getElementById("accuracy").innerText = "";
}

document.getElementById("startBtn").addEventListener("pointerdown", startGame);

function startGame(event) {
  event.preventDefault();
  bgMusic.pause();
  bgMusic.currentTime = 0;
  if (isStarted) return;
  isStarted = true;
  document.getElementById("section-1").style.display = "none";
  document.getElementById("section-2").style.display = "block";
}

const nextBtn = document.getElementById("nextBtn");
nextBtn.addEventListener("click", () => {
  document.getElementById("section-2").style.display = "none";
  document.getElementById("section-3").style.display = "block";
  loadAllResponses();
});

document
  .getElementById("speakIntro")
  .addEventListener("pointerdown", () => speakTextWithAzure("듣고!말하고!"));

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
document
  .getElementById("speakRead")
  .addEventListener("pointerdown", speakGameRead);

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
    "동화책에서 만든 문장을 우리 읽어보자 듣기 버튼을 눌러서 각 문장을 들어봐 !"
  );
}
function speakGameRead(event) {
  event.preventDefault();
  speakTextWithAzure("아래 문장들을 따라 읽어보자.");
}
function speakAllSentences() {
  // 모든 문장을 가져와 하나의 문자열로 합치기
  const sentences = Array.from(document.querySelectorAll(".sentence"))
    .map((span) => span.innerText.trim()) // 문장만 추출하여 공백 제거
    .join(" "); // 문장 사이에 공백 추가

  // 전체 문장이 존재하면 읽기 실행
  if (sentences) {
    speakTextWithAzure(sentences);
  } else {
    console.error("문장을 찾을 수 없습니다.");
  }
}

document.getElementById("nextBtn").addEventListener("click", () => {
  document.getElementById("section-2").style.display = "none";
  document.getElementById("section-3").style.display = "block";

  // 전체 문장 표시 및 읽기 버튼 추가
  loadAllResponses();
});
document.getElementById("nextBtnSection3").addEventListener("click", () => {
  // 🔹 Azure TTS로 "딩동댕!" 재생
  speakTextWithAzure("딩동댕!");

  // 결과 모달 띄우기
  document.getElementById("modalOverlay").style.display = "block";
  document.getElementById("resultModal").style.display = "block";

  // 결과 모달 메시지 업데이트
  document.getElementById("resultText").innerHTML =
    "정말 잘했어! 고생했어 ! 😍";
  document.getElementById("confirmButton").textContent = "응!";
  document.getElementById("confirmButton").onclick = function () {
    window.location.href = "/turtleend";
  };
});

async function startRecording(sentenceIndex, expectedText) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    let audioChunks = [];

    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data);
    };

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
      const audioUrl = URL.createObjectURL(audioBlob);
      document.getElementById("audio-player").src = audioUrl;
      document.getElementById("audio-player").play();
    };

    mediaRecorder.start();
    setTimeout(() => mediaRecorder.stop(), 5000);
  } catch (error) {
    console.error("마이크 접근 오류:", error);
    alert("마이크 권한이 필요합니다. 브라우저 설정에서 허용해주세요.");
  }
}

if ("webkitSpeechRecognition" in window) {
  const recognition = new webkitSpeechRecognition();
  recognition.lang = "ko-KR";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  document.addEventListener("click", function (event) {
    if (event.target.classList.contains("mic")) {
      recognition.start();
    }
  });

  recognition.addEventListener("result", (event) => {
    const speechToText = event.results[0][0].transcript;
    document.querySelector("#userInput").value = speechToText;
    sendMessage();
  });

  recognition.addEventListener("error", (event) => {
    console.error("음성 인식 오류:", event.error);
  });
} else {
  document.querySelectorAll(".mic").forEach((mic) => {
    mic.style.display = "none";
  });
}
