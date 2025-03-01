const GAME_CONSTANTS = {
  GRID_SIZE: 5,
  TARGET_WORDS: [
    "마법",
    "램프",
    "보물",
    "양탄자",
    "세가지",
    "세계",
    "타다",
    "소원",
    "시장",
    "동굴",
  ],
  CONFUSING_WORDS: {
    알라딘: [
      "얼",
      "랄",
      "덜",
      "일",
      "를",
      "든",
      "얄",
      "릴",
      "달",
      "린",
      "열",
      "릴",
      "올",
      "울",
      "엘",
      "리",
      "루",
      "딜",
      "둔",
      "로",
      "딩",
      "듄",
    ],
    마법: [
      "먀",
      "머",
      "며",
      "므",
      "미",
      "모",
      "묘",
      "무",
      "뮤",
      "므",
      "미",
      "범",
      "붑",
      "밥",
      "뱁",
      "븝",
      "빕",
      "봅",
      "멈",
      "펍",
      "핍",
      "풉",
      "펌",
    ],
    램프: [
      "람",
      "럼",
      "롬",
      "림",
      "름",
      "맴",
      "푸",
      "포",
      "퓨",
      "표",
      "페",
      "펴",
      "피",
      "브",
      "비",
      "랩",
      "럽",
      "랍",
      "파",
      "퍼",
      "패",
      "렘",
      "므",
    ],
    보물: [
      "비",
      "버",
      "바",
      "부",
      "브",
      "뵤",
      "벼",
      "무",
      "모",
      "머",
      "마",
      "며",
      "먀",
      "미",
      "뮤",
      "모",
      "멀",
      "믈",
      "매",
      "묘",
      "므",
      "메",
      "몰",
    ],
    양탄자: [
      "잉",
      "영",
      "용",
      "융",
      "얭",
      "텬",
      "틴",
      "톤",
      "툰",
      "턴",
      "응",
      "톈",
      "지",
      "조",
      "주",
      "저",
      "자",
      "쟤",
      "졔",
      "즈",
      "져",
      "쟈",
    ],
    세가지: [
      "셰",
      "셔",
      "샤",
      "시",
      "소",
      "섀",
      "새",
      "기",
      "거",
      "고",
      "자",
      "조",
      "주",
      "졔",
      "쟤",
      "저",
      "즈",
      "주",
      "쥬",
      "지",
      "제",
      "쟈",
    ],
    세계: [
      "셰",
      "섀",
      "새",
      "샤",
      "셔",
      "쇼",
      "소",
      "수",
      "사",
      "걔",
      "개",
      "겨",
      "갸",
      "구",
      "기",
      "가",
      "기",
      "고",
      "규",
      "교",
      "계",
      "계",
      "걔",
    ],
    타다: [
      "티",
      "터",
      "토",
      "트",
      "투",
      "트",
      "탸",
      "턔",
      "테",
      "디",
      "도",
      "두",
      "더",
      "더",
      "데",
      "뎌",
      "됴",
      "뎨",
      "듀",
      "드",
      "대",
      "뎌",
      "댜",
    ],
    소원: [
      "쇼",
      "슈",
      "사",
      "시",
      "사",
      "서",
      "새",
      "셰",
      "셔",
      "스",
      "섀",
      "세",
      "안",
      "운",
      "안",
      "언",
      "인",
      "은",
      "운",
      "언",
      "얀",
      "얜",
      "옌",
    ],
    시장: [
      "사",
      "서",
      "소",
      "수",
      "슈",
      "스",
      "샤",
      "셔",
      "쇼",
      "새",
      "세",
      "셰",
      "섀",
      "징",
      "정",
      "종",
      "중",
      "즁",
      "증",
      "죵",
      "쟝",
      "쟁",
      "젱",
    ],
    동굴: [
      "돝",
      "둥",
      "등",
      "듕",
      "당",
      "딩",
      "덩",
      "뎡",
      "댱",
      "댕",
      "뎅",
      "돔",
      "돈",
      "귤",
      "글",
      "길",
      "갈",
      "걸",
      "골",
      "굘",
      "결",
      "걀",
      "갤",
    ],
  },
};

