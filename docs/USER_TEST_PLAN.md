# ToDOCalender First User Validation Plan

## Goal

Validate whether travel-aware scheduling creates repeated value beyond a normal calendar.

The first study is intentionally small: **10–30 users** who regularly move between appointments, classes, meetings, hospitals, interviews, study sessions, exercise, or social plans.

## Core hypotheses

1. Users understand the value of entering a place when creating a schedule.
2. Recommended departure time is more actionable than a generic travel-time warning.
3. A departure alert changes behavior before the next appointment.
4. Favorite locations and recurring schedules reduce enough repeated input to support weekly use.
5. Users can move existing calendar data through ICS without losing trust in their original calendar.

## Test scenarios

### Scenario A — first schedule

1. Log in with Kakao.
2. Create a schedule from a calendar date.
3. Set title, category, time and place.
4. Save the schedule and reopen it.

Success criteria:
- No tester asks where the date is chosen.
- No tester is blocked by place search or time input.
- Saved data is still present after refresh.

### Scenario B — consecutive schedules

1. Create two upcoming schedules at different locations.
2. Leave enough time between them.
3. Confirm a recommended departure time appears even when there is no shortage warning.
4. Reduce the gap so travel time becomes insufficient.
5. Confirm the warning explains date/time, travel estimate, available time and shortage.

Success criteria:
- Tester can answer “when should I leave?” without calculation.
- Past schedules do not remain in the warning panel.

### Scenario C — repeated use

1. Save one location as a favorite.
2. Create a weekly recurring schedule four times.
3. Reuse the favorite location.
4. Search for the schedule by title/place/category.

Success criteria:
- Repeated entry feels faster than creating four schedules manually.
- A failed recurring request does not leave a partially created series.

### Scenario D — calendar portability

1. Export schedules to ICS.
2. Import a valid ICS file.
3. Import an ICS file containing one invalid event.

Success criteria:
- Valid import succeeds as one operation.
- Invalid import does not create a partially imported calendar.
- Imported place names without coordinates are not treated as routable locations until reselected.

### Scenario E — user control

1. Turn departure alerts on/off.
2. Review the privacy/data-handling explanation.
3. Test application-data deletion with a non-production test account.

Success criteria:
- Tester understands browser-open notification limitation.
- Tester understands app-data deletion is not Kakao account deletion.

## Interview questions

Ask after tasks are completed, not before.

1. What part of the product felt meaningfully different from your current calendar?
2. Was entering a location worth the extra effort? Why or why not?
3. Which was more useful: shortage warning or recommended departure time?
4. Would you enable departure notifications for real appointments?
5. Which repeated task felt most annoying?
6. What would stop you from using this next week?
7. If this disappeared tomorrow, what feature would you miss?

## Metrics to record

- Schedule creation completion rate
- Median time to create first schedule
- Place-selection failure rate
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
