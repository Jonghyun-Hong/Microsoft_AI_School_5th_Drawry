// auth-guard.js
document.addEventListener('DOMContentLoaded', async function() {
    // 토큰이 없으면 로그인 페이지로 리다이렉트
    const token = localStorage.getItem('token');
    
    if (!token) {
      redirectToLogin();
      return;
    }
    
    // 토큰이 있으면 유효성 검증
    try {
      const response = await fetch('http://127.0.0.1:8001/api/v1/auth/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        // 인증 실패 (401, 403 등)
        throw new Error('인증에 실패했습니다');
      }
      
      // 사용자 정보 저장 (필요한 경우)
      const userData = await response.json();
      localStorage.setItem('user', JSON.stringify(userData));
      
      console.log('인증 성공:', userData);
    } catch (error) {
      console.error('인증 오류:', error);
      // 토큰 삭제 후 로그인 페이지로 리다이렉트
      localStorage.removeItem('token');
      redirectToLogin();
    }
  });
  
  function redirectToLogin() {
    // 현재 URL 저장 (로그인 후 돌아오기 위함)
    localStorage.setItem('redirectUrl', window.location.pathname);
    
    // 로그인 페이지로 리다이렉트
    window.location.href = '/login';
  }