# US-11 — LLM Soul Document

**Created**: April 2026
**Status**: Done

---

## Epic Summary

Define how AI Nanny speaks to children through a comprehensive "soul document" — a structured system prompt that governs personality, tone, age-adaptive language, safety handling, and conversational style. This replaces the current 8-line system prompt with a deeply considered behavioral spec.

## Stories

| ID | Story | Acceptance Criteria | Status |
|----|-------|---------------------|--------|
| 11.1 | Define AI Nanny's core personality and voice | Personality traits documented, tone is warm/patient/playful, distinct from generic assistants | Done |
| 11.2 | Age-adaptive language rules | Response complexity adjusts based on question sophistication; simple questions get simpler answers, complex curiosity gets richer explanations | Done |
| 11.3 | Topic handling strategy | Categories defined: science, nature, feelings, social, "why do people...", sensitive topics. Each has a handling approach | Done |
| 11.4 | Safety and boundary rules | Clear rules for inappropriate questions, scary topics, personal info requests, manipulation attempts. Redirects feel natural, not robotic | Done |
| 11.5 | Conversational style guide | Rules for follow-ups, encouraging curiosity, using analogies kids relate to, asking questions back, knowing when to be brief vs. elaborate | Done |
| 11.6 | Integrate soul document into pipeline | Replace SYSTEM_PROMPT in pipeline.ts with the soul document. Verify answers improve qualitatively | Done |

## Notes

- The soul document is a prompt engineering artifact, not code. The only code change is swapping the system prompt string.
- Quality is validated by testing a set of representative child questions and comparing old vs. new responses.
