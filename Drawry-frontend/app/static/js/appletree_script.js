const CHOSUNG = [
  "ㄱ",
  "ㄲ",
  "ㄴ",
  "ㄷ",
  "ㄸ",
  "ㄹ",
  "ㅁ",
  "ㅂ",
  "ㅃ",
  "ㅅ",
  "ㅆ",
  "ㅇ",
  "ㅈ",
  "ㅉ",
  "ㅊ",
  "ㅋ",
  "ㅌ",
  "ㅍ",
  "ㅎ",
];
const JUNGSEONG = [
  "ㅏ",
  "ㅐ",
  "ㅑ",
  "ㅒ",
  "ㅓ",
  "ㅔ",
  "ㅕ",
  "ㅖ",
  "ㅗ",
  "ㅘ",
  "ㅙ",
  "ㅚ",
  "ㅛ",
  "ㅜ",
  "ㅝ",
  "ㅞ",
  "ㅟ",
  "ㅠ",
  "ㅡ",
  "ㅢ",
  "ㅣ",
];
const JONGSEONG = [
  "",
  "ㄱ",
  "ㄲ",
  "ㄳ",
  "ㄴ",
  "ㄵ",
  "ㄶ",
  "ㄷ",
  "ㄹ",
  "ㄺ",
  "ㄻ",
  "ㄼ",
  "ㄽ",
  "ㄾ",
  "ㄿ",
  "ㅀ",
  "ㅁ",
  "ㅂ",
  "ㅄ",
  "ㅅ",
  "ㅆ",
  "ㅇ",
  "ㅈ",
  "ㅊ",
  "ㅋ",
  "ㅌ",
  "ㅍ",
  "ㅎ",
];
const applePositions = [
  { x: 80, y: 100 },
  { x: 150, y: 20 },
  { x: 140, y: 250 },
  { x: 190, y: 160 },
  { x: 240, y: 350 },
  { x: 280, y: 250 },
  { x: 300, y: 50 },
  { x: 350, y: 370 },
  { x: 400, y: 120 },
  { x: 500, y: 50 },
  { x: 650, y: 20 },
  { x: 650, y: 330 },
  { x: 750, y: 270 },
  { x: 740, y: 130 },
  { x: 820, y: 30 },
  { x: 870, y: 220 },
];
const jamoPronunciations = {
  ㄱ: "그",
  ㄴ: "느",
  ㄷ: "드",
  ㄹ: "르",
  ㅁ: "므",
  ㅂ: "브",
  ㅅ: "스",
  ㅇ: "으",
  ㅈ: "즈",
  ㅊ: "츠",
  ㅋ: "크",
  ㅌ: "트",
  ㅍ: "프",
  ㅎ: "흐",
  ㄲ: "끄",
  ㄸ: "뜨",
  ㅃ: "쁘",
  ㅆ: "쓰",
  ㅉ: "쯔",
};
let section1 = document.getElementById("section-1");
let startBtn = document.getElementById("startBtn");

let selectedJamos = [];
let correctWord = "알라딘"; // 랜덤 단어 선택
let correctJamos = correctWord
  .split("")
  .flatMap((char) => decomposeHangul(char));
let jamos = [...correctJamos, ...randomJamos(6)].sort(
  () => Math.random() - 0.5
);

function decomposeHangul(syllable) {
  let code = syllable.charCodeAt(0) - 0xac00;
  if (code < 0 || code > 11171) return [syllable];
  return [
    CHOSUNG[Math.floor(code / (21 * 28))],
    JUNGSEONG[Math.floor((code % (21 * 28)) / 28)],
    JONGSEONG[code % 28],
  ].filter(Boolean);
}

function randomJamos(n) {
  return Array.from(
    { length: n },
    () =>
      CHOSUNG.concat(
        JUNGSEONG,
        JONGSEONG.filter((j) => j)
      ).sort(() => Math.random() - 0.5)[0]
  );
}

