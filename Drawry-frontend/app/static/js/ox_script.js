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
  .addEventListener("pointerdown", () => speakTextWithAzure("오 엑스 게임"));
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
    "듣기 버튼을 눌러서 단어를 들어봐! 들리는 단어와 화면에 보이는 단어를 비교해보자. 똑같으면 동그라미, 다르면 엑스를 카드에서 선택해줘"
  );
}

function speakTextFromElement() {
  const word = document
    .getElementById("wordText")
    .getAttribute("data-correct-word");
  speakTextWithAzure(word);
}

const words = [
  "마 법 ",
  "램 프 ",
  "보 물 ",
  "양 탄 자 ",
  "날 다 ",
  "세 가 지 ",
  "세 계 ",
  "타 다 ",
  "반 짝 이 는 ",
  "발 견 ",
  "소 원 ",
  "시 장 ",
  "왕 궁 ",
  "동 굴 ",
];

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

function composeHangul(lead, vowel, tail) {
  return String.fromCharCode(0xac00 + lead * 21 * 28 + vowel * 28 + tail);
}

function isValidHangul(char) {
  const code = char.charCodeAt(0);
  return code >= 0xac00 && code <= 0xd7a3; // 한글 유니코드 범위
}
function randomizeWord(word) {
  let newWord = "";
  const allVowels = [
    "ㅏ",
    "ㅑ",
    "ㅓ",
    "ㅕ",
    "ㅣ",
    "ㅔ",
    "ㅐ",
    "ㅗ",
    "ㅛ",
    "ㅜ",
    "ㅠ",
    "ㅡ",
  ];

  // 제외할 모음 리스트 (ㅒ, ㅖ 제거)
  const excludedVowels = ["ㅒ", "ㅖ", "ㅘ", "ㅙ", "ㅚ", "ㅝ", "ㅞ", "ㅟ", "ㅢ"];
  const filteredVowels = allVowels.filter((v) => !excludedVowels.includes(v));

  let vowelPositions = [];

  // 모음이 포함된 위치 찾기
  for (let i = 0; i < word.length; i++) {
    const [lead, vowel, tail] = decomposeHangul(word[i]);
    if (vowel !== null) {
      vowelPositions.push(i);
    }
  }

  // 변경할 위치 하나만 선택
  if (vowelPositions.length > 0) {
    const randomIndex =
      vowelPositions[Math.floor(Math.random() * vowelPositions.length)];

    for (let i = 0; i < word.length; i++) {
      const [lead, vowel, tail] = decomposeHangul(word[i]);

      if (i === randomIndex && vowel !== null) {
        let newVowelIndex;
        let newChar;
        let attempts = 0;

        do {
          // 기존 중성과 너무 다른 모음 피해서 랜덤 선택
          const similarVowels = filteredVowels.filter(
            (v) => Math.abs(filteredVowels.indexOf(v) - vowel) < 4
          );
          const randomVowel =
            similarVowels[Math.floor(Math.random() * similarVowels.length)];
          newVowelIndex = filteredVowels.indexOf(randomVowel);
          newChar = composeHangul(lead, newVowelIndex, tail);
          attempts++;
        } while (!isValidHangul(newChar) && attempts < 50);

        newWord += isValidHangul(newChar) ? newChar : word[i];
      } else {
        newWord += word[i]; // 나머지 글자는 그대로 유지
      }
    }
  } else {
    newWord = word; // 모음 없는 단어는 변경 없이 유지
  }

  return newWord;
}

let correctWord = ""; // 현재 정답 단어
let displayedWord = ""; // 화면에 표시된 단어

function setNewWord() {
  correctWord = words[Math.floor(Math.random() * words.length)];
  const randomizedWord = randomizeWord(correctWord);
  displayedWord = Math.random() > 0.5 ? correctWord : randomizedWord;

  document.getElementById("wordText").textContent = displayedWord;
  document
    .getElementById("wordText")
    .setAttribute("data-correct-word", correctWord);
  document.getElementById("isCorrect").value = (
    displayedWord === correctWord
  ).toString();
  console.log("화면에 표시된 단어:", displayedWord);
}

setNewWord(); // 최초 단어 설정

let gameCompleted = false;

function checkAnswer(choice) {
  if (gameCompleted) return;

  const isCorrect = document.getElementById("isCorrect").value === "true";
  const selectedButton = document.querySelector(`[data-choice="${choice}"]`);

  if ((choice === "O" && isCorrect) || (choice === "X" && !isCorrect)) {
    gameCompleted = true; // 게임 종료 상태

    // 🔹 Google TTS로 "딩동댕!" 재생
    speakTextWithAzure("딩동댕!");

    // 버튼 스타일 변경 (초록색)
    selectedButton.style.backgroundColor = "green";
    selectedButton.style.border = "none";
    selectedButton.style.color = "white";
    submitGameResult(true);

    // 결과 모달 메시지 업데이트
    document.getElementById("resultText").innerHTML =
      "우와 맞췄어 ! 다음 게임하러 갈까 ? 😆";
    document.getElementById("confirmButton").textContent = "응 !";
    document.getElementById("confirmButton").onclick = function () {
      window.location.href = "/grid"; // 다음 게임으로 이동
    };
  } else {
    // 🔹 Google TTS로 "삐익" 재생
    speakTextWithAzure("삐익");

    // 버튼 스타일 변경 (빨간색)
    selectedButton.style.backgroundColor = "red";
    selectedButton.style.border = "none";
    selectedButton.style.color = "white";
    submitGameResult(false);

    // 결과 모달 메시지 업데이트
    document.getElementById("resultText").innerHTML = "다시 도전 해볼까 ? 🧐 ";
  }

  // 1초 후 모달 띄우기
  setTimeout(() => {
    document.getElementById("modalOverlay").style.display = "block";
    document.getElementById("resultModal").style.display = "block";
  }, 1000);

  // 2초 후 버튼 색상 원래대로 변경
  setTimeout(() => {
    selectedButton.style.backgroundColor = "#ff8e03";
    selectedButton.style.color = "white";
  }, 2000);
}

function confirmModal() {
  if (gameCompleted) {
    window.location.href = "/grid";
  } else {
    document.getElementById("resultModal").style.display = "none";
    document.getElementById("modalOverlay").style.display = "none";

    document.querySelectorAll(".animated-button").forEach((button) => {
      button.style.backgroundColor = "#ff8e03";
      button.style.color = "white";
    });
  }
}

// score 기능을 위해 추가한 부분
function submitGameResult(isCorrect) {
  const gameName = "글자인식"; // ⭕❌ O/X 게임
  fetch("https://52.141.27.150/submit_evaluation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ game_name: gameName, success: isCorrect ? 1 : 0 }),
  })
    .then((response) => response.json())
    .then((data) => console.log(`✅ ${gameName} 결과 전송 완료:`, data))
    .catch((error) => console.error(`❌ ${gameName} 결과 전송 실패:`, error));
}
