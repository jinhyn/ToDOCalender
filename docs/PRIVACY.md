# ToDOCalender Privacy & Data Handling

This document describes the data handling implemented in the current ToDOCalender project. It is a product-engineering summary for portfolio and pre-release review, not a substitute for a production legal/privacy policy.

## Data stored by the application

For an authenticated user, the application may store:

- application user mapping created from Kakao authentication
- schedule title
- schedule start/end time
- category name, color and order
- selected place name
- selected place coordinates
- user-saved favorite place name and coordinates

The application does not need a user's Kakao password and does not store it.

## Why the data is used

- schedule title/time: calendar display and schedule management
- category: organization/filtering
- place coordinates: map display and travel-time calculations
- place name: human-readable schedule/location UI
- favorite places: reduce repeated place entry
- authenticated user mapping: isolate one user's application data from another user's data

## External services

The deployed architecture uses external services for specific responsibilities:

- **Kakao Login** — authentication
- **Kakao Maps JavaScript SDK** — place search and map UI
- **Kakao Mobility** — travel-time estimation
- **Vercel** — frontend hosting
- **Render / PostgreSQL** — backend and database hosting

Secrets and Kakao Mobility REST credentials are kept in backend/deployment environment variables rather than committed to the frontend repository.

## Location data handling

Location coordinates are used to calculate travel feasibility between consecutive schedules. They are not intentionally emitted in application travel-warning logs.

The server avoids unnecessary routing requests when:

- the next schedule has already started
- the two schedules use the same coordinates
- schedule/location data is incomplete or invalid

## User isolation

Task, category and favorite-location API querysets are scoped to the authenticated user. Tests cover cross-user access restrictions for core data.

## User deletion

The product exposes an in-app **“내 앱 데이터 삭제”** action.

Deleting app data removes the application's mapped user record and owned application data through database cascade behavior, including schedules, categories and favorite places.

This action deletes **ToDOCalender application data only**. It does not claim to delete the user's Kakao account or Kakao-held information.

## Browser notifications

The current departure alert uses the browser Notification API and only schedules alerts while the web application remains open. The opt-in state is stored in browser local storage.

A future background-push implementation would require separate push-subscription data and a server scheduler; that data model is not implemented in the current version.

## Calendar import / export

ICS import reads the calendar file in the browser and sends parsed schedule records to the authenticated ToDOCalender API. Imported events may include a display place name but do not receive travel-calculation coordinates until the user selects a mapped place.

ICS export creates a calendar file from the user's schedules in the browser.

## Production-release checklist

Before a broad public launch:

- provide a production privacy policy and terms reviewed for the target jurisdiction
- add a real support/privacy contact channel
- document retention/backup deletion behavior for hosting providers
- verify all third-party API terms for the production use case
- review analytics events before enabling analytics
- review the additional privacy impact before implementing background push or live external-calendar synchronization
