let currentIndex = 0;
const modal = document.getElementById("modal");
const modalOverlay = document.getElementById("modalOverlay");
const modalText = document.getElementById("modalText");
const closeModal = document.getElementById("closeModal");
const section1 = document.getElementById("section-1");
const section2 = document.getElementById("section-2");
const selectStoryBtn = document.getElementById("selectStory");
const selectCharacterBtn = document.getElementById("selectCharacter");
const prevBtns = document.querySelectorAll("#prev");
const nextBtns = document.querySelectorAll("#next");
const cardContainers = document.querySelectorAll(".card-container");

// 📌 카드 업데이트 함수 (스토리 & 캐릭터 선택 공통)
function updateCards(isStorySection) {
  const container = isStorySection
    ? section1.querySelector(".card-container")
    : section2.querySelector(".card-container");
  const names = isStorySection ? storyNames : characterNames;
  const images = isStorySection ? storyImages : characterImages;

  container.innerHTML = ""; // 기존 카드 초기화

  for (let i = -1; i <= 1; i++) {
    const newIndex = (currentIndex + i + names.length) % names.length;

    const card = document.createElement("div");
    card.classList.add("card");
    if (i === 0) card.classList.add("center-card");

    const img = document.createElement("img");
    img.src = images[newIndex];
    img.classList.add("card-img");

    const span = document.createElement("span");
    span.classList.add("card-text");
    span.textContent = names[newIndex];

    card.appendChild(img);
    card.appendChild(span);
    container.appendChild(card);
  }
}

// 📌 이전/다음 버튼 이벤트 리스너 (스토리 & 캐릭터 공통)
prevBtns.forEach((button) => {
  button.addEventListener("pointerdown", (event) => {
    const isStorySection =
      event.target.closest(".container").id === "section-1";
    const arrayLength = isStorySection
      ? storyNames.length
      : characterNames.length;

    currentIndex = (currentIndex - 1 + arrayLength) % arrayLength;
    updateCards(isStorySection);
  });
});

nextBtns.forEach((button) => {
  button.addEventListener("pointerdown", (event) => {
    const isStorySection =
      event.target.closest(".container").id === "section-1";
    const arrayLength = isStorySection
      ? storyNames.length
      : characterNames.length;

    currentIndex = (currentIndex + 1) % arrayLength;
    updateCards(isStorySection);
  });
});

document.getElementById("playStoryAudio").addEventListener("click", () => {
  speakTextWithAzure("동화책을 선택해줘");
});

document.getElementById("playCharacterAudio").addEventListener("click", () => {
  speakTextWithAzure("캐릭터를 선택해줘");
});

function getCurrentSelection(isStorySection) {
  const section = isStorySection ? section1 : section2;
  const selectedCard = section.querySelector(".center-card .card-text");
  return selectedCard.textContent.trim();
}

selectStoryBtn.addEventListener("pointerdown", () => {
  const selectedStory = getCurrentSelection(true).replace(/\s/g, "");
  if (selectedStory === "알라딘과요술램프") {
    section1.style.display = "none";
    section2.style.display = "block";
    currentIndex = 0;
    updateCards(false);
  } else {
    modalText.textContent =
      "이  동 화 책 은  아 직  선 택 할  수  없 어 🥲".replace(/ /g, "\u00A0");
    modal.style.display = "block";
    modalOverlay.style.display = "block";
  }
});

selectCharacterBtn.addEventListener("pointerdown", () => {
  const selectedCharacter = getCurrentSelection(false).replace(/\s/g, "");
  if (selectedCharacter === "알라딘") {
    section2.style.display = "none";
    window.location.href = "/getcharacter";
  } else {
    modalText.textContent =
      "이  캐 릭 터 는  아 직  선 택  할  수  없 어 🥲".replace(/ /g, "\u00A0");
    modal.style.display = "block";
    modalOverlay.style.display = "block";
  }
});

// 📌 모달 닫기 버튼
closeModal.addEventListener("pointerdown", () => {
  modal.style.display = "none";
  modalOverlay.style.display = "none";
});

// 📌 초기 실행 (스토리 선택 초기화)
updateCards(true);
