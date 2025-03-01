const wordList = [
  "마법",
  "램프",
  "보물",
  "양탄자",
  "날다",
  "세가지",
  "세계",
  "타다",
  "반짝이는",
  "발견",
  "소원",
  "시장",
  "왕궁",
  "동굴",
];

let correctWord = wordList[Math.floor(Math.random() * wordList.length)]; // 랜덤 정답 설정
let gameOutcome = "";
let correctBox = Math.floor(Math.random() * 4) + 1; // 정답 위치 설정

// 한글을 유니코드로 분해하는 함수
function decomposeHangul(char) {
  const code = char.charCodeAt(0);
  if (code >= 0xac00 && code <= 0xd7a3) {
    const base = code - 0xac00;
    const lead = Math.floor(base / (21 * 28));
    const vowel = Math.floor((base % (21 * 28)) / 28);
    const tail = base % 28;
    return [lead, vowel, tail];
  }
  return [char, null, null];
}

// 한글을 조합하는 함수
function composeHangul(lead, vowel, tail) {
  return String.fromCharCode(0xac00 + lead * 21 * 28 + vowel * 28 + tail);
}

function randomizeWord(word) {
  let newWord = "";
  const allVowels = [
    "ㅏ",
    "ㅑ",
    "ㅓ",
    "ㅕ",
    "ㅣ",
    "ㅗ",
    "ㅛ",
    "ㅜ",
    "ㅠ",
    "ㅡ",
  ];

  let vowelPositions = []; // 모음이 있는 위치 저장

  // 자음, 모음을 분리하면서 모음 위치를 찾음
  for (let i = 0; i < word.length; i++) {
    const [lead, vowel, tail] = decomposeHangul(word[i]);
    if (vowel !== null) {
      vowelPositions.push(i); // 모음이 있는 위치 저장
    }
  }

  if (vowelPositions.length > 0) {
    // 무작위로 하나의 모음만 변경
    const randomIndex =
      vowelPositions[Math.floor(Math.random() * vowelPositions.length)];
    for (let i = 0; i < word.length; i++) {
      const [lead, vowel, tail] = decomposeHangul(word[i]);

      if (i === randomIndex && vowel !== null) {
        // 랜덤으로 선택된 모음만 변경
        const randomVowel =
          allVowels[Math.floor(Math.random() * allVowels.length)];
        const newVowelIndex = allVowels.indexOf(randomVowel);
        newWord += composeHangul(lead, newVowelIndex, tail);
      } else {
        newWord += word[i]; // 나머지는 그대로 유지
      }
    }
  } else {
    newWord = word; // 변경할 모음이 없으면 원래 단어 유지
  }

  return newWord;
}

function generateUniqueWords(correctWord, count) {
  const uniqueWords = new Set();
  uniqueWords.add(correctWord);

  while (uniqueWords.size < count) {
    let newWord = randomizeWord(correctWord);
    while (uniqueWords.has(newWord)) {
      newWord = randomizeWord(correctWord);
    }
    uniqueWords.add(newWord);
  }
  return Array.from(uniqueWords);
}
function addSpacing(word) {
  return word.split("").join(" "); // 각 문자(음절) 사이에 공백 삽입
}
function createAnswerButtons() {
  const buttonsContainer = document.getElementById("buttons-container");
  const answerContainer = document.getElementById("answer-buttons");

  buttonsContainer.innerHTML = "";
  answerContainer.innerHTML = "";

  // 정답 단어와 오답 단어들이 포함된 배열을 무작위로 섞습니다.
  const words = generateUniqueWords(correctWord, 4).sort(
    () => Math.random() - 0.5
  );

  // words 배열의 각 단어에 대해 버튼을 생성합니다.
  words.forEach((word, index) => {
    let btn1 = document.createElement("button");
    let btn2 = document.createElement("button");
    let span = document.createElement("span");

    btn1.textContent = addSpacing(word);
    span.textContent = ":D";

    btn1.classList.add("animated-button");
    btn2.classList.add("animated-button", "card", "flip");

    span.classList.add("card-text");

    btn2.appendChild(span);

    btn1.dataset.box = index + 1;
    btn2.dataset.box = index + 1;

    // 단어가 정답 단어와 일치하면 data-correct 속성을 true로 설정합니다.
    if (word === correctWord) {
      btn1.setAttribute("data-correct", "true");
      btn2.setAttribute("data-correct", "true");
    } else {
      btn1.setAttribute("data-correct", "false");
      btn2.setAttribute("data-correct", "false");
    }

    btn1.dataset.original = word;
    btn2.dataset.original = word;

    btn1.disabled = true;
    btn2.disabled = false;

    buttonsContainer.appendChild(btn1);
    answerContainer.appendChild(btn2);
  });

  attachButtonEvents();
}

