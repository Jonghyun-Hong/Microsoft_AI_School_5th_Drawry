const consonants = [
  "ㄱ",
  "ㄴ",
  "ㄷ",
  "ㄹ",
  "ㅁ",
  "ㅂ",
  "ㅅ",
  "ㅇ",
  "ㅈ",
  "ㅊ",
  "ㅋ",
  "ㅌ",
  "ㅍ",
  "ㅎ",
];
const vowels = ["ㅏ", "ㅑ", "ㅓ", "ㅕ", "ㅗ", "ㅛ", "ㅜ", "ㅠ", "ㅡ", "ㅣ"];
const correctSequence = ["ㅇ", "ㅏ", "ㄹ", "ㄹ", "ㅏ", "ㄷ", "ㅣ", "ㄴ"];
const word = "알라딘";
const dropzone = document.getElementById("hangul-display");
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
  ㅏ: "아",
  ㅑ: "야",
  ㅓ: "어",
  ㅕ: "여",
  ㅗ: "오",
  ㅛ: "요",
  ㅜ: "우",
  ㅠ: "유",
  ㅡ: "으",
  ㅣ: "이",
};

let dropIndex = 0;
let isStarted = false;
let canRotate = false;
let startBtn = document.getElementById("startBtn");

document.getElementById("startBtn").addEventListener("pointerdown", startGame);

function startGame(event) {
  event.preventDefault();
  if (isStarted) return;
  isStarted = true;
  document.getElementById("section-1").style.display = "none";
  document.getElementById("section-2").style.display = "block";
}

function speakJamo(jamo) {
  const pronunciation = jamoPronunciations[jamo] || jamo;
  speakTextWithAzure(pronunciation);
}
document
  .getElementById("speakIntro")
  .addEventListener("pointerdown", () => speakTextWithAzure("귀쫑긋 게임"));

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

// 🟢 게임 설명 음성 출력
function speakGameInstructions(event) {
  event.preventDefault();
  speakTextWithAzure(
    "듣기 버튼을 눌러서 소리를 들어줘 ! 들은 단어를 만들어야해 ! 주황색 낱말카드를 노란색 네모 상자에 가져와줘 ! 상자에 단어가 모두 모였으면 방향을 맞춰보자 ! 주황색 카드가 초록색 카드로 바뀌면 완성이야 ! 빨간색 카드가 나오면 빨간색 카드를 한번 더 눌러서 없애줘 !"
  );
}

document.getElementById("speakWord").addEventListener("pointerdown", () => {
  speakTextWithAzure(word);
});

let isDragging = false;
let touchPrevented = false;

function createDraggableElements(containerId, elements) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";
  elements.forEach((letter) => {
    const span = document.createElement("span");
    span.classList.add("draggable");
    span.setAttribute("draggable", "true");
    span.dataset.value = letter;
    span.innerText = letter;

    // ✅ 드래그 시작할 때 음성이 실행되지 않도록 함
    span.addEventListener("dragstart", (e) => {
      isDragging = true; // 드래그 상태 활성화
      drag(e);
    });

    // ✅ 드래그 끝나면 다시 클릭 가능하도록 설정
    span.addEventListener("dragend", () => {
      setTimeout(() => (isDragging = false), 100); // 드래그 종료 후 잠깐 대기 후 false로 변경
    });

    // ✅ 클릭 시 음성이 실행되지 않도록 `isDragging` 체크
    span.addEventListener("touchstart", (event) => {
      if (!isDragging) {
        speakJamo(letter);
        touchPrevented = true; // 클릭 방지 플래그 활성화
      }
    });

    // ✅ 클릭 이벤트 (모바일에서는 `touchstart` 실행 후 발생할 수 있음)
    span.addEventListener("click", (event) => {
      if (!isDragging && !touchPrevented) {
        speakJamo(letter);
      }
      touchPrevented = false; // 다음 클릭을 허용
    });
    container.appendChild(span);
  });
}

createDraggableElements("draggable-first", consonants);
createDraggableElements("draggable-third", vowels);

function drag(e) {
  e.dataTransfer.setData("text", e.target.dataset.value);
}
function allowDrop(e) {
  e.preventDefault();
}

