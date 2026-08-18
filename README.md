# ToDOCalender

**일정을 등록하는 것에서 끝나지 않고, 다음 일정까지 실제로 이동할 수 있는지 확인해주는 Full-stack 캘린더 서비스**입니다.

일정의 시작·종료 시간과 장소를 저장하고, 시간순으로 이어지는 일정 사이의 이동 가능 시간과 예상 이동시간을 비교해 이동시간이 부족한 경우 사용자에게 경고합니다.

또한 여러 사용자가 사용하는 서비스를 고려해 **사용자별 일정·카테고리 데이터 격리**를 백엔드에서 보장하도록 구현했습니다.

## 🔗 Live Demo

- Frontend: https://to-do-calender.vercel.app
- Backend API: https://todo-calendar-api-enw3.onrender.com

> Render Free 인스턴스는 일정 시간 요청이 없으면 sleep 상태가 될 수 있어 첫 요청이 느릴 수 있습니다.

---

## 주요 기능

### 1. 일정 관리

- 일정 추가 / 수정 / 삭제
- 시작 시간과 종료 시간 설정
- 월 / 주 / 일 단위 캘린더 보기
- Drag & Drop으로 일정 시간 변경
- 일정 크기 조절로 종료 시간 변경
- 시작 시간보다 종료 시간이 빠른 잘못된 일정 저장 차단

### 2. 카테고리 관리

- 카테고리 추가 / 수정 / 삭제
- 카테고리별 색상 설정
- 카테고리 필터링
- Drag & Drop으로 카테고리 순서 변경
- 변경된 순서를 서버에 저장

### 3. 장소 관리

- Kakao Maps 장소 검색
- 검색한 장소를 일정에 저장
- 장소명과 좌표를 함께 저장
- 캘린더에서 일정의 위치 확인

### 4. 이동시간 확인

이 프로젝트에서 가장 중요하게 생각한 기능입니다.

시간순으로 정렬된 일정에서 이전 일정과 다음 일정의 장소가 다르고, 이전 일정의 종료 시간이 정해져 있다면 두 일정 사이의 이동 가능 시간을 계산합니다.

```text
이전 일정
09:00 ~ 10:00
📍 서울역

        ↓ 이동 가능 시간 20분

다음 일정
10:20 ~ 11:00
📍 판교역

        ↓ Kakao Mobility 길찾기 API

예상 이동시간 35분

        ↓

⚠️ 이동시간 부족 (15분)
```

같은 장소인 경우에는 불필요한 길찾기 API 호출을 생략하고, 일정 시간이 겹치는 경우도 별도로 처리합니다.

미래 일정은 이전 일정의 종료 시각을 예정 출발 시각으로 사용해 해당 시점에 가까운 이동시간을 계산하도록 구현했습니다.

---

## 기술적 의사결정

### 왜 이동시간을 서버에서 계산했는가?

외부 API 호출과 REST API Key 관리를 위해 이동시간 계산은 Django 백엔드에서 담당했습니다.

프론트엔드는 이동시간 경고 API를 호출하고, 백엔드에서 다음 작업을 수행합니다.

1. 사용자의 일정 조회
2. 시간순 정렬
3. 인접한 일정의 장소 비교
4. 이동 가능 시간 계산
5. Kakao Mobility API를 통한 예상 이동시간 조회
6. 이동시간 부족 여부 판단

이를 통해 외부 API Key가 프론트엔드 코드에 노출되지 않도록 했습니다.

### 왜 Kakao Maps와 Kakao Mobility를 분리했는가?

두 API의 역할을 명확하게 분리했습니다.

- **Kakao Maps**: 장소 검색 및 지도 표시
- **Kakao Mobility**: 실제 이동시간 계산

장소 검색·지도 UI와 이동시간 계산 로직을 분리해 각각의 책임이 명확하도록 구성했습니다.

### 왜 `location`과 `location_name`을 따로 저장했는가?

