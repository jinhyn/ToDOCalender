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

| 폴더 / 파일 | 설명 |
|---|---|
| `backend/` | Django 서버 코드 |
| `forntend/` | React 프론트엔드 코드 (UI, 캘린더, ToDo 관리) |
| `node_modules/` | 프론트엔드 의존성 (gitignore 대상) |
| `manage.py` | Django 관리 파일 |
| `requirements.txt` | Python 패키지 목록 |
| `package.json` | 프론트엔드 패키지 정보 |
| `package-lock.json` | 프론트엔드 패키지 잠금 파일 |
| `README.md` | 프로젝트 설명 문서 |

---

## ⚙️ 실행 방법

### 1. 저장소 클론
```bash
git clone https://github.com/jinhyn/ToDOCalender.git
cd ToDOCalender
```

### 2. 백엔드 실행 (Django)
```bash
cd backend/myserver
python -m venv .venv
```

Windows PowerShell에서 가상환경을 활성화합니다.

```powershell
.venv\Scripts\Activate.ps1
```

패키지 설치 및 마이그레이션:

```powershell
pip install -r requirements.txt
python manage.py migrate
```

### 3. 이동시간 경고 기능 설정

이 기능은 **Kakao Mobility REST API**를 백엔드에서 사용합니다. REST API 키는 브라우저에 노출하지 않고 Django 환경변수로만 설정합니다.

Windows PowerShell에서 Django 서버를 실행하기 전에:

```powershell
$env:KAKAO_REST_API_KEY="여기에_카카오_REST_API_키"
python manage.py runserver
```

기존 Django 서버가 실행 중이었다면 **환경변수를 설정한 뒤 서버를 다시 시작**해야 합니다.

REST API 키는 카카오디벨로퍼스에서 사용하는 앱의 REST API 키를 설정합니다.

> 기존 Kakao Maps JavaScript 키와 REST API 키는 용도가 다릅니다. 지도/장소 검색과 이동시간 계산은 서로 다른 API 인증 정보를 사용합니다.
>
> **주의:** REST API 키는 Git에 커밋하거나 README, 프론트엔드 코드에 직접 작성하지 않습니다.

### 4. 프론트엔드 실행

새 터미널에서:

```bash
cd forntend
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

---

## ⚠️ 이동시간 경고 기능

ToDOCalender의 핵심 기능 중 하나로, **서로 다른 위치에 연속 일정이 등록되어 있을 때 실제 이동시간을 고려해 다음 일정까지 이동할 수 있는지 판단**합니다.

### 동작 프로세스

```text
사용자 일정
    ↓
시간순 정렬
    ↓
이전 일정의 종료시간 + 위치 확인
    ↓
다음 일정의 시작시간 + 위치 확인
    ↓
두 위치가 같은지 확인
    ├─ 같음 → 이동시간 API 호출 생략
    └─ 다름
         ↓
   Kakao Mobility 길찾기 API
         ↓
      예상 이동시간
         ↓
┌─────────────────────────────┐
│ 이동 가능 시간 = 다음 일정 시작 │
│              - 이전 일정 종료 │
└─────────────────────────────┘
         ↓
예상 이동시간 > 이동 가능 시간?
         ├─ 아니오 → 정상
         └─ 예   → ⚠️ 이동시간 부족
```

### 경고 정보

경고가 발생하면 다음 정보를 사용자에게 제공합니다.

- 이전 일정 / 다음 일정
- 이전 장소 / 다음 장소
- 예상 이동시간
- 실제 이동에 사용할 수 있는 시간
- 부족한 시간

일정 시간이 서로 겹치는 경우에는 이동시간 계산과 별도로 **일정 겹침(overlap)** 경고로 처리합니다.

### 미래 운행 정보

다음 일정으로 이동하기 위한 출발 시각이 미래인 경우에는 예정 출발 시각을 기준으로 미래 운행 정보 길찾기를 요청하고, 현재 또는 이미 지난 시각은 일반 길찾기를 사용합니다.

### API 호출 실패 처리

이동시간 API를 사용할 수 없는 상황에서도 캘린더의 기본 일정 관리 기능은 계속 사용할 수 있도록 이동시간 확인 실패를 별도로 처리합니다. 백엔드에서는 API 인증 오류, 네트워크 오류, 응답 형식 오류 등을 로그로 확인할 수 있도록 구성했습니다.

---

## 🧪 테스트

이동시간 기능은 외부 API에 대한 실제 호출과 별도로 핵심 계산 로직을 테스트할 수 있도록 구성했습니다.

현재 테스트 범위:

- 이동시간이 사용 가능한 시간보다 긴 경우 경고 생성
- 동일 위치인 경우 길찾기 API 호출 생략
- 이동시간 경고 API의 사용자별 데이터 격리
- 다른 사용자의 일정 / 카테고리 접근 방지
- 일정 종료시간이 시작시간보다 빠른 경우 검증
- 카테고리 순서 변경 및 데이터 검증
- 카테고리 삭제 시 기존 일정 보존 및 카테고리 연결 해제

백엔드 테스트 실행:

```powershell
python manage.py test
```

> Kakao Mobility API 자체의 응답은 외부 서비스 상태와 API 키 설정의 영향을 받으므로, 실제 연동 테스트와 단위 테스트를 구분합니다.

---

## 📌 향후 개선 예정

- 이동수단 선택 (자동차 / 도보)
- 일정 사이 여유시간(Buffer) 설정
- 이동시간 경고의 상세 경로 보기
- 사용자별 알림 설정
- 이동시간 API 결과 캐싱으로 불필요한 API 호출 감소
- 클라우드 배포