function flipCards() {
  document
    .querySelectorAll("#answer-buttons .animated-button")
    .forEach((button) => {
      button.classList.add("card", "flip"); // ✅ 카드 전체 180도 회전

      let textElement = button.querySelector(".card-text");
      if (textElement) {
        textElement.style.transform = "rotate(90deg)"; // ✅ 텍스트만 90도 회전
      }

      button.removeAttribute("disabled");
    });

  attachButtonEvents();
}

// 5️⃣ 공통 이벤트 리스너 (클릭 + 터치)
function addEventListenerWithTouch(elementId, eventHandler) {
  const element = document.getElementById(elementId);
  if (element) {
    element.addEventListener("click", eventHandler);
    element.addEventListener("touchstart", (event) => {
      event.preventDefault(); // 기본 클릭 이벤트 방지
      eventHandler(event);
    });
  }
}
// 6️⃣ 게임 시작 & 음성 출력
addEventListenerWithTouch("startBtn", (event) => {
  event.preventDefault();
  showSection(2);
  createAnswerButtons();
  startGameFlow();
});

// 7️⃣ 설명 음성 버튼 적용
addEventListenerWithTouch("speakIntro", () =>
  speakTextWithAzure("찾아라!단어")
);
addEventListenerWithTouch("speakLook", () =>
  speakTextWithAzure("카드의 단어를 집중해서 봐줘")
);
addEventListenerWithTouch("speakWhat", () =>
  speakTextWithAzure("방금 들은 단어가 무엇일까?")
);

// 1️⃣ 게임 설명 모달 열기
function openInfoModal() {
  document.getElementById("helpModal").style.display = "block";
  document.getElementById("helpModalOverlay").style.display = "block";
}
document.querySelectorAll(".help").forEach((helpButton) => {
  helpButton.addEventListener("pointerdown", openInfoModal);
});

// 2️⃣ 게임 설명 모달 닫기
function closeInfoModal() {
  document.getElementById("helpModal").style.display = "none";
  document.getElementById("helpModalOverlay").style.display = "none";
}
addEventListenerWithTouch("helpCloseBtn", closeInfoModal);
addEventListenerWithTouch("helpModalOverlay", closeInfoModal);

// 3️⃣ 게임 설명 음성 버튼 (🎧) - Azure TTS 사용
function playInfoSpeech(event) {
  event.preventDefault();
  speakTextWithAzure(
    "30초 후에 단어를 숨길거야. 카드의 단어를 집중해서 봐줘. 들은 단어가 어디에 숨어있는지 찾아봐."
  );
}
addEventListenerWithTouch("helpSpeakBtn", playInfoSpeech);

// ✅ 클릭 & 터치 이벤트를 동시에 처리하는 공통 함수
function addEventListenerWithTouch(elementId, eventHandler) {
  const element = document.getElementById(elementId);
  if (element) {
    element.addEventListener("click", eventHandler);
    element.addEventListener("touchstart", (event) => {
      event.preventDefault();
      eventHandler(event);
    });
  }
}

