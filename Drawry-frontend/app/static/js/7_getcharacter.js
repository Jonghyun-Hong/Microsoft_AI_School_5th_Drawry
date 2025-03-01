document.addEventListener("DOMContentLoaded", function () {
  // 음성 재생 이벤트 리스너
  document
    .querySelector(".listen-get-1")
    .addEventListener("pointerdown", () => {
      speakTextWithAzure(
        "시작할 내용을 구성해볼까? 먼저 시간대를 알려줘 ! 낮 ? 밤 ?"
      );
    });
  document
    .querySelector(".listen-get-2")
    .addEventListener("pointerdown", () => {
      speakTextWithAzure(
        "주인공이 어디에 있는지 알려줘! 아그라바? 시장? 왕궁? 마법의 동굴 ? 지니의 세계?"
      );
    });
  document
    .querySelector(".listen-get-3")
    .addEventListener("pointerdown", () => {
      speakTextWithAzure(
        "주인공이 무엇을 하는지 알려줘 !마법의 램프로 세가지 소원을 빌기 시작했어 ? 반짝이는 보물을 발견했어 ? 마법의 양탄자를 타고 날고 있어 ?"
      );
    });

  // 섹션 가져오기
  const whenSection = document.getElementById("when");
  const whereSection = document.getElementById("where");
  const whatSection = document.getElementById("what");

  // 버튼 가져오기
  const morningBtn = document.getElementById("morning");
  const nightBtn = document.getElementById("night");

  const op1Btn = document.getElementById("op1Btn");
  const op2Btn = document.getElementById("op2Btn");
  const op3Btn = document.getElementById("op3Btn");
  const op4Btn = document.getElementById("op4Btn");
  const op5Btn = document.getElementById("op5Btn");

  const magicLampBtn = document.getElementById("magic-lamp");
  const treasureBtn = document.getElementById("treasure");
  const magicCarpetBtn = document.getElementById("magic-carpet");

  const backBtns = document.querySelectorAll(".back-btn");

  // 초기 설정: 첫 번째 섹션만 보이게 함
  whenSection.style.display = "block";
  whereSection.style.display = "none";
  whatSection.style.display = "none";

  // 공통 이벤트 추가 함수 (클릭 + 터치)
  function addClickAndTouchEvent(element, callback) {
    if (element) {
      element.addEventListener("click", callback);
      element.addEventListener("touchstart", function (event) {
        event.preventDefault(); // 터치 시 클릭 이벤트 중복 방지
        callback();
      });
    }
  }

  function saveData(key, value) {
    localStorage.setItem(key, value);
  }

  function goToNextSection(current, next) {
    current.style.display = "none";
    next.style.display = "block";
  }

  // 시간 선택 → 장소 선택 섹션으로 이동
  addClickAndTouchEvent(morningBtn, () => {
    saveData("time", "낮");
    goToNextSection(whenSection, whereSection);
  });

  addClickAndTouchEvent(nightBtn, () => {
    saveData("time", "밤");
    goToNextSection(whenSection, whereSection);
  });

  // 장소 선택 → 행동 선택 섹션으로 이동
  addClickAndTouchEvent(op1Btn, () => {
    saveData("place", "아그라바");
    goToNextSection(whereSection, whatSection);
  });

  addClickAndTouchEvent(op2Btn, () => {
    saveData("place", "시장");
    goToNextSection(whereSection, whatSection);
  });

  addClickAndTouchEvent(op3Btn, () => {
    saveData("place", "왕궁");
    goToNextSection(whereSection, whatSection);
  });

  addClickAndTouchEvent(op4Btn, () => {
    saveData("place", "마법의 동굴");
    goToNextSection(whereSection, whatSection);
  });

  addClickAndTouchEvent(op5Btn, () => {
    saveData("place", "지니의 세계");
    goToNextSection(whereSection, whatSection);
  });

  // 행동 선택 → Drawing.html로 이동
  function goToDrawingPage(action) {
    saveData("action", action);
    window.location.href = "/drawing";
  }

  addClickAndTouchEvent(magicLampBtn, () => {
    goToDrawingPage("마법의 램프로 세가지 소원을 빌기 시작했어!");
  });

  addClickAndTouchEvent(treasureBtn, () => {
    goToDrawingPage("반짝이는 보물을 발견했어!");
  });

  addClickAndTouchEvent(magicCarpetBtn, () => {
    goToDrawingPage("마법의 양탄자를 타고 날아다니고 있어!");
  });

  // 뒤로 가기 버튼 기능 추가
  backBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (whereSection.style.display === "block") {
        goToNextSection(whereSection, whenSection);
      } else if (whatSection.style.display === "block") {
        goToNextSection(whatSection, whereSection);
      }
    });
  });

  // 정보 박스 표시 (클릭 + 터치)
  document.querySelectorAll(".btn-wrapper").forEach((wrapper) => {
    const btn = wrapper.querySelector(".btn");
    const infoBox = wrapper.querySelector(".info-box");

    function showInfo() {
      infoBox.style.display = "block";
    }

    function hideInfo() {
      infoBox.style.display = "none";
    }

    addClickAndTouchEvent(btn, showInfo);

    btn.addEventListener("mouseover", showInfo);
    btn.addEventListener("mouseout", hideInfo);
    btn.addEventListener("touchend", hideInfo);
  });
});
