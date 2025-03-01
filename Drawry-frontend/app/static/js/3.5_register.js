document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM fully loaded");

  // 비밀번호 유효성 검사 함수
  function validatePassword(password) {
    const hasLetter = /[A-Za-z]/.test(password);
    const hasNumber = /\d/.test(password);
    return password.length >= 8 && hasLetter && hasNumber;
  }

  // 현재 날짜를 YYYY-MM-DD 형식으로 반환하는 함수
  function getFormattedDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // 개인정보 동의 모달 관련 함수
  function setupPrivacyModal() {
    const openModalBtn = document.getElementById("open-privacy-modal");
    const closeModalBtn = document.getElementById("close-privacy-modal");
    const agreeBtn = document.getElementById("agree-privacy");
    const modal = document.getElementById("privacy-modal");
    const overlay = document.getElementById("privacy-modal-overlay");
    const privacyCheckbox = document.getElementById("privacy-check");

    // 모달 열기
    openModalBtn.addEventListener("click", function (e) {
      e.preventDefault(); // 이벤트 전파 방지
      modal.style.display = "block";
      overlay.style.display = "block";
    });

    // 모달 닫기
    function closeModal() {
      modal.style.display = "none";
      overlay.style.display = "none";
      // 닫기 버튼을 클릭했을 때 체크박스 상태를 변경하지 않습니다.
    }

    closeModalBtn.addEventListener("click", closeModal);

    // 모달 외부 클릭 시 닫기
    overlay.addEventListener("click", closeModal);

    // 동의 버튼 클릭 시 체크박스 체크 후 모달 닫기
    agreeBtn.addEventListener("click", function () {
      privacyCheckbox.checked = true; // 동의 버튼 클릭 시에만 체크박스가 체크됨
      closeModal();
    });
  }

  // 폼 제출 처리 함수
  async function handleRegister(e) {
    console.log("Form submission started");
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const passwordConfirm = document.getElementById("password-confirm").value;
    const privacyCheck = document.getElementById("privacy-check").checked;

    // 개인정보 동의 확인
    if (!privacyCheck) {
      alert("개인정보 수집 및 이용에 동의해주세요.");
      return;
    }

    // 비밀번호 확인
    if (password !== passwordConfirm) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }

    // 비밀번호 유효성 검사
    if (!validatePassword(password)) {
      alert("비밀번호는 8자 이상이며, 영문과 숫자를 포함해야 합니다.");
      return;
    }

    try {
      console.log("Attempting API call...");

      // API 요청 데이터
      const requestData = {
        email: email,
        password: password,
        nickname: "temp_" + Math.random().toString(36).substring(7), // 임시 닉네임 생성
        birth_date: getFormattedDate(), // YYYY-MM-DD 형식의 날짜
      };

      console.log("Request data:", {
        ...requestData,
        password: "[HIDDEN]", // 비밀번호는 로그에 표시하지 않음
      });

      const response = await axios.post(
        "https://drawrypro.r-e.kr/api/v1/auth/register",
        requestData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("회원가입 응답:", response.data);

      if (response.data) {
        localStorage.setItem("registerEmail", email);
        localStorage.setItem("registerPassword", password);
        window.location.href = "/userinfo";
      }
    } catch (error) {
      console.error("회원가입 에러:", error);

      if (error.response) {
        console.log("Error response:", {
          status: error.response.status,
          data: error.response.data,
        });

        if (
          error.response.status === 400 &&
          error.response.data.detail === "Email already registered"
        ) {
          alert("이미 등록된 이메일입니다.");
        } else if (error.response.status === 422) {
          // 유효성 검사 실패 시 상세 메시지 표시
          const validationErrors = error.response.data.detail;
          let errorMessage = "입력 데이터가 올바르지 않습니다:\n";
          if (Array.isArray(validationErrors)) {
            errorMessage += validationErrors
              .map((err) => `- ${err.loc[1]}: ${err.msg}`)
              .join("\n");
          } else {
            errorMessage += error.response.data.detail;
          }
          alert(errorMessage);
        } else {
          alert(
            `회원가입 실패: ${
              error.response.data.detail || "알 수 없는 오류가 발생했습니다."
            }`
          );
        }
      } else if (error.request) {
        console.log("Error request:", error.request);
        alert("서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.");
      } else {
        console.log("Error:", error.message);
        alert("회원가입 요청을 처리할 수 없습니다.");
      }
    }
  }

  // 이벤트 리스너 설정
  const form = document.querySelector(".register-form");
  if (form) {
    console.log("Form found, adding event listener");
    form.addEventListener("submit", handleRegister);
  } else {
    console.error("Form not found!");
  }

  // 개인정보 동의 모달 설정
  setupPrivacyModal();
});
