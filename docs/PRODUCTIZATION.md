# ToDOCalender Productization

## Product vision

ToDOCalender is not positioned as another calendar that only stores events. Its core value is helping users answer a practical question before the next appointment:

> **Can I actually get from the previous schedule to the next one in time?**

The product combines schedule time, place coordinates and travel-time estimates to surface actionable warnings before a user runs out of time.

## North Star

**Help users recognize schedule-to-schedule travel risk before it becomes lateness.**

New features are prioritized by whether they strengthen this value, reduce friction in creating schedules, or improve reliability and trust.

## Product roles / agent review model

The project is reviewed from multiple product perspectives before major features are added.

| Role | Responsibility |
| --- | --- |
| CEO / Product Strategy | Product vision, final priority, GO / HOLD / DROP decisions |
| PM | Problem definition, roadmap, scope and priority |
| UX/UI | Schedule creation flow, location search, warnings, mobile usability |
| Tech Lead | Architecture, API design, technical debt, performance |
| QA | Happy path, failure path and regression scenarios |
| Security / Privacy | Authentication, user isolation, API keys, location-data handling and logs |
| Data / AI | Event instrumentation and future AI opportunities without unnecessary AI adoption |
| Business Model | Free/paid boundary and willingness-to-pay hypotheses |
| Growth / User Research | Early-user interviews, retention signals and product validation |

## Productization Sprint 01

### Completed

- **Location search simplification**
  - Removed the separate related-search UI after UX review.
  - Search now focuses on actual Kakao place results that can be selected and stored.
  - Removed unused related-search state and transformation logic from the map hook.

- **Category editing**
  - Added category name and color editing from the category chip menu.
  - Added duplicate-name validation on the client.
  - Connected the editor to the existing DRF category partial-update API.
  - Preserves the active category filter when a filtered category is renamed.

- **Privacy-oriented logging cleanup**
  - Removed production warning logs containing schedule title, date, coordinate and location-name values.
  - Travel-warning logs now keep only aggregate task/warning counts.

- **Loading, failure and first-use states**
  - Added a visible initial-loading state for backend cold starts and normal data fetches.
  - Added a retry action when task/category loading fails.
  - Added a first-user empty state with a direct "add first schedule" action.
  - Prevents API failures from looking like a legitimate empty calendar.

### Existing reliability foundations

- Kakao authentication with server-side authenticated user mapping.
- User-owned Task and Category querysets.
- Cross-user update/delete protection.
- Cross-user category assignment protection.
- Category reorder validation and atomic bulk update.
- Start/end time validation.
- Travel-warning tests, including same-location API-call avoidance.
- PostgreSQL production deployment and environment-based secret configuration.

## Productization Sprint 02

Sprint 02 focused on the point where the app becomes useful repeatedly rather than only demonstrating CRUD.

### CEO / PM decisions

- **GO:** recommended departure time, recurring schedules, search, daily summary and frequently used places.
- **GO with constrained scope:** browser departure alerts and ICS calendar exchange.
- **HOLD:** background push, live Google/Apple/Outlook synchronization and unsupported transport APIs until infrastructure/API contracts are ready.
- **DROP for now:** social features, collaboration and payment before retention is validated.

### Shipped in the sprint branch

- **Recommended departure time**
  - Travel warnings now return the next schedule start time and the recommended time to leave.
  - Past schedules are excluded before route requests are made.
  - The warning UI tells the user not only that time is insufficient, but when departure is recommended.

- **Browser departure alert**
  - Users can opt in to browser notification permission.
  - When the app remains open, the client schedules a notification at the recommended departure time.
  - Product copy explicitly states this limitation instead of presenting it as background push.

- **Recurring schedules**
  - New schedules can be materialized daily, weekly or monthly.
  - Up to 30 occurrences are generated.
  - Monthly recurrence clamps dates safely when a month has fewer days.
  - The MVP stores occurrences as independent tasks, so each can be edited/deleted individually.

- **Daily overview and search**
  - Shows today's schedule count, upcoming travel-risk count and next schedule.
  - Search matches schedule title, place and category.
  - Empty-search state explains why the calendar is empty.

- **Favorite locations**
  - Frequently used places can be saved and reused from the schedule editor.
  - Favorites are stored in PostgreSQL and isolated by authenticated user.
  - Coordinates are validated and returned as structured location data.

