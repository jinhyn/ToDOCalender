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

## 기술적 의사결정

### 이동시간 계산을 서버에서 처리

외부 API 호출과 API Key 관리를 위해 이동시간 계산은 Django 백엔드에서 담당했습니다. 프론트엔드는 이동시간 경고 API만 호출하고, 백엔드에서 일정 사이의 이동 가능 시간과 Kakao Mobility의 예상 이동시간을 비교합니다.

API Key를 프론트엔드 코드에 넣지 않고 서버에서 관리할 수 있다는 점도 고려했습니다.

### Kakao Maps와 Kakao Mobility 분리

Kakao Maps는 장소 검색과 지도 표시, Kakao Mobility는 실제 이동시간 계산에 사용했습니다.

장소를 찾고 보여주는 기능과 이동시간을 계산하는 기능의 역할을 나누어, 지도 UI와 이동시간 계산 로직이 서로 강하게 연결되지 않도록 했습니다.

### 장소명과 좌표를 분리해서 저장

사용자가 확인할 장소명과 지도 및 길찾기에 필요한 좌표를 별도로 저장했습니다.

캘린더에서는 장소명을 보여주고, 지도와 이동시간 계산에서는 좌표를 사용할 수 있도록 하기 위한 구조입니다.

### 사용자 기준으로 데이터 접근 제한

여러 사용자가 사용하는 서비스를 고려하면서 다른 사용자의 일정이나 카테고리에 접근할 수 없어야 한다고 판단했습니다.

Task와 Category에 사용자를 연결하고 API의 QuerySet을 현재 로그인한 사용자 기준으로 제한했습니다. 프론트엔드에서 데이터를 숨기는 것이 아니라 백엔드에서 다른 사용자의 데이터 접근 자체를 막도록 했습니다.

### 카테고리 순서 변경을 별도의 API로 처리

카테고리 순서 변경은 하나의 카테고리만 수정하는 작업이 아니라 여러 카테고리의 순서를 한 번에 바꾸는 작업입니다.

그래서 `PATCH /api/categories/reorder/` API를 별도로 만들고, 요청에 포함된 카테고리가 모두 현재 사용자의 것인지와 순서 데이터가 올바른지를 서버에서 확인하도록 했습니다.

### `bulk_update`와 `transaction` 사용

카테고리 순서를 변경할 때 여러 개의 카테고리를 수정해야 하기 때문에 각각 `save()`를 호출하는 대신 `bulk_update()`를 사용했습니다.

또한 전체 순서 변경을 하나의 트랜잭션으로 처리해 중간에 오류가 발생했을 때 일부 카테고리의 순서만 바뀌는 상황을 방지했습니다.

### 동일 장소에서는 길찾기 API 호출 생략

이전 일정과 다음 일정의 좌표가 같다면 이동시간을 계산할 필요가 없기 때문에 길찾기 API를 호출하지 않도록 했습니다.

불필요한 외부 API 호출을 줄이고 실제 이동시간 계산이 필요한 일정 쌍에 대해서만 API를 사용하기 위한 처리입니다.

### 미래 일정은 예정 출발시간을 기준으로 계산

단순히 현재 시점의 이동시간을 사용하는 대신 이전 일정의 종료 시간을 예정된 출발 시각으로 사용했습니다.

미래 시점의 일정은 Kakao Mobility Future Directions API를 사용해 실제 이동 예정 시점에 가까운 예상 이동시간을 기준으로 다음 일정에 늦을 가능성을 판단하도록 했습니다.

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
├── frontend/
│   └── src/
│       ├── components/
│       ├── hooks/
│       ├── services/
│       └── App.jsx
│
└── README.md
```

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
cd frontend
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
python manage.py test
```

현재 13개의 백엔드 테스트가 작성되어 있으며, 주요 테스트 범위는 다음과 같습니다.

- 사용자별 일정 조회 제한
- 사용자별 카테고리 조회 제한
- 다른 사용자의 일정 / 카테고리 수정 및 삭제 방지
- 다른 사용자의 카테고리를 일정에 연결하는 요청 차단
- 일정 종료 시간이 시작 시간보다 빠른 경우 차단
- 카테고리 순서 변경 검증
- 카테고리 삭제 시 일정 유지
- 이동시간이 부족한 경우 경고 계산
- 같은 장소에서는 길찾기 API를 호출하지 않는지 확인

## CI

GitHub Actions를 이용해 Backend와 Frontend를 각각 확인합니다.

- Backend: `python manage.py check`, `python manage.py test`
- Frontend: `npm ci`, `npm run build`

Pull Request와 `main`, `fix/**` 브랜치에 Push가 발생하면 자동으로 실행됩니다.

## 현재 상태

현재 기본적인 캘린더 기능과 장소 저장, 카테고리 관리, 사용자별 데이터 분리, 이동시간 경고 기능까지 구현되어 있습니다.

백엔드 테스트 13개가 통과하고 있으며, Frontend production build와 GitHub Actions CI도 구성되어 있습니다.

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
