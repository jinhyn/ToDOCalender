# ToDOCalender 🗓️✅

**할 일 관리 + 캘린더 기능**을 제공하는 프로젝트입니다.  
프론트엔드(React)와 백엔드(Django)를 분리하여 개발했으며, 직관적인 UI와 캘린더 기반의 일정 관리 기능을 제공합니다.

---

## 🚀 기술 스택

- **Frontend**
  - React (Vite 기반)
  - FullCalendar
  - Axios
- **Backend**
  - Python 3.x, Django
  - Django REST Framework
- **환경**
  - npm, pip, virtualenv, Git

---

## 📂 프로젝트 구조

| 폴더 / 파일         | 설명                                         |
|-------------------|--------------------------------------------|
| `backend/`        | Django 서버 코드                               |
| `frontend/`       | React 프론트엔드 코드 (UI, 캘린더, ToDo 관리) |
| `node_modules/`   | 프론트엔드 의존성 (gitignore 대상)            |
| `manage.py`       | Django 관리 파일                              |
| `requirements.txt`| Python 패키지 목록                             |
| `package.json`    | 프론트엔드 패키지 정보                          |
| `package-lock.json`| 프론트엔드 패키지 잠금 파일                    |
| `README.md`       | 프로젝트 설명 문서                             |

---

## ⚙️ 실행 방법

### 1. 저장소 클론
```bash
git clone https://github.com/jinhyn/ToDOCalender.git
cd ToDOCalender

2. 백엔드 실행 (Django)
cd backend
# 가상환경 생성
python -m venv venv
# 가상환경 활성화 (Windows)
venv\Scripts\activate
# 패키지 설치
pip install -r requirements.txt
# 마이그레이션
python manage.py migrate
# 서버 실행
python manage.py runserver


3. 프론트엔드 실행
cd frontend
npm install
npm run dev


✨ 주요 기능

✅ 할 일(ToDo) 등록 / 수정 / 삭제

📅 캘린더 기반 일정 관리

🔄 Drag & Drop 지원

🌐 Django REST API 연동

📌 향후 개선 예정

사용자 로그인/회원가입 기능

DB 연동 (PostgreSQL, MySQL 등)

클라우드 배포 (Vercel, Heroku, AWS 등)

반응형 UI 개선