function getRandomJamo() {
  const jamoSet = CHOSUNG.concat(
    JUNGSEONG,
    JONGSEONG.filter((j) => j)
  ); // 자음+모음+받침 포함
  return jamoSet[Math.floor(Math.random() * jamoSet.length)];
}
function createApples() {
  const tree = document.getElementById("tree");

  // ✅ 기존 사과 삭제 (사과가 중복 생성되지 않도록)
  while (tree.firstChild) {
    tree.removeChild(tree.firstChild);
  }

  // 1️⃣ 정답 단어의 자모 분해
  let correctJamos = correctWord
    .split("")
    .flatMap((char) => decomposeHangul(char));

  // 2️⃣ 사과 개수와 비교하여 부족한 부분은 랜덤 자모로 채우기
  let totalApples = applePositions.length;
  let jamos = [...correctJamos]; // 정답 단어의 자모 우선 배치
  while (jamos.length < totalApples) {
    jamos.push(getRandomJamo()); // 부족한 자모는 랜덤으로 추가
  }

  // 3️⃣ 자모 섞기 (랜덤 배치)
  jamos = jamos.sort(() => Math.random() - 0.5);

  // 4️⃣ 사과 배치
  applePositions.forEach(({ x, y }, index) => {
    const apple = document.createElement("div");
    apple.classList.add("apple");
    apple.textContent = jamos[index]; // 🎯 정답 단어의 자모를 반드시 포함!
    apple.dataset.jamo = jamos[index]; // ✅ 데이터 속성 추가 (되돌리기 기능을 위해)

    apple.style.position = "absolute";
    apple.style.left = `${x}px`;
    apple.style.top = `${y}px`;
    apple.onpointerdown = () => selectJamo(apple.textContent, apple);
    tree.appendChild(apple);
  });
}

function selectJamo(jamo, element) {
  selectedJamos.push(jamo);
  element.classList.add("used");
  element.style.pointerEvents = "none"; // 클릭 불가능하게 설정

  // 🎯 선택한 사과를 완전히 숨김 (잔상 방지)
  setTimeout(() => {
    element.style.opacity = "0"; // 부드럽게 사라짐 (잔상 방지)
    element.style.transform = "scale(0.5)"; // 작아지는 효과 (선택 효과)
    setTimeout(() => {
      element.style.display = "none"; // 최종적으로 제거
    }, 500);
  }, 100);

  document.getElementById("jam").innerText = combineJamos(selectedJamos);
  speakJamo(jamo);
}

function combineJamos(jamos) {
  let result = "",
    i = 0;
  while (i < jamos.length) {
    if (!CHOSUNG.includes(jamos[i])) {
      result += jamos[i++];
      continue;
    }
    let initial = jamos[i++];
    if (i >= jamos.length || !JUNGSEONG.includes(jamos[i])) {
      result += initial;
      continue;
    }
    let medial = jamos[i++],
      final = "";
    if (i < jamos.length && JONGSEONG.includes(jamos[i])) {
      if (i + 1 < jamos.length && JUNGSEONG.includes(jamos[i + 1])) final = "";
      else final = jamos[i++];
    }
    result += assembleSyllable(initial, medial, final);
  }
  return result;
}

function assembleSyllable(initial, medial, final) {
  let iIndex = CHOSUNG.indexOf(initial),
    mIndex = JUNGSEONG.indexOf(medial),
    fIndex = JONGSEONG.indexOf(final);
  return iIndex === -1 || mIndex === -1 || fIndex === -1
    ? initial + medial + final
    : String.fromCharCode(0xac00 + iIndex * 21 * 28 + mIndex * 28 + fIndex);
}

function undoSelection() {
  if (selectedJamos.length === 0) return; // 되돌릴 게 없으면 종료

  let lastJamo = selectedJamos.pop(); // 마지막 선택한 자모 삭제
  document.getElementById("jam").innerText = combineJamos(selectedJamos); // 병 안의 텍스트 업데이트

  let apples = document.querySelectorAll(".apple");
  apples.forEach((apple) => {
    if (apple.dataset.jamo === lastJamo && apple.classList.contains("used")) {
      apple.classList.remove("used"); // 'used' 클래스 제거
      apple.style.opacity = "1"; // ✅ 다시 보이게 설정
      apple.style.transform = "scale(1)"; // ✅ 원래 크기로 복구
      apple.style.pointerEvents = "auto"; // ✅ 다시 선택 가능하게 설정
      return;
    }
  });
}

let isStarted = false;

function startGame(event) {
  event.preventDefault();
  if (isStarted) return;
  isStarted = true;
  document.getElementById("section-1").style.display = "none";
  document.getElementById("section-2").style.display = "block";
  createApples();
  createHintButton();
}

function speakCorrectWord() {
  speakTextWithAzure(correctWord);
}

function speakJamo(jamo) {
  const pronunciation = jamoPronunciations[jamo] || jamo;
  speakTextWithAzure(pronunciation);
}

document
  .getElementById("speakIntro")
  .addEventListener("pointerdown", () => speakTextWithAzure("사과찾기 게임"));

document.getElementById("startBtn").addEventListener("pointerdown", startGame);
document
  .getElementById("undoBtn")
  .addEventListener("pointerdown", undoSelection);

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
  .getElementById("correctWordSpeakBtn")
  .addEventListener("pointerdown", speakCorrectWord);

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

