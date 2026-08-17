# ToDOCalender

일정을 등록하고 관리하는 데서 끝나지 않고, **다음 일정까지 실제로 이동할 수 있는지 확인해주는 캘린더**를 만드는 것을 목표로 한 프로젝트입니다.

일정의 시작·종료 시간과 장소를 저장한 뒤, 시간순으로 이어지는 일정의 이동 가능 시간을 계산하고 예상 이동시간이 더 긴 경우 사용자에게 알려줍니다.

## 주요 기능

### 일정 관리

- 일정 추가 / 수정 / 삭제
- 시작 시간과 종료 시간 설정
- 월 / 주 / 일 단위 캘린더 보기
- Drag & Drop으로 일정 시간 변경
- 일정 크기 조절로 종료 시간 변경

### 카테고리

- 카테고리 추가 / 삭제
- 카테고리별 색상 설정
- 카테고리 필터링
- Drag & Drop으로 카테고리 순서 변경
- 변경된 순서 서버 저장

### 장소 관리

- Kakao Maps 장소 검색
- 검색한 장소를 일정에 저장
- 장소명과 좌표를 함께 저장
- 캘린더에서 일정의 위치 확인

### 이동시간 확인

이 프로젝트에서 가장 중요하게 생각한 기능입니다.

시간순으로 정렬된 일정에서 이전 일정과 다음 일정의 장소가 다르고, 이전 일정의 종료 시간이 정해져 있다면 두 일정 사이의 이동시간을 확인합니다.

```text
이전 일정
09:00 ~ 10:00
📍 서울역

        ↓ 이동 가능 시간 20분

다음 일정
10:20 ~ 11:00
📍 판교역

        ↓ 길찾기 API

예상 이동시간 35분

        ↓

⚠️ 이동시간 부족 (15분)
```

같은 장소인 경우에는 길찾기 API를 호출하지 않습니다. 일정 시간이 겹치는 경우에도 별도로 구분해서 처리합니다.

현재 이동시간은 Kakao Mobility 길찾기 API를 이용해 확인하고 있으며, 미래 일정은 예정된 출발 시각을 기준으로 미래 운행 정보를 요청하도록 구현했습니다.

## 기술 스택

| 구분 | 사용 기술 |
| --- | --- |
| Frontend | React, Vite, FullCalendar, Axios |
| Backend | Python, Django, Django REST Framework |
| Database | Django ORM 기반 DB |
| 인증 | Kakao Login |
| 지도 / 장소 검색 | Kakao Maps API |
| 길찾기 | Kakao Mobility API |
| 개발 환경 | VS Code, Git, npm, virtualenv |

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

> 현재 프론트엔드 디렉터리 이름은 저장소에 있는 `forntend`를 그대로 사용합니다.

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

REST API 키는 프론트엔드 코드에 넣지 않고 Django에서 환경변수로 사용합니다.

PowerShell:

```powershell
$env:KAKAO_REST_API_KEY="발급받은_REST_API_키"
python manage.py runserver
```

Kakao Maps에서 사용하는 JavaScript 키와 이동시간 계산에 사용하는 REST API 키는 서로 다른 용도입니다.

API 키는 GitHub에 커밋하지 않는 것을 권장합니다.

### 4. Frontend

새 터미널에서:

```powershell
cd forntend
npm install
npm run dev
```

개발 서버가 실행되면 Vite가 안내하는 `localhost` 주소로 접속합니다.

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

## 테스트

백엔드 테스트는 사용자 데이터 격리와 일정 검증, 카테고리 순서 변경, 이동시간 계산 로직을 중심으로 작성했습니다.

```powershell
cd backend\myserver
python -m unittest discover -s tests
```

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

## 현재 상태

현재 기본적인 캘린더 기능과 장소 저장, 카테고리 관리, 사용자별 데이터 분리까지 구현되어 있습니다.

이동시간 경고 기능은 백엔드 계산 로직과 프론트엔드 표시까지 연결했으며, Kakao Mobility API와의 실제 연동 결과를 확인하는 단계입니다.

## 앞으로 추가해볼 기능

- 이동수단 선택
- 일정 사이 여유시간 설정
- 이동시간 상세 정보 및 경로 확인
- 이동시간 부족 알림
- 이동시간 결과 캐싱을 통한 API 호출 감소
- 배포 환경 구성

## 참고

- [Kakao Developers](https://developers.kakao.com/)
- [Kakao Mobility Developers](https://developers.kakaomobility.com/)
