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

### Existing reliability foundations

- Kakao authentication with server-side authenticated user mapping.
- User-owned Task and Category querysets.
- Cross-user update/delete protection.
- Cross-user category assignment protection.
- Category reorder validation and atomic bulk update.
- Start/end time validation.
- Travel-warning tests, including same-location API-call avoidance.
- PostgreSQL production deployment and environment-based secret configuration.

## Next product priorities

### P0 — before external user testing

1. **Initial data loading / failure UI**
   - Visible loading state while the backend wakes or data is fetched.
   - Retry action when schedule/category loading fails.
   - Avoid leaving the user with an unexplained empty calendar after an API failure.

2. **Regression verification for category editing**
   - Rename a category currently used by tasks.
   - Change only color.
   - Rename the active filter.
   - Reject duplicate names.
   - Delete an edited category and verify tasks remain unlinked rather than deleted.

3. **Mobile interaction QA**
   - Calendar toolbar and event readability.
   - Schedule modal scrolling.
   - Location-result scrolling and map interaction.
   - Category edit panel and drag interactions.

4. **Failure-path QA for external APIs**
   - Kakao Maps SDK unavailable.
   - Kakao Mobility timeout / quota / API failure.
   - Render cold-start delay.

### P1 — after initial QA

- Improve task save/delete feedback without relying only on browser alerts/confirm dialogs.
- Improve time-entry behavior so changing a start time can optionally preserve the event duration.
- Add empty states for first-time users.
- Add lightweight client-side analytics events for schedule creation and travel-warning interaction.

### HOLD until user validation

- AI schedule assistant.
- Automatic schedule optimization.
- Social/friend calendar features.
- Complex collaboration features.
- Payment implementation.

These features should only move forward after real users demonstrate repeated value from travel-aware schedule management.

## Early user research plan

Start with **10–30 real users**, not a large acquisition campaign.

Questions to validate:

1. How often do users have consecutive appointments at different places?
2. Have they been late because they underestimated travel time?
3. Are they willing to enter a place when creating a schedule?
4. Does a travel-time warning change their schedule or departure behavior?
5. Do they return to the app the following week?

Primary validation signal:

> Users return because travel-aware scheduling solves a problem their existing calendar does not solve well enough.

## Business hypothesis

A paid tier is intentionally **not** implemented before validating retention.

Possible future boundary:

- Free: calendar CRUD, categories, place registration, basic travel warnings.
- Paid hypothesis: departure alerts, richer traffic-aware planning, external calendar integration, advanced schedule analysis.

The first business question is therefore not "how much can we charge?" but **"does the travel-aware feature create repeated product preference?"**

## Portfolio talking points

This project demonstrates more than CRUD implementation:

- Defined a user problem around schedule feasibility rather than only calendar storage.
- Split Kakao Maps (place UX) and Kakao Mobility (server-side travel calculation) by responsibility.
- Kept REST API credentials on the backend while using the browser Maps SDK for UI interaction.
- Designed user-owned querysets and tests to protect multi-user data.
- Optimized external routing calls by skipping same-location pairs.
- Iterated UI after observing that search suggestions and place results created unnecessary duplication.
- Treated logs containing schedule/location information as a privacy concern before external release.
- Introduced product, UX, QA, security and business review criteria before continuing feature expansion.
