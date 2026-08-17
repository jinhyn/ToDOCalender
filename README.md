# ToDOCalender 🗓️✅

**할 일 관리 + 캘린더 + 일정 간 이동시간 경고**를 제공하는 프로젝트입니다.  
프론트엔드(React)와 백엔드(Django)를 분리하여 개발했으며, 캘린더 기반 일정 관리와 장소 간 이동 가능 여부를 함께 확인할 수 있습니다.

---

## 🚀 기술 스택

- **Frontend**
  - React (Vite 기반)
  - FullCalendar
  - Axios
- **Backend**
  - Python 3.x, Django
  - Django REST Framework
- **외부 API**
  - Kakao Maps 장소 검색
  - Kakao Mobility 길찾기 API
- **환경**
  - npm, pip, virtualenv, Git

---

## 📂 프로젝트 구조

| 폴더 / 파일          | 설명                                         |
|--------------------|--------------------------------------------|
| backend/            | Django 서버 코드                              |
| frontend/           | React 프론트엔드 코드 (UI, 캘린더, ToDo 관리) |
| node_modules/       | 프론트엔드 의존성 (gitignore 대상)           |
| manage.py            | Django 관리 파일                             |
| requirements.txt     | Python 패키지 목록                            |
| package.json         | 프론트엔드 패키지 정보                         |
| package-lock.json    | 프론트엔드 패키지 잠금 파일                    |
| README.md            | 프로젝트 설명 문서                            |

---

## ⚙️ 실행 방법

### 1. 저장소 클론
```bash
git clone https://github.com/jinhyn/ToDOCalender.git
cd ToDOCalender
```

### 2. 백엔드 실행 (Django)
```bash
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
```

### 3. 이동시간 경고 기능 설정

이 기능은 **Kakao Mobility REST API 키**를 백엔드에서 사용합니다. REST API 키는 브라우저에 노출하지 않고 Django 환경변수로만 설정합니다.

Windows PowerShell에서 Django 서버를 실행하기 전에:

```powershell
$env:KAKAO_REST_API_KEY="여기에_카카오_REST_API_키"
python manage.py runserver
```

기존 Django 서버가 실행 중이었다면 **환경변수를 설정한 뒤 서버를 다시 시작**해야 합니다.

REST API 키는 카카오디벨로퍼스에서 앱의 플랫폼 키를 통해 확인할 수 있습니다.

> 기존 Kakao Maps JavaScript 키와 REST API 키는 용도가 다릅니다. 이동시간 계산은 REST API 키가 필요합니다.

### 4. 프론트엔드 실행
```bash
cd frontend
npm install
npm run dev
```

---

## ✨ 주요 기능
- ✅ 할 일(ToDo) 등록 / 수정 / 삭제
- 📅 월 / 주 / 일 캘린더
- 🔄 일정 Drag & Drop / Resize
- 🏷️ 카테고리 생성 / 삭제 / 색상 / 순서 변경
- 📍 Kakao 장소 검색 및 지도 표시
- 💾 일정 위치명 저장 및 복원
- ⚠️ 연속 일정 간 이동시간 부족 경고
- 🔐 사용자별 일정 / 카테고리 데이터 격리

### 이동시간 경고 동작

시간순으로 바로 이어지는 두 일정의 위치가 다르면 이전 일정 종료 시각을 출발 시각으로 보고 예상 이동시간을 계산합니다.

```text
이전 일정 종료 ───────── 다음 일정 시작
       │                       │
       └── 이동 가능 시간 ──────┘

예상 이동시간 > 이동 가능 시간
             ↓
        ⚠️ 이동시간 부족
```

미래 일정은 해당 일정의 예정 출발 시각을 기준으로 미래 운행 정보 길찾기를 사용하고, 이미 지난 시각은 현재 길찾기 정보를 사용합니다. Kakao Mobility의 미래 운행 정보 API는 미래 출발 시각을 지정해 예상 이동시간을 계산할 수 있습니다.

---

## 📌 향후 개선 예정
- 이동수단 선택 (자동차 / 도보)
- 일정 사이 여유시간(Buffer) 설정
- 이동시간 경고의 상세 경로 보기
- 사용자별 알림 설정
- 클라우드 배포
