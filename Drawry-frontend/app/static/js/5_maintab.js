// 사용자 닉네임 가져오기
function getUserNickname() {
  return localStorage.getItem("userNickname") || "로그인해주세요";
}

// 서재 제목 업데이트
function updateLibraryTitle() {
  const nickname = getUserNickname();
  const titleElement = document.getElementById("libraryTitle");
  titleElement.textContent = `${nickname}의 서재`;
}

// 이야기 존재 여부 확인
function checkStoryExists() {
  // localStorage에서 storyResponse_1 확인
  const storyResponse = localStorage.getItem("storyResponse_1");

  if (storyResponse) {
    // 이야기가 존재하면 동화책 표시
    console.log(
      "📚 저장된 이야기가 있습니다:",
      storyResponse.substring(0, 50) + "..."
    );
    showBookLibrary();
  } else {
    // 이야기가 없으면 빈 서재 표시
    console.log("📚 저장된 이야기가 없습니다.");
    showEmptyLibrary();
  }
}

// 빈 서재 표시
function showEmptyLibrary() {
  document.getElementById("emptyLibrary").style.display = "block";
  document.getElementById("bookLibrary").style.display = "none";

  document.querySelector(".top-shelf").style.display = "block";
  document.querySelector(".bottom-shelf").style.display = "block";
}

// 동화책이 있는 서재 표시
function showBookLibrary() {
  document.getElementById("emptyLibrary").style.display = "none";
  document.getElementById("bookLibrary").style.display = "block";

  // 동화책 클릭 이벤트 추가
  const fairytaleBook = document.getElementById("fairytaleBook");
  fairytaleBook.addEventListener("click", function () {
    location.href = "/fairytale";
  });
}

// 텍스트 음성 변환 함수
function speakTextWithAzure(text) {
  if (!text) {
    return;
  }
  console.log("음성 출력:", text);
  fetch(`/tts?text=${encodeURIComponent(text)}`)
    .then((response) => response.blob())
    .then((audioBlob) => {
      const audioUrl = URL.createObjectURL(audioBlob);
      const audioPlayer =
        document.getElementById("audio-player") ||
        document.createElement("audio");
      audioPlayer.id = "audio-player";
      audioPlayer.style.display = "none";
      document.body.appendChild(audioPlayer);
      audioPlayer.src = audioUrl;
      audioPlayer.play();
    })
    .catch((error) => {
      console.error("TTS 오류:", error);
    });
}

// 페이지 로드 시 실행
document.addEventListener("DOMContentLoaded", function () {
  updateLibraryTitle();
  checkStoryExists();

  // 오디오 엘리먼트가 없으면 추가
  if (!document.getElementById("audio-player")) {
    const audioPlayer = document.createElement("audio");
    audioPlayer.id = "audio-player";
    audioPlayer.style.display = "none";
    document.body.appendChild(audioPlayer);
  }
});