- **Calendar portability**
  - ICS export allows users to take their schedules to other calendar products.
  - ICS import supports a practical first migration path from Google/Apple/Outlook exports.
  - Imported events without coordinates intentionally do not participate in travel calculations until a place is selected in ToDOCalender.

- **User data control**
  - Added an account-data endpoint and in-product delete action.
  - Deleting app data removes the mapped application user and cascades owned schedules, categories and favorite locations.
  - This does not claim to delete the user's Kakao account.

### QA / Reliability review

The sprint is CI-gated instead of being pushed directly to production.

- Django system check passes.
- Backend automated tests cover user isolation, favorite locations, account deletion, task search, past-warning exclusion and recommended departure calculation.
- Frontend production build passes in GitHub Actions.
- Vercel preview deployment passes before merge.

A regression found by CI in FavoriteLocation coordinate serialization was fixed by exposing a structured JSON serializer field while persisting coordinates safely in the existing model field. This is intentionally documented as part of the QA story rather than hidden.

### Security / Privacy review

- Favorite locations use authenticated user-scoped querysets.
- Task search never expands access outside the authenticated user's data.
- Travel warning calculation intentionally ignores the optional search query so filtering the UI cannot change safety calculations.
- Route logs do not include raw coordinates or schedule titles.
- A data deletion path is available before inviting external users.
- See `docs/PRIVACY.md` for the project-level data handling summary.

## Deliberately deferred product gaps

These are not presented as implemented features:

1. **True background push notifications**
   - Requires Service Worker, Push subscriptions and a server-side scheduler/worker.
   - The current browser alert is app-open only.

2. **Live external calendar synchronization**
   - Current integration is ICS import/export.
   - OAuth-based two-way sync requires provider-specific authorization, conflict resolution and sync state.

3. **Walking / bicycle / public-transit routing**
   - Car routing is the supported default in the current product.
   - Additional Kakao Mobility walking/bicycle APIs require partnership approval; public-transit routing requires a separately verified provider/API path.

4. **Series-aware recurring-event editing**
   - Current recurring events are materialized individual tasks.
   - “this event / this and following / entire series” semantics require a series model and migration.

5. **Cross-device notification preferences**
   - Browser alert preference currently lives in local storage.
   - Server-synced preferences should be added when real background push is implemented.

6. **Analytics instrumentation**
   - Before broad acquisition, add privacy-minimized events for schedule creation, warning exposure, departure-alert opt-in and week-over-week return.

## External user validation plan

Start with **10–30 real users**, not a large acquisition campaign.

Questions to validate:

1. How often do users have consecutive appointments at different places?
2. Have they been late because they underestimated travel time?
3. Are they willing to enter a place when creating a schedule?
4. Does a recommended departure time change their behavior?
5. Do recurring schedules and favorite places reduce setup friction enough to create weekly reuse?
6. Do they return the following week?

Primary validation signal:

> Users return because travel-aware scheduling solves a problem their existing calendar does not solve well enough.

## Business hypothesis

A paid tier is intentionally **not** implemented before validating retention.

Possible future boundary:

- Free: calendar CRUD, categories, place registration, basic travel warnings, recurring schedules and portability.
- Paid hypothesis: reliable background departure alerts, richer traffic-aware planning, live external-calendar sync and advanced schedule analysis.

The first business question is therefore not "how much can we charge?" but **"does the travel-aware feature create repeated product preference?"**

## Portfolio talking points

This project demonstrates more than CRUD implementation:

- Defined a user problem around schedule feasibility rather than only calendar storage.
- Split Kakao Maps (place UX) and Kakao Mobility (server-side travel calculation) by responsibility.
- Kept REST API credentials on the backend while using the browser Maps SDK for UI interaction.
- Designed user-owned querysets and tests to protect multi-user data.
- Optimized external routing calls by skipping same-location and already-past schedule pairs.
- Evolved a warning from “time is insufficient” into an actionable recommended departure time.
- Iterated location and time-entry UX after observing duplicate or redundant controls.
- Added recurring schedules, favorite locations and calendar portability to reduce switching/setup cost for real users.
- Treated logs and data deletion as product requirements, not post-launch cleanup.
- Used CI failures to catch and fix coordinate-serialization behavior before production merge.
- Explicitly separated reliable MVP implementations from features that require background infrastructure, OAuth sync or third-party partnership approval.