document.getElementById("hangul-display").addEventListener(
  "dragover",
  (e) => {
    e.preventDefault(); // ✅ iOS에서 드래그가 허용되지 않는 문제 해결
  },
  false
);

function drop(e) {
  e.preventDefault();

  if (dropzone.children.length >= correctSequence.length) {
    console.log("이미 모든 단어가 배치됨!");
    return;
  }

  const droppedText = e.dataTransfer.getData("text");
  if (
    !e.dataTransfer.getData("played") ||
    e.dataTransfer.getData("played") === "false"
  ) {
    speakJamo(droppedText);
    e.dataTransfer.setData("played", "true"); // 중복 실행 방지
  }

  const span = document.createElement("span");
  span.classList.add("rotatable");
  span.innerText = droppedText;

  let randomRotation = (Math.floor(Math.random() * 3) + 1) * 90;
  span.style.transform = `rotate(${randomRotation}deg)`;

  // ✅ 올바르면 green, 틀리면 red
  if (droppedText === correctSequence[dropIndex]) {
    span.style.backgroundColor = "green";
    span.style.borderColor = "green";
    span.dataset.correct = "true";
    dropIndex++;
  } else {
    span.style.backgroundColor = "red";
    span.style.borderColor = "red";
    // ❌ 잘못 올린 글자를 다시 누르면 삭제되도록 설정
    span.addEventListener("pointerdown", () => {
      dropzone.removeChild(span);
    });
  }

  // ✅ 배치 위치 설정
  const positionMap = [
    { column: 1, row: 1 },
    { column: 2, row: 1 },
    { column: 2, row: 2 },
    { column: 3, row: 1 },
    { column: 4, row: 1 },
    { column: 5, row: 1 },
    { column: 6, row: 1 },
    { column: 6, row: 2 },
  ];

  const currentPositionIndex = dropzone.children.length;
  if (currentPositionIndex < positionMap.length) {
    const position = positionMap[currentPositionIndex];
    span.style.gridColumn = position.column;
    span.style.gridRow = position.row;
  } else {
    console.warn("배치 위치를 초과했습니다.");
  }
  dropzone.appendChild(span);

  if (dropIndex === correctSequence.length) {
    if (!hintModalShown) {
      setTimeout(() => {
        speakTextWithAzure("딩동댕");
        showModal("이제 단어 카드를 눌러서 방향을 맞춰볼까 ?");
        hintModalShown = true;
      }, 500);
    }
  }
}
``;

document.getElementById("modalCloseBtn").addEventListener("pointerdown", () => {
  canRotate = true; // ✅ 이제 회전 가능

  const allSpans = dropzone.querySelectorAll(".rotatable");
  allSpans.forEach((span) => {
    span.style.backgroundColor = "orange";
    span.style.borderColor = "orange";
    span.removeEventListener("pointerdown", rotateAndCheck);
    span.addEventListener("pointerdown", rotateAndCheck);
  });

  document.getElementById("customModal").style.display = "none";
  document.getElementById("modalOverlay").style.display = "none";
});

// ✅ 회전 시 맞으면 green, 틀리면 orange로 돌아가도록 수정
function rotateAndCheck(event) {
  if (!canRotate) return;

  const span = event.target;
  let transformValue = span.style.transform;
  let rotationMatch = transformValue.match(/rotate\((\d+)deg\)/);
  let currentRotation = rotationMatch ? parseInt(rotationMatch[1]) : 0;

  let newRotation = (currentRotation + 90) % 360;
  span.style.transform = `rotate(${newRotation}deg)`;
  // ✅ 0도로 회전해야 초록색, 아니면 주황색으로 변경
  if (newRotation === 0) {
    span.style.backgroundColor = "green";
    span.style.borderColor = "green";
  } else {
    span.style.backgroundColor = "orange";
    span.style.borderColor = "orange";
  }

  checkRotationAndFinish();
}

let hintModalShown = false; // ✅ "이제 단어 카드를 눌러서 방향을 맞춰볼까?" 모달이 여러 번 뜨는 문제 해결