class WordGame {
  constructor() {
    this.gridSize = GAME_CONSTANTS.GRID_SIZE;
    this.correctWord = this.getRandomTargetWord();
    this.correctGuesses = new Set();
    this.generatedWords = this.getConfusingWords(this.correctWord);

    this.elements = {
      startScreen: document.getElementById("startScreen"),
      gameScreen: document.getElementById("gameScreen"),
      startGameButton: document.getElementById("startGameButton"),
      speakIntroButton: document.getElementById("speakIntro"),
      listenButton: document.getElementById("listenButton"),
      helpButton: document.getElementById("helpButton"),
      helpModal: document.getElementById("helpModal"),
      helpModalOverlay: document.getElementById("helpModalOverlay"),
      closeModalButton: document.getElementById("closeModalButton"),
      helpSpeakButton: document.getElementById("helpSpeakBtn"),
      grid: document.getElementById("grid"),
      resetModal: document.getElementById("resetModal"),
      modalOverlay: document.getElementById("modalOverlay"),
      congratsMessage: document.getElementById("modalMessage"),
      checkButton: document.getElementById("checkButton"),
    };

    this.initializeEventListeners();
  }

  initializeEventListeners() {
    this.elements.startGameButton.addEventListener("pointerdown", () =>
      this.startGame()
    );

    this.elements.listenButton.addEventListener("pointerdown", () =>
      speakTextWithAzure(this.correctWord)
    );

    this.elements.speakIntroButton.addEventListener("pointerdown", () =>
      speakTextWithAzure("숨은 단어 찾기")
    );

    this.elements.helpButton.addEventListener("pointerdown", () =>
      this.showHelpModal()
    );

    this.elements.closeModalButton.addEventListener("pointerdown", () =>
      this.closeHelpModal()
    );
    this.elements.helpModalOverlay.addEventListener("pointerdown", () =>
      this.closeHelpModal()
    );

    this.elements.helpSpeakButton.addEventListener("pointerdown", () =>
      speakTextWithAzure(
        "듣기 버튼을 누르면 단어를 들을 수 있어. 글자속에서 방금 들은 단어를 순서대로 찾아줘!"
      )
    );

    this.elements.checkButton.addEventListener("pointerdown", () =>
      this.resetGame()
    );

    this.elements.grid.addEventListener("pointerdown", (e) => {
      if (e.target.classList.contains("cell")) {
        this.checkAnswer(e.target);
      }
    });
    this.observeSectionChange();
  }

  observeSectionChange() {
    const observer = new MutationObserver(() => {
      if (this.elements.startScreen.classList.contains("hidden")) {
        console.log("🔄 섹션 변경 감지! 배경 음악 중지");
        this.elements.bgMusic.pause();
        this.elements.bgMusic.currentTime = 0;
      }
    });

    observer.observe(this.elements.startScreen, {
      attributes: true,
      attributeFilter: ["class"],
    });
  }

  getRandomTargetWord() {
    return GAME_CONSTANTS.TARGET_WORDS[
      Math.floor(Math.random() * GAME_CONSTANTS.TARGET_WORDS.length)
    ];
  }

  getConfusingWords(targetWord) {
    return [...GAME_CONSTANTS.CONFUSING_WORDS[targetWord]];
  }

  startGame() {
    this.elements.startScreen.classList.add("hidden");
    this.elements.gameScreen.classList.remove("hidden");

    const targetWordDisplay = document.getElementById("targetWordDisplay");
    targetWordDisplay.textContent = this.correctWord;
    targetWordDisplay.classList.add("loop-animation");

    this.createGrid();
  }

