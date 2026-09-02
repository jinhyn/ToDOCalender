# ToDOCalender First User Validation Plan

## Goal

Validate whether travel-aware scheduling creates repeated value beyond a normal calendar.

The first study is intentionally small: **10–30 users** who regularly move between appointments, classes, meetings, hospitals, interviews, study sessions, exercise, or social plans.

## Core hypotheses

1. Users can create an ordinary schedule **without being forced to enter a place**, while understanding that a place is required for travel guidance.
2. Users understand the value of entering a place for schedules where movement matters.
3. Recommended departure time is more actionable than a generic travel-time warning.
4. A departure alert changes behavior before the next appointment.
5. Favorite locations and recurring schedules reduce enough repeated input to support weekly use.
6. Users can move existing calendar data through ICS without losing trust in their original calendar.

## Pre-test product review finding

Before recruiting users, the PM/UX review found that requiring a location for every schedule created unnecessary friction for schedules such as study blocks, reminders, online meetings, or personal tasks. The product was changed so that **location is optional**, and travel planning is activated only when consecutive schedules have usable coordinates.

This change should still be validated with real users rather than treated as a proven finding.

## Test scenarios

### Scenario A — first schedule without a place

1. Log in with Kakao.
2. Create a schedule from a calendar date.
3. Set title, category and time only.
4. Save the schedule and reopen it.

Success criteria:
- No tester asks where the date is chosen.
- Tester understands that location is optional.
- Schedule creation is not blocked by place search.
- Saved data is still present after refresh.

### Scenario B — first travel-aware schedule

1. Create another schedule and add a place.
2. Search for a place and select one result.
3. Save it as a favorite.
4. Reopen the schedule and remove the place again.

Success criteria:
- Tester understands why adding a place changes what the product can calculate.
- Place can be added, renamed, reused and removed without confusion.

### Scenario C — consecutive schedules

1. Create two upcoming schedules at different locations.
2. Leave enough time between them.
3. Confirm a recommended departure time appears even when there is no shortage warning.
4. Reduce the gap so travel time becomes insufficient.
5. Confirm the warning explains date/time, travel estimate, available time and shortage.

Success criteria:
- Tester can answer “when should I leave?” without calculation.
- Past schedules do not remain in the warning panel.

### Scenario D — repeated use

1. Save one location as a favorite.
2. Create a weekly recurring schedule four times.
3. Reuse the favorite location.
4. Search for the schedule by title/place/category.

Success criteria:
- Repeated entry feels faster than creating four schedules manually.
- A failed recurring request does not leave a partially created series.

### Scenario E — calendar portability

1. Export schedules to ICS.
2. Import a valid ICS file.
3. Import an ICS file containing one invalid event.

Success criteria:
- Valid import succeeds as one operation.
- Invalid import does not create a partially imported calendar.
- Imported place names without coordinates are not treated as routable locations until reselected.

### Scenario F — user control

1. Turn departure alerts on/off.
2. Review the privacy/data-handling explanation.
3. Test application-data deletion with a non-production test account.

Success criteria:
- Tester understands browser-open notification limitation.
- Tester understands app-data deletion is not Kakao account deletion.

### Scenario G — mobile usability

Run Scenarios A–D on a narrow mobile viewport or phone.

Check specifically:
- Header controls remain tappable.
- Calendar toolbar does not overflow.
- Schedule modal behaves like a bottom sheet and its save/cancel actions remain reachable.
- Time selectors fit without clipping.
- Location search results and map remain usable.
- Category controls do not overflow the viewport.

## Interview questions

Ask after tasks are completed, not before.

1. What part of the product felt meaningfully different from your current calendar?
2. For which schedules would you bother entering a location, and for which would you skip it?
3. Was entering a location worth the extra effort when travel guidance appeared? Why or why not?
4. Which was more useful: shortage warning or recommended departure time?
5. Would you enable departure notifications for real appointments?
6. Which repeated task felt most annoying?
7. What would stop you from using this next week?
8. If this disappeared tomorrow, what feature would you miss?

## Metrics to record

- Schedule creation completion rate with no location
- Schedule creation completion rate with a location
- Median time to create first schedule
- Place-selection failure rate
- Percentage of schedules for which testers choose to add a location
- Number of testers who understand recommended departure without explanation
- Departure-alert opt-in intention
- Recurring-schedule usage intention
- Week-1 return intent
- Actual 7-day return, when measurable
- Number and severity of defects discovered

## Decision rule

### GO

Continue investing in travel-aware scheduling if most testers understand the value and at least half of the target users say the recommended departure/alert would change how they plan or leave for appointments.

### MODIFY

Keep the concept but simplify UX if users value travel guidance yet avoid entering locations or struggle with schedule creation.

### HOLD / PIVOT

Do not add payment, AI or collaboration features if users do not return because of travel-aware value.

## Portfolio evidence to collect

- Before/after screenshots of tested UX changes
- Concrete defect examples found during QA
- Test count and CI results
- User-test findings summarized without personal data
- Product decisions made from evidence, including features deliberately not built
