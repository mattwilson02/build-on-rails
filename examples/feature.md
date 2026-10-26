---
feature: reminders
prefix: REM
stage: build
approved-requirements: 2026-01-12
approved-design: 2026-01-14
approved-spec: 2026-01-15
design: https://example.com/designs/reminders
adrs: []
---

# Reminders

Let a person set a daily reminder, so they remember to log their day.

## Requirements

### REM-01 F: Set a daily reminder

- .1 Choosing a time saves it and shows it on the settings screen.
- .2 Changing the time replaces the old one. There is never more than one.
- .3 [manual] The reminder arrives on a real device at the chosen time.

### REM-02 Q: Respect the system permission

- .1 If notifications are denied, the settings screen says so and offers no time picker.

## Design

Settings screen with a time picker, the denied state, and the saved state. Components from the design system only.

## Spec

The time is stored as a local clock time, not a UTC instant, so it holds across daylight saving changes. The reminder is scheduled on the device. Nothing is sent from the server.