function checkRotationAndFinish() {
  const allSpans = dropzone.querySelectorAll(".rotatable");

  if (allSpans.length !== correctSequence.length) {
    return;
  }

  let allCorrect = true;
  allSpans.forEach((span) => {
    let transformValue = span.style.transform;
    let rotationMatch = transformValue.match(/rotate\((\d+)deg\)/);
    let rotation = rotationMatch ? parseInt(rotationMatch[1]) : 0;

    if (rotation !== 0) {
      allCorrect = false;
    }
  });

  if (allCorrect) {
    speakTextWithAzure("딩동댕");
    submitGameResult(true);
    setTimeout(() => {
      showModal("참 잘했어! 최고야 😍", true);
    }, 500);
  } else {
    submitGameResult(false);
  }
}
function showModal(message, showNextButton = false) {
  const modal = document.getElementById("customModal");
  const overlay = document.getElementById("modalOverlay");
  const messageElement = document.getElementById("modalMessage");
  const nextButton = document.getElementById("nextGameBtn"); // 다음 게임 버튼
  const modalCloseButton = document.getElementById("modalCloseBtn"); // 확인 버튼 추가

  if (!modal || !overlay || !messageElement) {
    console.error("모달 요소를 찾을 수 없습니다.");
    return;
  }

  messageElement.innerText = message;
  modal.style.display = "block";
  overlay.style.display = "block";

  // ✅ "이제 단어 카드를 눌러서 방향을 맞춰볼까?" 모달이 떴을 때만 확인 버튼 표시
  if (message.includes("이제 단어 카드를 눌러서 방향을 맞춰볼까?")) {
    modalCloseButton.style.display = "block"; // 확인 버튼 표시
    nextButton.style.display = "none"; // 다음 게임 버튼 숨김
  }
  // ✅ "참 잘했어!" 모달일 때 다음 게임 버튼 표시
  else if (showNextButton) {
    nextButton.style.display = "block";
    modalCloseButton.style.display = "none"; // 확인 버튼 숨김

    // 스타일 유지
    nextButton.style.margin = "auto";
    nextButton.style.display = "flex";
    nextButton.style.justifyContent = "center";
    nextButton.style.alignItems = "center";
    nextButton.innerText = "다음 게임으로.ᐟ";

    // 다음 게임으로 이동
    nextButton.addEventListener("pointerdown", () => {
      window.location.href = "/ox"; // OX 게임 페이지로 이동
    });
  }
}
function enableRotation() {
  canRotate = true; // ✅ 이제 회전 가능!

  const allSpans = dropzone.querySelectorAll(".rotatable");
  allSpans.forEach((span) => {
    span.style.backgroundColor = "orange";
    span.style.borderColor = "orange";

    // ✅ 기존 이벤트 삭제 후 다시 추가 (이중 실행 방지)
    span.removeEventListener("pointerdown", rotateAndCheck);
    span.addEventListener("pointerdown", rotateAndCheck);
  });

  // ✅ 모달 닫기
  document.getElementById("customModal").style.display = "none";
  document.getElementById("modalOverlay").style.display = "none";
}

document.getElementById("hintBtn").addEventListener("pointerdown", () => {
  const hintModal = document.getElementById("hintModal");

  if (!hintModal) {
    console.error("❌ hintModal 요소를 찾을 수 없습니다.");
    return;
  }

  // 모달 표시
  hintModal.style.display = "flex";
  setTimeout(() => {
    hintModal.classList.add("show");
  }, 10);

  // 3초 후 자동으로 사라지도록 설정
  setTimeout(() => {
    hintModal.classList.remove("show");

    // `opacity`가 0이 된 후에 `display: none;`을 적용해야 함
    setTimeout(() => {
      hintModal.style.display = "none";
    }, 500); // 애니메이션 지속시간을 고려하여 적용
  }, 3000); // 3초 후 사라지도록 설정
});

// score 기능을 위해 추가한 부분
function submitGameResult(isCorrect) {
  const gameName = "글자인식"; // 🎯 귀쫑긋 게임
  fetch("https://52.141.27.150/submit_evaluation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ game_name: gameName, success: isCorrect ? 1 : 0 }),
  })
    .then((response) => response.json())
    .then((data) => console.log(`✅ ${gameName} 결과 전송 완료:`, data))
    .catch((error) => console.error(`❌ ${gameName} 결과 전송 실패:`, error));
}
