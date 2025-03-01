function nextSection(current) {
  // 현재 섹션 숨기기
  document.getElementById("intro" + current).style.display = "none";

  // 다음 섹션 보이기
  document.getElementById("intro" + (current + 1)).style.display = "block";
}

document.querySelector(".listen-intro-1").addEventListener("pointerdown", () => {
  speakTextWithAzure("문해력이란 무엇이며 왜 중요할까요? 우리 아이 혹은 본인이 글을 읽어보게 되었을 때 한번에 이해하기 어려운 상황을 겪고 있나요? 그렇다면 잘 찾아오셨어요!")
});
document.querySelector(".listen-intro-2").addEventListener("pointerdown", () => {
  speakTextWithAzure("글을 읽는 것은 사실, 무척 재미있어요. 소설은 멋진 주인공이 되는 걸 상상하게 해주고, 신문 기사는 시대의 생각들을 알려주고, 편지는 상대방의 감정을 공감하게 해줘요.")
});
document.querySelector(".listen-intro-3").addEventListener("pointerdown", () => {
  speakTextWithAzure("나만의 그림, 나만의 글, 나만의 동화책 ! 드로리를 이용하여 내가 상상한 그림을 그리고, 나의 그림과 어울리는 내용을 AI와 함께 만들어 나만의 동화책을 가져보아요!")
});