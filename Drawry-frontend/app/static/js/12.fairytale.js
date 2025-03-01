// 이미지 로드를 위한 코드
document.addEventListener("DOMContentLoaded", function () {
  // config.js가 모듈로 로드되었는지 확인하고 CONFIG 객체 가져오기
  import("./config.js")
    .then((module) => {
      const CONFIG = module.default;
      loadSelectedImage(CONFIG);
    })
    .catch((error) => {
      console.error("Config 모듈을 불러오는 데 실패했습니다:", error);
    });

  // 이미지 로드 함수
  function loadSelectedImage(CONFIG) {
    const drawingBox = document.querySelector(".drawing-box");
    const selectedImage = localStorage.getItem("selectedImage");

    if (selectedImage) {
      console.log("저장된 이미지 URL:", selectedImage);

      // CONFIG.FLASK_SERVER를 활용하여 전체 URL 생성
      const imageUrl = selectedImage.startsWith("https")
        ? selectedImage
        : `${CONFIG.FLASK_SERVER}${
            selectedImage.startsWith("/")
              ? selectedImage
              : "/static/output/" + selectedImage
          }`;

      const img = new Image();
      img.onload = function () {
        console.log("이미지 로드 성공");
        drawingBox.innerHTML = `<img src="${imageUrl}" alt="동화 이미지" class="story-image">`;
      };

      img.onerror = function () {
        console.error("이미지 로드 실패:", imageUrl);
        const alternativeUrl = `${
          CONFIG.FLASK_SERVER
        }/static/output/${selectedImage.split("/").pop()}`;
        console.log("대체 URL 시도:", alternativeUrl);

        // 두 번째 시도를 위한 이미지 생성
        const alternativeImg = new Image();
        alternativeImg.onload = function () {
          console.log("대체 URL로 이미지 로드 성공");
          drawingBox.innerHTML = `<img src="${alternativeUrl}" alt="동화 이미지" class="story-image">`;
        };

        alternativeImg.onerror = function () {
          console.error("모든 이미지 로드 시도 실패");
          drawingBox.innerHTML = "이미지를 불러올 수 없습니다.";
        };

        alternativeImg.src = alternativeUrl;
      };

      img.src = imageUrl;
    } else {
      console.error("localStorage에서 이미지를 찾을 수 없습니다");
      drawingBox.innerHTML = "선택된 이미지가 없습니다.";
    }
  }
});

// LocalStorage에서 저장된 응답을 불러오기
let contents = [];
let i = 1;
while (true) {
  const response = localStorage.getItem(`storyResponse_${i}`);
  if (!response) break;
  contents.push(response);
  i++;
}
if (contents.length === 0) {
  contents = ["저장된 이야기가 없습니다."];
  console.error("localStorage에서 이야기를 불러올 수 없습니다.");
}

let selectedSentence = ""; // 선택된 문장 저장 변수
const storyContainer = document.getElementById("story-container");

let sentenceQueue = []; // ✅ 읽을 문장 리스트
let currentSentenceIndex = 0; // ✅ 현재 읽고 있는 문장 인덱스

function displayFullStory() {
  console.log("📝 원본 contents 배열:", contents); // 디버깅 - contents 배열 확인

  // ✅ 5번째 요소(인덱스 4) 삭제
  if (contents.length > 4) {
    console.log("🛑 삭제할 5번째 요소:", contents[4]); // 삭제할 요소 확인
    contents.splice(4, 1); // 5번째 요소 삭제
  }

  console.log("✅ 5번째 요소 삭제 후 contents 배열:", contents); // 삭제 후 결과 확인

  let filteredContents = contents
    .map((content) =>
      content
        .replace(/(\.\s*)\?[^\.\?]*/g, ".")
        .replace(/\s*[^.?!]*\?+/g, "")
        .replace(/\.ᐟ/g, "")
        .replace(/\b안녕!\b/g, "")
        .replace(/\b이제 당신 차례입니다!\b/g, "")
        .trim()
    )
    .filter((content) => content.length > 0);

  console.log("📌 필터링 후 문장 배열:", filteredContents); // 최종 문장 리스트 확인

  // ✅ 읽을 문장 리스트 저장
  sentenceQueue = filteredContents;
  currentSentenceIndex = 0; // 처음부터 시작

  let formattedText = filteredContents
    .map((content) => `<div class="content-block">${content}</div>`)
    .join("");

  storyContainer.innerHTML = formattedText;
}

// ✅ 오디오 버튼 클릭 시 TTS 실행
document.addEventListener("DOMContentLoaded", function () {
  const audioBtn = document.getElementById("audio-btn");
  if (audioBtn) {
    audioBtn.addEventListener("click", function () {
      console.log("🎧 오디오 버튼 클릭됨! TTS 실행 시작...");
      startReading(); // ✅ 첫 번째 문장부터 읽기 시작
    });
  }
});

// ✅ `startReading(index)` 특정 문장부터 읽기
function startReading(index = 0) {
  if (sentenceQueue.length === 0) {
    alert("읽을 문장이 없습니다!");
    return;
  }

  currentSentenceIndex = index; // 클릭된 문장부터 읽기
  readNextSentence(); // ✅ 첫 문장 읽기 시작
}

// ✅ 한 문장을 읽고, 끝나면 다음 문장으로 이동하는 함수
async function readNextSentence() {
  if (currentSentenceIndex >= sentenceQueue.length) {
    console.log("📢 모든 문장을 읽었습니다.");
    return; // 모든 문장을 읽으면 종료
  }

  let sentence = sentenceQueue[currentSentenceIndex];
  console.log("🎤 읽는 중:", sentence);

  // ✅ TTS 실행
  await speakTextWithAzure(sentence, () => {
    currentSentenceIndex++; // 다음 문장으로 이동
    readNextSentence(); // 다음 문장 읽기
  });
}
async function speakTextWithAzure(text, callback) {
  if (!text) return;

  console.log("🎤 음성 출력 요청:", text);

  const response = await fetch("/speak", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    console.error(`❌ TTS 요청 실패! 상태 코드: ${response.status}`);
    return;
  }

  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const audioBuffer = await response.arrayBuffer();
  const decodedAudio = await audioContext.decodeAudioData(audioBuffer);

  const source = audioContext.createBufferSource();
  source.buffer = decodedAudio;
  source.connect(audioContext.destination);
  source.start(0);

  console.log("🔊 오디오 재생 시작!");

  // ✅ 오디오가 끝난 후 콜백 실행 (다음 문장 읽기)
  source.onended = () => {
    console.log("🔄 오디오 종료, 다음 문장 실행");

    if (typeof callback === "function") {
      callback(); // 🔥 다음 문장 실행!
    }
  };
}

// ✅ 초기 전체 콘텐츠 표시
displayFullStory();