  createGrid() {
    this.elements.grid.innerHTML = "";
    this.correctGuesses.clear();

    let gridArray = Array(this.gridSize * this.gridSize).fill(null);
    let positions = [];

    let isHorizontal = Math.random() > 0.5;
    let startX = Math.floor(
      Math.random() * (this.gridSize - this.correctWord.length + 1)
    );
    let startY = Math.floor(
      Math.random() * (this.gridSize - this.correctWord.length + 1)
    );

    for (let i = 0; i < this.correctWord.length; i++) {
      let pos = isHorizontal
        ? startY * this.gridSize + (startX + i)
        : (startY + i) * this.gridSize + startX;
      gridArray[pos] = this.correctWord[i];
      positions.push(pos);
    }

    this.shuffleArray(this.generatedWords);
    for (let i = 0; i < gridArray.length; i++) {
      if (!gridArray[i]) {
        gridArray[i] = this.generatedWords.pop();
      }
    }

    gridArray.forEach((char, index) => {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      cell.textContent = char;
      if (positions.includes(index)) cell.dataset.correct = "true";
      this.elements.grid.appendChild(cell);
    });
  }

  showHelpModal() {
    this.elements.helpModal.style.display = "block";
    this.elements.helpModalOverlay.style.display = "block";
  }

  closeHelpModal() {
    this.elements.helpModal.style.display = "none";
    this.elements.helpModalOverlay.style.display = "none";
  }

  checkAnswer(cell) {
    speakTextWithAzure(cell.textContent);

    if (cell.dataset.correct) {
      cell.classList.add("correct");
      this.correctGuesses.add(cell.textContent);

      const correctLetters = this.correctWord.split("");
      const allCorrect = correctLetters.every((letter) =>
        this.correctGuesses.has(letter)
      );

      if (allCorrect) {
        setTimeout(() => {
          cell.classList.remove("wrong");
          speakTextWithAzure("딩동댕");
          submitGameResult(true);
          this.showResultModal("정답이야 ! 멋진데 ! 😎", true);
        }, 500);
      }
    } else {
      cell.classList.add("wrong");

      setTimeout(() => {
        cell.classList.remove("wrong");
        speakTextWithAzure("삐익");
        submitGameResult(false);
        this.showResultModal("다시 도전 해볼까 ? 🧐", false);
      }, 500);
    }
  }
  showResultModal(message, isCorrect) {
    this.elements.congratsMessage.textContent = message;
    this.elements.resetModal.style.display = "block";
    this.elements.modalOverlay.style.display = "block";

    this.elements.checkButton.innerHTML = "";
    this.elements.checkButton.style.background = "none";
    this.elements.checkButton.style.border = "none";

    if (isCorrect) {
      this.elements.checkButton.innerHTML = `
    <button id="nextGameButton" class="modal-btn">다음 게임으로 !</button>
`;

      document.getElementById("nextGameButton").onclick = () => {
        window.location.href = "/flip";
      };

      document.getElementById("retryGameButton").onclick = () => {
        this.resetWithNewWord();
      };
    } else {
      this.elements.checkButton.innerHTML = `
            <button id="retryOnlyButton" class="modal-btn">응 !</button>
        `;

      document.getElementById("retryOnlyButton").onclick = () => {
        this.retrySameWord();
      };
    }
  }
  retrySameWord() {
    this.elements.resetModal.style.display = "none";
    this.elements.modalOverlay.style.display = "none";
  }

  resetWithNewWord() {
    this.elements.resetModal.style.display = "none";
    this.elements.modalOverlay.style.display = "none";

    this.correctWord = this.getRandomTargetWord();
    this.correctGuesses.clear();
    this.generatedWords = this.getConfusingWords(this.correctWord);

    const targetWordDisplay = document.getElementById("targetWordDisplay");
    targetWordDisplay.textContent = this.correctWord;
    targetWordDisplay.classList.remove("loop-animation");
    void targetWordDisplay.offsetWidth;
    targetWordDisplay.classList.add("loop-animation");

    this.createGrid();
  }

  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
}

new WordGame();

// score 기능을 위해 추가한 부분
function submitGameResult(isCorrect) {
  const gameName = "글자인식"; // 🔤 글자 찾기 게임
  fetch("https://52.141.27.150/submit_evaluation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ game_name: gameName, success: isCorrect ? 1 : 0 }),
  })
    .then((response) => response.json())
    .then((data) => console.log(`✅ ${gameName} 결과 전송 완료:`, data))
    .catch((error) => console.error(`❌ ${gameName} 결과 전송 실패:`, error));
}
