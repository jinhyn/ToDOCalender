import axios from 'axios';

// Vite는 VITE_ 접두사가 붙은 환경변수만 클라이언트에 노출합니다.
// .env / .env.local 에 VITE_API_BASE_URL을 정의하지 않으면 로컬 개발 기본값을 사용합니다.
const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/';

const api = axios.create({ baseURL });

export default api;
