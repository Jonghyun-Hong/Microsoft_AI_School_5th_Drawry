import CONFIG from "./config.js";

const drawingBox = document.querySelector(".drawing-box");
const selectedImage = localStorage.getItem("selectedImage");

if (selectedImage) {
  console.log("Stored image URL:", selectedImage);

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
    console.log("Image loaded successfully");
    drawingBox.innerHTML = `<img src="${imageUrl}" alt="선택한 이미지" class="story-image">`;
  };

  img.onerror = function () {
    console.error("Image failed to load:", imageUrl);
    const alternativeUrl = `${CONFIG.FLASK_SERVER}/static/output/${selectedImage
      .split("/")
      .pop()}`;
    console.log("Trying alternative URL:", alternativeUrl);
    drawingBox.innerHTML = `<img src="${alternativeUrl}" alt="선택한 이미지" class="story-image">`;
  };

  img.src = imageUrl;
} else {
  console.error("No image found in localStorage");
  drawingBox.innerHTML = "선택된 이미지가 없습니다.";
}

document.getElementById("storyBtn").addEventListener("click", () => {
  window.location.href = "/storyopenai";
});

document.querySelector(".listen-makestory").addEventListener("click", () => {
  speakTextWithAzure("아까 만든 그림과 어울리는 내용을 우리 함께 만들어볼까 ?");
});
