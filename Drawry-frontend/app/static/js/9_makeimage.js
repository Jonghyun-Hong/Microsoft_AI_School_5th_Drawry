import CONFIG from "./config.js";

document.addEventListener("DOMContentLoaded", () => {
  // 서버 주소를 빈 문자열로 설정 (상대 경로 사용)
  const FLASK_SERVER = "";

  const loadingSection = document.getElementById("loading");
  const makeimgSection = document.getElementById("makeimg");
  const showimgSection = document.getElementById("showimg");

  const yesBtn = document.getElementById("yes");
  const retryBtn = document.getElementById("retry");
  const remakeBtn = document.getElementById("remake");
  const backBtns = document.querySelectorAll(".back-btn");

  const sel1 = document.getElementById("sel1");
  const sel2 = document.getElementById("sel2");
  const sel3 = document.getElementById("sel3");

  // 초기 섹션 설정
  loadingSection.style.display = "block";
  makeimgSection.style.display = "none";
  showimgSection.style.display = "none";

  function checkImageStatus() {
    fetch(`/api/status`) // 상대 경로로 변경
      .then((response) => response.json())
      .then((data) => {
        if (!data.processing && data.image_urls.length === 3) {
          console.log("✅ 이미지 생성 완료!");
          localStorage.setItem(
            "generatedImages",
            JSON.stringify(data.image_urls)
          );

          [sel1, sel2, sel3].forEach((el, idx) => {
            // 이미지 URL도 상대 경로 사용
            el.innerHTML = `<img src="${data.image_urls[idx]}" />`;
          });

          loadingSection.style.display = "none";
          makeimgSection.style.display = "block";
        } else {
          console.log("⏳ 이미지 생성 중...");
          setTimeout(checkImageStatus, 3000);
        }
      })
      .catch((error) => {
        console.error("🚨 상태 확인 중 오류 발생:", error);
        // 오류 발생 시 5초 후 재시도
        setTimeout(checkImageStatus, 5000);
      });
  }

  yesBtn.addEventListener("click", () => {
    makeimgSection.style.display = "none";
    showimgSection.style.display = "block";
  });

  retryBtn.addEventListener("click", () => {
    localStorage.removeItem("generatedImages");
    localStorage.setItem("imageProcessing", "true");
    window.location.href = "/drawing";
  });

  remakeBtn.addEventListener("click", () => {
    localStorage.removeItem("generatedImages");
    localStorage.setItem("imageProcessing", "true");
    window.location.href = "/getcharacter";
  });

  function selectImage(imageIdx) {
    const images = JSON.parse(localStorage.getItem("generatedImages"));
    if (images && images[imageIdx]) {
      localStorage.setItem("selectedImage", images[imageIdx]);
      window.location.href = "/makestory";
    }
  }

  sel1.addEventListener("click", () => selectImage(0));
  sel2.addEventListener("click", () => selectImage(1));
  sel3.addEventListener("click", () => selectImage(2));

  backBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (makeimgSection.style.display === "block") {
        makeimgSection.style.display = "none";
        loadingSection.style.display = "block";
      } else if (showimgSection.style.display === "block") {
        showimgSection.style.display = "none";
        makeimgSection.style.display = "block";
      }
    });
  });

  if (localStorage.getItem("imageProcessing") === "true") {
    checkImageStatus();
  }
});
