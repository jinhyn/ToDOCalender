import React from 'react';

export default function KakaoAuthDisplay({ user, loginWithKakao, logout }) {
  if (!user) {
    return (
      <div className="auth-login-card">
        <div className="auth-login-copy"><span>TO DO CALENDAR</span><strong>오늘의 일정을 한눈에</strong></div>
        <button className="auth-login-button" onClick={loginWithKakao}>카카오로 시작하기</button>
      </div>
    );
  }

  return (
    <div className="auth-user">
      <span className="auth-user-badge">●</span>
      <span className="auth-user-name">{user.nickname}님</span>
      <button className="auth-logout-button" onClick={logout}>로그아웃</button>
    </div>
  );
}
