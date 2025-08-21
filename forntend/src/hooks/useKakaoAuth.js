import { useState, useEffect } from 'react';

const KAKAO_APP_KEY = '88dbf074f3edb7e6126477fc5a590fc5'; // 실제 카카오 앱 키로 변경하세요

export function useKakaoAuth() {
  const [user, setUser] = useState(null);
  const [isSdkLoaded, setIsSdkLoaded] = useState(false);

  useEffect(() => {
    if (document.getElementById('kakao-sdk')) {
      if (window.Kakao && !window.Kakao.isInitialized()) {
        window.Kakao.init(KAKAO_APP_KEY);
      }
      setIsSdkLoaded(true);
      checkLoginStatus();
      return;
    }

    const script = document.createElement('script');
    script.id = 'kakao-sdk';
    script.src = 'https://developers.kakao.com/sdk/js/kakao.js';
    script.async = true;
    script.onload = () => {
      if (!window.Kakao.isInitialized()) {
        window.Kakao.init(KAKAO_APP_KEY);
      }
      setIsSdkLoaded(true);
      checkLoginStatus();
    };
    document.body.appendChild(script);

    return () => {
      // 컴포넌트 언마운트 시 스크립트 태그는 일반적으로 제거하지 않지만, 필요시 로직 추가 가능
    };
  }, []);

  const checkLoginStatus = () => {
    if (window.Kakao && window.Kakao.isInitialized() && window.Kakao.Auth.getAccessToken()) {
      window.Kakao.API.request({
        url: '/v2/user/me',
        success: function (response) {
          if (response?.kakao_account?.profile) {
            setUser(response.kakao_account.profile);
          }
        },
        fail: function (error) {
          console.error('Failed to fetch user info', error);
          setUser(null);
        }
      });
    } else {
      setUser(null);
    }
  };

  const loginWithKakao = () => {
    if (isSdkLoaded && window.Kakao && window.Kakao.isInitialized()) {
      window.Kakao.Auth.login({
        success: checkLoginStatus,
        fail: (err) => alert('로그인 실패: ' + JSON.stringify(err)),
      });
    } else {
      alert('Kakao SDK가 아직 로드되지 않았습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  const logout = () => {
    if (isSdkLoaded && window.Kakao && window.Kakao.isInitialized() && window.Kakao.Auth.getAccessToken()) {
      window.Kakao.Auth.logout(() => {
        setUser(null);
      });
    } else {
        setUser(null);
    }
  };

  return { user, loginWithKakao, logout, isSdkLoaded };
}