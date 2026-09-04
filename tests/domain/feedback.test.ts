import { describe, expect, it } from 'vitest';

import {
  deterministicFeedbackProvider,
  generateDeterministicFeedback,
  isFeedback,
  MIN_MEANINGFUL_TAKE_MS,
} from '../../src/domain/feedback';
import { IMPOSSIBLE_DEADLINE_SCENARIO } from '../../src/domain/scenarios';

const retryPhrase = 'I can deliver a reliable version by Friday.';

describe('deterministic feedback', () => {
  it('returns exactly one grounded strength and next step when the transcript contains the target', () => {
    const feedback = generateDeterministicFeedback({
      scenario: IMPOSSIBLE_DEADLINE_SCENARIO,
      durationMs: 7_200,
      transcript:
        'Taking the full scope by tomorrow would put quality at risk. I can deliver a reliable version by Friday.',
      hasValidAudio: true,
    });

    expect(Object.keys(feedback).sort()).toEqual(
      ['evidencePhrase', 'nextStep', 'retryPhrase', 'source', 'strength'].sort(),
    );
    expect(feedback.source).toBe('transcript-grounded');
    expect(feedback.evidencePhrase).toBe(retryPhrase);
    expect(feedback.retryPhrase).toBe(retryPhrase);
    expect(feedback.strength).toContain('specific, workable alternative');
    expect(feedback.nextStep).toContain('state the limit first');
    expect(isFeedback(feedback)).toBe(true);
  });

  it('uses an exact transcript excerpt as evidence when no scenario phrase matches', () => {
    const transcript = 'Tomorrow is not realistic, but I would like to propose Friday.';
    const feedback = deterministicFeedbackProvider.generate({
      scenario: IMPOSSIBLE_DEADLINE_SCENARIO,
      durationMs: 5_000,
      transcript,
    });

    expect(feedback).toMatchObject({
      evidencePhrase: transcript,
      retryPhrase,
      source: 'transcript-grounded',
    });
  });

  it('labels a normal take without transcription as a demo-safe fallback', () => {
    const feedback = generateDeterministicFeedback({
      scenario: IMPOSSIBLE_DEADLINE_SCENARIO,
      durationMs: 6_000,
      hasValidAudio: true,
    });

    expect(feedback.source).toBe('demo-safe fallback');
    expect(feedback.strength).toBe(
      'You completed a take that you can replay privately.',
    );
    expect(feedback.evidencePhrase).toContain('wording was not assessed');
    expect(feedback.retryPhrase).toBe(retryPhrase);
  });

  it.each([
    {
      label: 'short',
      durationMs: MIN_MEANINGFUL_TAKE_MS - 1,
      isSilent: false,
    },
    { label: 'silent', durationMs: 5_000, isSilent: true },
  ])('does not judge $label speech content', ({ durationMs, isSilent }) => {
    const feedback = generateDeterministicFeedback({
      scenario: IMPOSSIBLE_DEADLINE_SCENARIO,
      durationMs,
      isSilent,
      transcript: retryPhrase,
      hasValidAudio: true,
    });

    expect(feedback.source).toBe('demo-safe fallback');
    expect(feedback.evidencePhrase).toBe(
      'The take was too short or silent; speech content was not assessed.',
    );
    expect(feedback.nextStep).toContain('Try again');
    expect(feedback.strength).not.toMatch(/clear|confident|pronunciation|tone/i);
  });

  it('does not imply a recording exists when there is no valid audio', () => {
    const feedback = generateDeterministicFeedback({
      scenario: IMPOSSIBLE_DEADLINE_SCENARIO,
      durationMs: 0,
      hasValidAudio: false,
    });

    expect(feedback.source).toBe('demo-safe fallback');
    expect(feedback.strength).toBe('You opened a private practice session.');
    expect(feedback.evidencePhrase).toContain('No valid take');
  });

  it('rejects incomplete or fabricated feedback shapes', () => {
    expect(isFeedback(null)).toBe(false);
    expect(
      isFeedback({
        strength: 'Specific strength',
        nextStep: '',
        evidencePhrase: 'Evidence',
        retryPhrase,
        source: 'magic-ai-score',
      }),
    ).toBe(false);
  });
});
