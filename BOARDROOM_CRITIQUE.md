# Steady v2.5 — Boardroom Critique Action Plan

## Consolidated Fixes (Priority Order)

| # | Fix Name | Priority | Owner | Expected Impact |
|---|----------|----------|-------|-----------------|
| 1 | **Data Persistence Safety Net** — Prominent auto-export reminder after every 7 sessions. "Back up your progress" nudge. Long-term: cloud sync. | HIGH | Dev | Prevents catastrophic data loss. Trust = retention foundation. |
| 2 | **Service Worker Implementation** — Actually build sw.js for offline caching of app shell + exercise data. PWA promise must be real. | HIGH | Dev | Unblocks PWA install credibility. Required for app store listing. |
| 3 | **Post-Exercise Celebration** — After signal shift, show animated result ("Pressure: Intense → Settled"), streak update, and "See you tomorrow" with next day preview. | HIGH | PM + Brand | The #1 moment that builds habit. Currently wasted. |
| 4 | **Day 28+ Content Strategy** — Level 2 should remix exercises with harder cognitive tiers, longer holds, and new disruption patterns. Not identical repeat. | HIGH | PM + CEO | Without this, 100% of users churn at Day 28. |
| 5 | **Onboarding That Matters** — Use modality/goal selections to customize Day 1 exercise, relief recommendations, and home screen copy. Or remove the questions. | MED | PM | Fake personalization is worse than none. |
| 6 | **Exercise Naming Audit** — Rename generic exercises (Countdown Calm → Pressure Timer, Foundation Test → Baseline Check). Every name should evoke what it feels like, not what it is. | MED | Brand | Premium perception. Names are the brand's front line. |
| 7 | **Guided Unload Triggers** — After high-signal sessions (pressure=2), prompt "Want to unload what's on your mind?" linking to journal. Teach the tool in context. | MED | PM | Unlocks an entire unused feature for most users. |
| 8 | **Signal Validation & Edge Cases** — Enforce 0-2 range, handle skipped days gracefully, validate import schema. Defensive coding pass. | MED | Dev | Prevents silent data corruption as usage scales. |
| 9 | **Reminder Notification Implementation** — Wire up the Web Notification API for daily practice reminders. The setting exists but does nothing. | MED | Dev | Broken promises erode trust. Either ship it or hide the setting. |
| 10 | **Share/Social Proof Loop** — "I just completed Day 14 of Steady" shareable card (image or link). Minimal viral mechanic. | LOW | CEO + Brand | Only growth lever currently missing. Low effort, moderate upside. |
| 11 | **Accessibility Pass** — ARIA live regions for timer/signal updates, focus management between views, keyboard nav testing. | LOW | Dev | Right thing to do. Also unblocks enterprise/institutional sales. |
| 12 | **Performance Memoization** — Cache chart renders, lazy-load exercise library, paginate session history beyond 50 entries. | LOW | Dev | No impact now. Future-proofing for scale. |

## Key Metrics to Track

- **Day 7 retention** (do they finish Foundation phase?)
- **Day 28 completion rate** (do they finish the full challenge?)
- **Post-exercise signal shift** (is the product actually working?)
- **Journal usage rate** (are they using Unload without prompting?)
- **Export/backup rate** (are they protecting their data?)

## Bottom Line

Steady has genuine product-market fit potential in a gap that Calm, Headspace, and Waking Up don't address: **active resilience training under simulated stress**, not passive meditation. The 28-day progressive challenge is the moat. The signal tracking before/after exercises is the proof loop. The dark, instrument-panel aesthetic is the brand.

What's missing isn't features — it's **the connective tissue between features**. Post-exercise should feed into journaling. Journaling should surface in progress. Progress should motivate tomorrow's training. Day 28 should unlock something genuinely new. Right now these are five good tools sitting next to each other. They need to become one system.
