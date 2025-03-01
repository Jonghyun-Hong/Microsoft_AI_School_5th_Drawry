async function registerUser(email, password, nickname, birthDate) {
  try {
    const response = await axios.post('http://127.0.0.1:8001/register', {
      email: email,
      password: password,
      nickname: nickname,
      birth_date: birthDate
    });

    if (response.data) {
      // 임시 저장 데이터 삭제
      localStorage.removeItem('registerEmail');
      localStorage.removeItem('registerPassword');
      
      // 로그인 페이지로 리다이렉트
      alert('회원가입이 완료되었습니다. 로그인해주세요.');
      window.location.href = '/login';
    }
  } catch (error) {
    alert('회원가입에 실패했습니다. 다시 시도해주세요.');
    console.error('Register error:', error);
  }
}

// nextSection 함수 수정
function nextSection(targetId) {
  const nicknameInput = document.getElementById("nickname-input").value;
  const birthdayInput = document.getElementById("birthday").value;

  if (targetId === "birth-section" && nicknameInput.trim() !== "") {
    localStorage.setItem("userNickname", nicknameInput);
    document.querySelectorAll("section").forEach((sec) => (sec.style.display = "none"));
    document.getElementById(targetId).style.display = "block";
  } else if (targetId === "maintab") {
    if (!birthdayInput) {
      alert('생일을 입력해주세요.');
      return;
    }
    
    const email = localStorage.getItem('registerEmail');
    const password = localStorage.getItem('registerPassword');
    
    if (email && password && nicknameInput && birthdayInput) {
      registerUser(email, password, nicknameInput, birthdayInput);
    } else {
      alert('필요한 정보가 모두 입력되지 않았습니다.');
    }
  }
}

document.querySelector(".listen-info-1").addEventListener("pointerdown", () => {
  speakTextWithAzure("별명 짓기. 먼저 , 멋진 별명을 지어봐요 ! 잘 기억해 둘게요.")
});
document.querySelector(".listen-info-2").addEventListener("pointerdown", () => {
  speakTextWithAzure("나의 생일. 생일을 알려주세요 ! 정확한 문해력 분석을 위해 필요해요.")
});