사용자가 화면에서 확인할 장소명과 지도·길찾기에 필요한 좌표는 용도가 다릅니다.

따라서 다음과 같이 분리했습니다.

```text
location
→ 위도(latitude) / 경도(longitude)
→ 지도 및 이동시간 계산에 사용

location_name
→ 사용자가 검색한 장소명
→ 캘린더 UI에 표시
```

이를 통해 표시용 데이터와 계산용 데이터를 명확하게 구분했습니다.

### 왜 사용자 기준 QuerySet으로 접근을 제한했는가?

단순히 프론트엔드에서 다른 사용자의 데이터를 숨기는 것만으로는 데이터 보호가 되지 않는다고 판단했습니다.

Task와 Category에 사용자를 연결하고, Django REST Framework의 조회·수정·삭제 대상 QuerySet을 현재 로그인한 사용자 기준으로 제한했습니다.

```text
Request
  ↓
Authenticated User
  ↓
User-owned QuerySet
  ↓
해당 사용자의 데이터만 조회 / 수정 / 삭제
```

따라서 다른 사용자의 ID를 직접 요청하더라도 백엔드에서 해당 객체에 접근할 수 없도록 했습니다.

### 왜 카테고리 reorder를 별도 API로 만들었는가?

카테고리 순서 변경은 하나의 카테고리만 수정하는 작업이 아니라 여러 카테고리의 `order` 값을 함께 변경하는 작업입니다.

그래서 다음 API를 별도로 구성했습니다.

```text
PATCH /api/categories/reorder/
```

서버에서는 요청에 포함된 카테고리가 모두 현재 사용자의 것인지 확인하고, 전달된 순서 데이터가 유효한지 검증합니다.

### 왜 `bulk_update`를 사용했는가?

카테고리 순서 변경 시 여러 객체의 `order` 값을 변경해야 하기 때문에 각각 `save()`를 호출하는 대신 `bulk_update()`를 사용했습니다.

또한 전체 순서 변경을 하나의 transaction으로 처리해 중간에 오류가 발생했을 때 일부 카테고리만 변경되는 상황을 방지했습니다.

### 왜 동일 장소에서는 길찾기 API 호출을 생략했는가?

이전 일정과 다음 일정의 좌표가 같다면 실제 이동시간을 계산할 필요가 없습니다.

따라서 동일 장소인 경우 외부 길찾기 API 호출을 생략합니다.

이를 통해 불필요한 API 호출을 줄이고, 실제 이동시간 계산이 필요한 일정 쌍에 대해서만 외부 API를 사용하도록 했습니다.

---

## 시스템 구조

```text
┌──────────────────────────────┐
│          React / Vite        │
│                              │
│ FullCalendar / Axios         │
│ Kakao Maps JavaScript SDK    │
└──────────────┬───────────────┘
               │ HTTPS / REST API
               ▼
┌──────────────────────────────┐
│       Django REST API        │
│                              │
│ Authentication               │
│ User Data Isolation          │
│ Task / Category CRUD         │
│ Travel Warning Logic         │
└───────┬──────────────┬───────┘
        │              │
        ▼              ▼
┌───────────────┐  ┌────────────────────┐
│ PostgreSQL    │  │ Kakao Mobility API │
│               │  │                    │
│ User          │  │ Future Directions  │
│ Task          │  │ 이동시간 계산       │
│ Category      │  └────────────────────┘
└───────────────┘
```

### 배포 구조

```text
                         ┌──────────────────────┐
                         │        Vercel        │
                         │   React / Vite App   │
                         └──────────┬───────────┘
                                    │
                              HTTPS / REST
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │        Render        │
                         │ Django / DRF API    │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │      PostgreSQL      │
                         └──────────────────────┘
```

---

## 기술 스택

