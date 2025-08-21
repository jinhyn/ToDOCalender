import React from 'react';

export default function KakaoAuthDisplay({ user, loginWithKakao, logout }) {
  if (!user) {
    return (
      <div style={{ textAlign: 'center', marginTop: '20px', marginBottom: '20px' }}>
        <h2>To-Do Calendar</h2>
        <button onClick={loginWithKakao} style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}>
          카카오 로그인
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <span>👤 {user.nickname}님</span>
      <button onClick={logout} style={{ padding: '5px 10px', cursor: 'pointer' }}>로그아웃</button>
    </div>
  );
}