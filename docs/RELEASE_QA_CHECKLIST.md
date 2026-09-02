# Release QA Checklist

Use this checklist before merging productization work to `main`.

## Authentication and data ownership

- [ ] Kakao login succeeds.
- [ ] Logout clears the app session state.
- [ ] A user cannot read/update/delete another user's tasks.
- [ ] A user cannot read/update/delete another user's categories or favorite locations.
- [ ] App-data deletion removes only the authenticated user's ToDOCalender data/account mapping.

## Schedule CRUD

- [ ] Create a schedule from a clicked calendar date.
- [ ] Edit title/time/category/place.
- [ ] Delete a schedule.
- [ ] Drag/drop changes start time and persists after refresh.
- [ ] Resize changes end time and persists after refresh.
- [ ] End earlier than start is rejected.
- [ ] Narrow/mobile modal remains scrollable and actionable.

## Recurring schedules

- [ ] Daily recurrence creates correct dates.
- [ ] Weekly recurrence creates correct dates.
- [ ] Monthly recurrence handles short months safely.
- [ ] Count below 2 or above 30 is rejected.
- [ ] Invalid base task creates zero occurrences.
- [ ] A failed request never leaves a partial series.

## Place and favorites

- [ ] Kakao place search returns selectable results.
- [ ] Selecting a place updates coordinates and label.
- [ ] Editing only the label preserves coordinates.
- [ ] Favorite location is saved for the current user.
- [ ] Favorite location can be reused and deleted.
- [ ] Same-location consecutive schedules skip routing.

## Travel plans and warnings

- [ ] Past next schedules are excluded.
- [ ] Distant schedules outside the calculation horizon do not trigger routing calls.
- [ ] Sufficient-gap travel still produces a recommended departure plan.
- [ ] Insufficient-gap travel produces a warning and recommended departure time.
- [ ] Overlapping schedules show overlap rather than a fake route time.
- [ ] Warning shows next schedule date/time.
- [ ] Production logs do not include task titles, place labels or coordinates.

## Departure notifications

- [ ] Permission prompt appears only after user action.
- [ ] Denied permission does not break the app.
- [ ] Toggle state persists locally.
- [ ] Alert is scheduled from travel plans, not only shortage warnings.
- [ ] UI states clearly that alerts require the web app to remain open.

## Search and daily summary

- [ ] Search matches title.
- [ ] Search matches place name.
- [ ] Search matches category.
- [ ] Empty search returns the normal calendar.
- [ ] No-results state is clear.
- [ ] Today count and next schedule are correct.
- [ ] Next recommended departure is correct when available.

## ICS portability

- [ ] Export produces a readable `.ics` file.
- [ ] Import accepts valid VEVENT entries.
- [ ] Import is limited to 100 events per request.
- [ ] If any imported event is invalid, zero events are created.
- [ ] Imported place labels without coordinates are not treated as routing coordinates.

## Failure paths

- [ ] Render cold-start loading state is visible.
- [ ] Initial API failure shows retry UI.
- [ ] Kakao Maps failure does not silently corrupt saved coordinates.
- [ ] Kakao Mobility timeout/quota failure does not block calendar CRUD.
- [ ] Save/delete failures give visible feedback.

## Automated release gate

Before merge:

```text
python manage.py check
python manage.py test
npm run build
```

Required result:

- Backend check: PASS
- Backend tests: PASS
- Frontend production build: PASS
- Vercel preview deployment: PASS

Only then merge to `main`.