| 구분 | 사용 기술 |
| --- | --- |
| Frontend | React, Vite, FullCalendar, Axios |
| Backend | Python, Django, Django REST Framework |
| Database | PostgreSQL, Django ORM |
| 인증 | Kakao Login |
| 지도 / 장소 검색 | Kakao Maps API |
| 길찾기 | Kakao Mobility API |
| Frontend 배포 | Vercel |
| Backend / DB 배포 | Render |
| CI | GitHub Actions |
| 개발 환경 | VS Code, Git, npm, virtualenv |

---

## 프로젝트 구조

```text
ToDOCalender/
├── backend/
│   ├── requirements.txt
│   ├── .env.example
│   └── myserver/
│       ├── todo/
│       │   ├── models.py
│       │   ├── serializers.py
│       │   ├── views.py
│       │   ├── travel.py
│       │   └── tests.py
│       └── manage.py
│
├── frontend/
│   ├── .env.example
│   └── src/
│       ├── components/
│       ├── hooks/
│       ├── services/
│       └── App.jsx
│
├── render.yaml
└── README.md
```

---

## 데이터 구조

사용자마다 일정과 카테고리를 별도로 관리합니다.

```text
User
 ├── Categories
 │    ├── name
 │    ├── color
 │    └── order
 │
 └── Tasks
      ├── title
      ├── date
      ├── end
      ├── category
      ├── location
      └── location_name
```

일정과 카테고리는 로그인한 사용자의 데이터만 조회할 수 있도록 백엔드에서 사용자 기준으로 QuerySet을 제한합니다.

카테고리를 삭제하더라도 기존 일정은 삭제하지 않고 카테고리 연결만 해제하도록 처리했습니다.

---

## 실행 방법

### 1. 저장소 받기

```bash
git clone https://github.com/jinhyn/ToDOCalender.git
cd ToDOCalender
```

### 2. Backend

```powershell
cd backend\myserver
python -m venv .venv
.venv\Scripts\activate
pip install -r ..\requirements.txt
python manage.py migrate
python manage.py runserver
```

### 3. Backend 환경변수

`backend/.env.example`을 참고해 환경변수를 설정합니다.

PowerShell 예시:

```powershell
$env:DJANGO_SECRET_KEY="개발용-비밀키"
$env:DJANGO_DEBUG="True"
$env:DJANGO_ALLOWED_HOSTS="localhost,127.0.0.1"
$env:CORS_ALLOWED_ORIGINS="http://localhost:5173"
$env:KAKAO_REST_API_KEY="발급받은_REST_API_키"
```

### 4. Frontend

`frontend/.env.example`을 참고해 환경변수를 설정합니다.

```powershell
cd frontend
npm install
npm run dev
```

예시:

```text
VITE_API_BASE_URL=http://localhost:8000/api/
VITE_KAKAO_APP_KEY=발급받은_카카오_JavaScript_키
```

API Key와 Secret은 GitHub에 커밋하지 않는 것을 권장합니다.

---

## 배포

현재 실제 배포 환경에서 동작을 확인했습니다.

### Backend — Render

- Django REST API
- PostgreSQL 연동
- `collectstatic` 및 migration 자동 실행
- Gunicorn을 통한 production server 실행
- CORS / CSRF 허용 도메인 설정
- 환경변수를 통한 Secret / API Key 관리

배포 시 주요 환경변수:

- `DJANGO_SECRET_KEY`
- `DJANGO_DEBUG=False`
- `DJANGO_ALLOWED_HOSTS`
- `DATABASE_URL`
- `KAKAO_REST_API_KEY`
- `CORS_ALLOWED_ORIGINS`
- `CSRF_TRUSTED_ORIGINS`

### Frontend — Vercel

`frontend` 디렉터리를 프로젝트 루트로 사용합니다.

주요 환경변수:

- `VITE_API_BASE_URL`: 배포된 Django API 주소
- `VITE_KAKAO_APP_KEY`: Kakao JavaScript 앱 키

배포 후 Kakao Developers에 실제 Vercel 도메인을 등록하고 Kakao Login Redirect URI도 배포 환경에 맞게 설정했습니다.

---

## 테스트