// 🟢 게임 설명 음성 출력
function speakGameInstructions(event) {
  event.preventDefault();
  speakTextWithAzure(
    "듣기 버튼을 눌러서 단어를 들어봐 ! 사과를 눌러서 단어를 완성해줘. 사과를 잘못 눌렀으면 되돌아가기 버튼을 누르면 돼! 다 완성하면 사과잼 통을 눌러줘 ! 힌트: 어려우면 황금 사과를 눌러봐"
  );
}

const hintPosition = { x: 610, y: 150 };

function createHintButton() {
  const hintBtn = document.getElementById("hintBtn");

  hintBtn.style.position = "absolute";
  hintBtn.style.left = `${hintPosition.x}px`; // X 좌표 적용
  hintBtn.style.top = `${hintPosition.y}px`; // Y 좌표 적용
}

document
  .getElementById("hintBtn")
  .addEventListener("pointerdown", showHintModal);

function showHintModal() {
  const modal = document.getElementById("hintModal");
  const overlay = document.getElementById("hintModalOverlay");

  // 모달 표시
  modal.style.display = "block";
  overlay.style.display = "block";

  // 5초 후 모달 자동 닫기
  setTimeout(() => {
    modal.style.display = "none";
    overlay.style.display = "none";
  }, 5000);
}

// 🟢 정답/오답 음성 피드백
function checkAnswer() {
  const resultTextElement = document.getElementById("resultText");
  const checkButton = document.querySelector(".check-btn");

  if (selectedJamos.join("") === correctJamos.join("")) {
    // 정답일 경우
    speakTextWithAzure("딩동댕");
    submitGameResult(true);
    resultTextElement.innerHTML = `정답이야! 대단한걸 😆`;

    checkButton.innerText = "다음 게임으로 !"; // ✅ 정답일 때 버튼 텍스트 변경
    checkButton.onclick = () => {
      window.location.href = "/pull";
    };
  } else {
    // 오답일 경우
    speakTextWithAzure("삐빅");
    submitGameResult(false);
    resultTextElement.innerHTML = `으악 아깝다 🥲 다시 한 번 해볼까 ?`;

    checkButton.innerText = "응 !"; // ✅ 오답일 때 버튼 텍스트 변경
    checkButton.onclick = () => {
      retrySameWord(); // 기존 단어 그대로 유지
    };
  }

  // 모달 띄우기
  document.getElementById("modalOverlay").style.display = "block";
  document.getElementById("resultModal").style.display = "block";
}

// 🛠 틀렸을 때 상태 초기화 (선택한 글자 삭제 + 사과 다시 보이기)
function retrySameWord() {
  document.getElementById("resultModal").style.display = "none";
  document.getElementById("modalOverlay").style.display = "none";

  selectedJamos = []; // 선택한 자모 초기화
  document.getElementById("jam").innerText = ""; // 병 안 텍스트 초기화

  // 🍎 선택한 사과를 다시 활성화
  document.querySelectorAll(".apple").forEach((apple) => {
    if (apple.classList.contains("used")) {
      apple.classList.remove("used");
      apple.style.opacity = "1"; // 다시 보이게 설정
      apple.style.transform = "scale(1)"; // 원래 크기로 복구
      apple.style.pointerEvents = "auto"; // 다시 선택 가능하게 설정
    }
  });
}

function resetWithNewWord() {
  document.getElementById("resultModal").style.display = "none";
  document.getElementById("modalOverlay").style.display = "none";

  if (isFirstGame) {
    isFirstGame = false;
  } else {
    correctWord = words[Math.floor(Math.random() * words.length)];
  }

  correctJamos = correctWord
    .split("")
    .flatMap((char) => decomposeHangul(correctWord));
  selectedJamos = [];
  document.getElementById("jam").innerText = "";
  createApples(); // 🍎 새로운 단어로 게임 시작
}

// 🛠 틀렸을 때 상태 초기화 (선택한 글자 삭제 + 사과 다시 보이기)
function resetGameState() {
  selectedJamos = []; // 선택한 자모 초기화
  document.getElementById("jam").innerText = ""; // 병 안 텍스트 초기화

  // 🍎 모든 사과 다시 보이게 설정
  document.querySelectorAll(".apple").forEach((apple) => {
    apple.classList.remove("used");
    apple.style.display = "block";
  });
}

// score 기능을 위해 추가한 부분
function submitGameResult(isCorrect) {
  const gameName = "작업기억"; // 🍏 사과찾기 게임
  fetch("https://52.141.27.150/submit_evaluation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ game_name: gameName, success: isCorrect ? 1 : 0 }),
  })
    .then((response) => response.json())
    .then((data) => console.log(`✅ ${gameName} 결과 전송 완료:`, data))
    .catch((error) => console.error(`❌ ${gameName} 결과 전송 실패:`, error));
}