// 9️⃣ 게임 진행 (카드 뒤집기)
function attachButtonEvents() {
  document
    .querySelectorAll("#answer-buttons .animated-button")
    .forEach((button) => {
      button.addEventListener("click", handleInteraction);
      button.addEventListener("touchstart", (event) => {
        event.preventDefault();
        handleInteraction(event);
      });
    });
}

function handleInteraction(event) {
  event.preventDefault();
  const button = event.currentTarget;
  const isCorrect = button.getAttribute("data-correct") === "true";

  button.classList.remove("flip");
  button.style.transform = "rotateY(0deg)";
  button.textContent = button.dataset.original;
  button.disabled = true;

  let confirmButton = document.getElementById("confirmButton");

  if (isCorrect) {
    button.style.backgroundColor = "green";
    button.style.border = "none";
    button.style.color = "white";
    submitGameResult(true);

    setTimeout(() => {
      document.getElementById("resultText").innerHTML =
        "우와! 정답이야! 다음 게임 하러갈까? 😆";
      document.getElementById("resultModal").style.display = "block";
      document.getElementById("modalOverlay").style.display = "block";
      speakTextWithAzure("딩동댕");

      confirmButton.textContent = "응!";
      confirmButton.onclick = function () {
        window.location.href = "/write";
      };
    }, 1000);
  } else {
    button.style.backgroundColor = "red";
    button.style.border = "none";
    button.style.color = "white";
    submitGameResult(false);

    setTimeout(() => {
      document.getElementById("resultText").innerHTML = `다시 도전 해볼까? 🧐`;
      document.getElementById("resultModal").style.display = "block";
      document.getElementById("modalOverlay").style.display = "block";
      speakTextWithAzure("삐익");

      confirmButton.textContent = "확인";
      confirmButton.onclick = function () {
        document.getElementById("resultModal").style.display = "none";
        document.getElementById("modalOverlay").style.display = "none";
      };
    }, 1000);
  }
}

// 🔟 UI 관련 함수들
function showSection(sectionNumber) {
  document.querySelectorAll(".game-section").forEach((section) => {
    section.style.display = "none";
  });
  document.getElementById(`section-${sectionNumber}`).style.display = "block";
}

function startGameFlow() {
  console.log("startGameFlow 실행됨!"); // ✅ 디버깅용 로그 추가
  let countdownElement = document.getElementById("countdownTimer");
  if (!countdownElement) {
    console.error("❌ countdownTimer 요소를 찾을 수 없음");
    return;
  }

  let count = 30;
  let countdownInterval = setInterval(() => {
    count--;
    countdownElement.textContent = count;

    if (count === 0) {
      clearInterval(countdownInterval);
      console.log("⏳ 30초 종료, playAudio() 실행!");

      showSection(3);

      setTimeout(() => {
        playAudio(); // 🔥 여기서 강제 실행되도록 수정
      }, 1000);
    }
  }, 1000);
}

function playAudio() {
  console.log("🎤 playAudio 실행!");

  if (!correctWord) {
    console.error("❌ correctWord가 정의되지 않음");
    return;
  }

  speakTextWithAzure(correctWord);

  setTimeout(() => {
    console.log("📦 카드 뒤집기 실행!");
    showSection(4);
    flipCards();
  }, 1000);
}

window.onload = function () {
  showSection(1);
};

// score 기능을 위해 추가한 부분
function submitGameResult(isCorrect) {
  const gameName = "작업기억"; // 🃏 카드 뒤집기 게임
  fetch("https://52.141.27.150/submit_evaluation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ game_name: gameName, success: isCorrect ? 1 : 0 }),
  })
    .then((response) => response.json())
    .then((data) => console.log(`✅ ${gameName} 결과 전송 완료:`, data))
    .catch((error) => console.error(`❌ ${gameName} 결과 전송 실패:`, error));
}