백엔드 테스트는 사용자 데이터 격리와 일정 검증, 카테고리 순서 변경, 이동시간 계산 로직을 중심으로 작성했습니다.

```powershell
cd backend\myserver
python manage.py test
```

현재 **13개의 백엔드 테스트가 통과**합니다.

주요 테스트 범위:

- 사용자별 일정 조회 제한
- 사용자별 카테고리 조회 제한
- 다른 사용자의 일정 / 카테고리 수정 및 삭제 방지
- 다른 사용자의 카테고리를 일정에 연결하는 요청 차단
- 일정 종료 시간이 시작 시간보다 빠른 경우 차단
- 카테고리 순서 변경 검증
- 카테고리 삭제 시 일정 유지
- 이동시간이 부족한 경우 경고 계산
- 같은 장소에서는 길찾기 API를 호출하지 않는지 확인

### Production Build

Frontend production build도 확인했습니다.

```powershell
cd frontend
npm run build
```

Vite production build가 정상적으로 완료되며, bundle size에 대한 Vite warning은 있지만 build 자체는 성공합니다.

---

## CI

GitHub Actions를 이용해 Backend와 Frontend를 자동으로 확인합니다.

- Backend: `python manage.py check`, `python manage.py test`
- Frontend: `npm ci`, `npm run build`

주요 브랜치에 Push 및 Pull Request가 발생하면 CI가 실행되도록 구성했습니다.

---

## 배포 환경 검증

실제 배포된 서비스에서 다음 기능을 직접 검증했습니다.

- [x] 일정 생성
- [x] 일정 조회
- [x] 일정 수정
- [x] 일정 삭제
- [x] 카테고리 생성 / 수정 / 삭제
- [x] 카테고리 순서 변경
- [x] 장소 검색
- [x] Kakao 지도 표시
- [x] 일정에 장소 저장
- [x] 새로고침 후 데이터 유지
- [x] 이동시간 부족 경고
- [x] Frontend → Backend REST API 통신
- [x] PostgreSQL 데이터 저장 및 조회

---

## 개발 과정에서 해결한 문제

### 1. 사용자 데이터 격리

처음에는 단순 CRUD가 동작하는 것보다 실제 여러 사용자가 사용할 수 있는 구조를 만드는 것이 중요하다고 판단했습니다.

따라서 백엔드에서 모든 Task / Category 접근을 현재 인증된 사용자 기준으로 제한하고, 다른 사용자의 객체 ID를 직접 전달하는 경우에도 접근할 수 없도록 검증했습니다.

### 2. 이동시간 계산의 서버 책임 분리

이동시간 계산에는 외부 API 호출과 API Key가 필요하기 때문에 프론트엔드에서 직접 처리하지 않고 Django 백엔드에서 담당하도록 설계했습니다.

그 결과 프론트엔드는 UI와 사용자 입력에 집중하고, 백엔드는 외부 API 연동과 이동시간 판단을 담당하도록 역할을 분리했습니다.

### 3. 배포 환경 차이로 인한 설정 문제

로컬 환경에서는 정상적으로 동작하더라도 production 환경에서는 CORS, CSRF, DATABASE URL, static files 등의 설정이 달라질 수 있었습니다.

Render와 Vercel의 실제 배포 환경에서 환경변수를 분리하고, 허용 도메인을 production URL에 맞게 설정하면서 배포 환경에서도 API 통신과 데이터 저장이 정상적으로 동작하도록 구성했습니다.

---

## 앞으로 개선할 기능

- 이동수단 선택
- 일정 사이 여유시간 설정
- 이동시간 상세 정보 및 경로 확인
- 이동시간 부족 알림
- 이동시간 결과 캐싱을 통한 외부 API 호출 감소
- Frontend 입력 단계에서 일정 시간 유효성 사전 검증
- 대용량 일정 데이터에 대한 조회 최적화

---

## 참고

- Kakao Developers: https://developers.kakao.com/
- Kakao Mobility Developers: https://developers.kakaomobility.com/
