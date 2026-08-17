# ToDOCalender

일정을 등록하고 관리할 때, 다음 일정으로 이동할 시간이 충분한지도 같이 확인할 수 있도록 만든 캘린더입니다.

일정마다 시작·종료 시간과 장소를 저장하고, 시간순으로 이어지는 일정의 이동 가능 시간과 예상 이동시간을 비교합니다.

## 기능

### 일정

- 일정 추가 / 수정 / 삭제
- 시작 시간, 종료 시간 설정
- 월 / 주 / 일 보기
- Drag & Drop으로 일정 시간 변경
- Resize로 일정 종료 시간 변경

### 카테고리

- 카테고리 추가 / 삭제
- 카테고리 색상 설정
- 카테고리별 일정 필터링
- Drag & Drop으로 순서 변경
- 변경된 순서 저장

### 장소

- Kakao Maps 장소 검색
- 일정에 장소 저장
- 장소명과 좌표 저장
- 캘린더에서 일정 위치 표시

### 이동시간 확인

두 일정이 시간순으로 이어지고 장소가 다르면 이전 일정이 끝난 시점부터 다음 일정이 시작되기 전까지 이동할 수 있는 시간을 계산합니다.

예상 이동시간이 실제로 이동할 수 있는 시간보다 길면 다음 일정에 이동시간 부족 경고를 표시합니다.

```text
09:00 ~ 10:00
서울역

        20분
        ↓

10:20 ~ 11:00
판교역

예상 이동시간: 35분
이동 가능 시간: 20분

→ 15분 부족
```

같은 장소의 연속 일정은 길찾기 요청을 하지 않고, 일정이 겹치는 경우는 이동시간 부족과 별도로 처리합니다.

현재 이동시간 계산에는 Kakao Mobility 길찾기 API를 사용합니다. 미래 출발 시각이 있는 일정은 해당 시각을 기준으로 미래 운행 정보를 요청하도록 구현했습니다.

## 기술 스택

| 구분 | 기술 |
| --- | --- |
| Frontend | React, Vite, FullCalendar, Axios |
| Backend | Python, Django, Django REST Framework |
| Database | Django ORM 기반 DB |
| 인증 | Kakao Login |
| 지도 / 장소 검색 | Kakao Maps API |
| 길찾기 | Kakao Mobility API |

## 프로젝트 구조

```text
ToDOCalender/
├── backend/
│   └── myserver/
│       ├── todo/
│       │   ├── models.py
│       │   ├── serializers.py
│       │   ├── views.py
│       │   ├── travel.py
│       │   └── tests.py
│       └── manage.py
│
├── forntend/
│   └── src/
│       ├── components/
│       ├── hooks/
│       ├── services/
│       └── App.jsx
│
└── README.md
```

현재 프론트엔드 디렉터리 이름은 저장소의 `forntend`를 그대로 사용합니다.

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
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### 3. Kakao Mobility API 설정

이동시간 기능을 사용하려면 Kakao Mobility REST API 키가 필요합니다.

키는 프론트엔드에 넣지 않고 Django에서 환경변수로 사용합니다.

```powershell
$env:KAKAO_REST_API_KEY="발급받은_REST_API_키"
python manage.py runserver
```

Kakao Maps JavaScript 키와 Kakao Mobility REST API 키는 별도로 사용합니다.

REST API 키는 GitHub에 커밋하지 않는 것을 권장합니다.

### 4. Frontend

새 터미널에서:

```powershell
cd forntend
npm install
npm run dev
```

실행 후 Vite가 안내하는 `localhost` 주소로 접속합니다.

## 데이터 구조

```text
User
├── Categories
│   ├── name
│   ├── color
│   └── order
│
└── Tasks
    ├── title
    ├── date
    ├── end
    ├── category
    ├── location
    └── location_name
```

일정과 카테고리는 로그인한 사용자 기준으로 조회합니다. 다른 사용자의 데이터는 수정하거나 삭제할 수 없도록 백엔드에서 제한합니다.

카테고리를 삭제해도 일정은 삭제하지 않고 카테고리 연결만 해제합니다.

## 테스트

백엔드에는 다음 내용을 중심으로 테스트를 작성했습니다.

- 사용자별 일정 / 카테고리 조회 제한
- 다른 사용자의 일정 / 카테고리 수정 및 삭제 방지
- 다른 사용자의 카테고리 연결 방지
- 일정 종료 시간이 시작 시간보다 빠른 경우 차단
- 카테고리 순서 변경
- 카테고리 삭제 후 일정 유지
- 이동시간 부족 계산
- 같은 장소에서 길찾기 API를 호출하지 않는지 확인

테스트 실행:

```powershell
cd backend\myserver
python -m unittest discover -s tests
```

## 현재 상태

캘린더, 일정 관리, 카테고리, 장소 검색 및 저장, 사용자별 데이터 분리 기능을 구현했습니다.

이동시간 경고 기능은 백엔드 계산 로직과 프론트엔드 표시까지 연결되어 있으며, 현재 Kakao Mobility API의 실제 응답을 확인하며 연동을 점검하고 있습니다.

## 다음 작업

- 이동시간 API 연동 안정화
- 이동수단 선택
- 일정 사이 여유시간 설정
- 이동시간 상세 정보 표시
- 이동시간 결과 캐싱
- 배포 환경 구성

## 참고

- [Kakao Developers](https://developers.kakao.com/)
- [Kakao Mobility Developers](https://developers.kakaomobility.com/)
