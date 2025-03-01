// 로그인 처리 함수
async function handleEmailLogin(e) {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  if (!email || !password) {
    alert("이메일과 비밀번호를 모두 입력해주세요.");
    return;
  }

  try {
    const response = await fetch("https://drawrypro.r-e.kr/api/v1/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({
        username: email,
        password: password,
      }).toString(), // URLSearchParams를 문자열로 변환
      mode: "cors", // CORS 모드 명시적 설정
      credentials: "same-origin", // credentials 설정 변경
    });

    if (!response.ok) {
      throw new Error("로그인에 실패했습니다.");
    }

    const data = await response.json();

    if (data && data.access_token) {
      localStorage.setItem("token", data.access_token);
      window.location.replace("/maintab");
      return false;
    } else {
      throw new Error("토큰을 받지 못했습니다.");
    }
  } catch (error) {
    console.error("로그인 에러:", error);
    alert(error.message);
  }
}

// DOM 로드 후 이벤트 리스너 등록
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.querySelector(".login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", handleEmailLogin);
    console.log("로그인 폼 이벤트 리스너 등록됨");
  } else {
    console.error("로그인 폼을 찾을 수 없음");
  }
});
