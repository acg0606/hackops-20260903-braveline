import { describe, expect, it } from 'vitest';

import { generateDeterministicFeedback } from '../../src/domain/feedback';
import {
  createInitialRehearsalState,
  getRehearsalInvariantIssues,
  transitionRehearsal,
  type RehearsalEvent,
  type RehearsalState,
} from '../../src/domain/rehearsal-machine';
import { IMPOSSIBLE_DEADLINE_SCENARIO } from '../../src/domain/scenarios';

function advance(state: RehearsalState, event: RehearsalEvent): RehearsalState {
  const result = transitionRehearsal(state, event);
  if (!result.accepted) {
    throw new Error(`Expected ${event.type} to be accepted, got ${result.reason}`);
  }
  expect(getRehearsalInvariantIssues(result.state)).toEqual([]);
  return result.state;
}

function reachReview(): RehearsalState {
  let state = createInitialRehearsalState();
  state = advance(state, { type: 'BEGIN_GUIDE' });
  state = advance(state, { type: 'GUIDE_FINISHED' });
  state = advance(state, { type: 'GUIDE_STOP_CONFIRMED' });
  state = advance(state, { type: 'BEGIN_RECORDING' });
  return advance(state, {
    type: 'RECORDING_FINISHED',
    take: { uri: 'file:///private/take-1.m4a', durationMs: 6_400 },
  });
}

describe('rehearsal state machine', () => {
  it('runs the legal prepare -> guide -> handoff -> recording -> review path', () => {
    let state = createInitialRehearsalState();

    state = advance(state, { type: 'SET_GUIDE_LEVEL', level: 25 });
    state = advance(state, { type: 'BEGIN_GUIDE' });
    expect(state).toMatchObject({
      phase: 'guiding',
      preferredGuideLevel: 25,
      activeGuideLevel: 25,
      guideStopped: false,
    });

    state = advance(state, { type: 'GUIDE_PROGRESS', phraseIndex: 2 });
    expect(state.activePhraseIndex).toBe(2);

    state = advance(state, { type: 'GUIDE_FINISHED' });
    expect(state).toMatchObject({
      phase: 'handoff',
      activeGuideLevel: 0,
      guideStopped: false,
    });

    state = advance(state, { type: 'GUIDE_STOP_CONFIRMED' });
    state = advance(state, { type: 'BEGIN_RECORDING' });
    expect(state).toMatchObject({
      phase: 'recording',
      activeGuideLevel: 0,
      guideStopped: true,
    });

    state = advance(state, {
      type: 'RECORDING_FINISHED',
      take: { uri: ' file:///private/take.m4a ', durationMs: 7_000 },
    });
    expect(state).toMatchObject({
      phase: 'review',
      reviewStatus: 'take-ready',
      take: { uri: 'file:///private/take.m4a', durationMs: 7_000 },
    });
  });

  it('cannot record until the guide reports stopped', () => {
    let state = createInitialRehearsalState();
    state = advance(state, { type: 'BEGIN_GUIDE' });
    state = advance(state, { type: 'GUIDE_FINISHED' });

    const result = transitionRehearsal(state, { type: 'BEGIN_RECORDING' });

    expect(result).toEqual({
      accepted: false,
      reason: 'guide-not-stopped',
      state,
    });
  });

  it('ignores double starts with a typed rejection and keeps the same state object', () => {
    const guiding = advance(createInitialRehearsalState(), {
      type: 'BEGIN_GUIDE',
    });
    const guideResult = transitionRehearsal(guiding, { type: 'BEGIN_GUIDE' });
    expect(guideResult.accepted).toBe(false);
    expect(guideResult.state).toBe(guiding);
    if (!guideResult.accepted) {
      expect(guideResult.reason).toBe('invalid-phase');
    }

    let recording = advance(guiding, { type: 'GUIDE_FAILED' });
    recording = advance(recording, { type: 'BEGIN_RECORDING' });
    const recordResult = transitionRehearsal(recording, {
      type: 'BEGIN_RECORDING',
    });
    expect(recordResult.accepted).toBe(false);
    expect(recordResult.state).toBe(recording);
  });

  it('falls through to Solo honestly when guide playback fails', () => {
    let state = advance(createInitialRehearsalState(), {
      type: 'BEGIN_GUIDE',
    });
    state = advance(state, { type: 'GUIDE_FAILED' });

    expect(state).toMatchObject({
      phase: 'handoff',
      activeGuideLevel: 0,
      guideStopped: true,
    });
    expect(transitionRehearsal(state, { type: 'BEGIN_RECORDING' }).accepted).toBe(
      true,
    );
  });

  it('rejects invalid progress and invalid completed takes', () => {
    const guiding = advance(createInitialRehearsalState(), {
      type: 'BEGIN_GUIDE',
    });
    const progress = transitionRehearsal(guiding, {
      type: 'GUIDE_PROGRESS',
      phraseIndex: 99,
    });
    expect(progress.accepted).toBe(false);
    if (!progress.accepted) {
      expect(progress.reason).toBe('invalid-phrase-index');
    }

    let recording = advance(guiding, { type: 'GUIDE_FAILED' });
    recording = advance(recording, { type: 'BEGIN_RECORDING' });
    const take = transitionRehearsal(recording, {
      type: 'RECORDING_FINISHED',
      take: { uri: ' ', durationMs: Number.NaN },
    });
    expect(take.accepted).toBe(false);
    if (!take.accepted) {
      expect(take.reason).toBe('invalid-take');
    }
  });

  it('requires feedback, selects the configured clause, and resets the prior take', () => {
    let state = reachReview();

    const tooSoon = transitionRehearsal(state, { type: 'RETRY_PHRASE' });
    expect(tooSoon.accepted).toBe(false);
    if (!tooSoon.accepted) {
      expect(tooSoon.reason).toBe('feedback-required');
    }

    const feedback = generateDeterministicFeedback({
      scenario: IMPOSSIBLE_DEADLINE_SCENARIO,
      durationMs: state.take?.durationMs ?? 0,
      transcript: 'I can deliver a reliable version by Friday.',
      hasValidAudio: true,
    });
    state = advance(state, { type: 'FEEDBACK_READY', feedback });
    state = advance(state, { type: 'RETRY_PHRASE' });

    expect(state).toMatchObject({
      phase: 'retry',
      activePhraseIndex: 2,
      take: null,
      feedback: null,
      retrySegment: {
        id: 'offer-reliable-friday',
        text: 'I can deliver a reliable version by Friday.',
      },
    });

    state = advance(state, { type: 'BEGIN_RECORDING' });
    expect(state.phase).toBe('recording');
    state = advance(state, {
      type: 'RECORDING_FINISHED',
      take: { uri: 'file:///private/retry.m4a', durationMs: 3_800 },
    });
    expect(state.phase).toBe('review');
    expect(state.retrySegment?.id).toBe('offer-reliable-friday');
  });

  it('deletes take metadata into a neutral Ready state', () => {
    const review = reachReview();
    const deleted = advance(review, { type: 'TAKE_DELETED' });

    expect(deleted).toMatchObject({
      phase: 'review',
      reviewStatus: 'take-deleted',
      take: null,
      feedback: null,
      retrySegment: null,
    });
  });

  it('preserves the preferred guide level when starting over', () => {
    let state = advance(createInitialRehearsalState(), {
      type: 'SET_GUIDE_LEVEL',
      level: 25,
    });
    state = advance(state, { type: 'BEGIN_GUIDE' });
    state = advance(state, { type: 'START_OVER' });

    expect(state).toEqual({
      ...createInitialRehearsalState(),
      preferredGuideLevel: 25,
    });
  });

  it('refuses transitions from corrupted state rather than compounding it', () => {
    const corrupted: RehearsalState = {
      ...createInitialRehearsalState(),
      phase: 'recording',
      guideStopped: false,
    };
    const result = transitionRehearsal(corrupted, {
      type: 'RECORDING_FINISHED',
      take: { uri: 'file:///private/take.m4a', durationMs: 4_000 },
    });

    expect(getRehearsalInvariantIssues(corrupted)).not.toEqual([]);
    expect(result).toEqual({
      accepted: false,
      reason: 'invalid-state',
      state: corrupted,
    });
  });

  it('rejects feedback that points retry at an unconfigured phrase', () => {
    const review = reachReview();
    const honestFeedback = generateDeterministicFeedback({
      scenario: IMPOSSIBLE_DEADLINE_SCENARIO,
      durationMs: 4_000,
    });
    const result = transitionRehearsal(review, {
      type: 'FEEDBACK_READY',
      feedback: {
        ...honestFeedback,
        retryPhrase: 'A different sentence chosen at runtime.',
      },
    });

    expect(result.accepted).toBe(false);
    if (!result.accepted) {
      expect(result.reason).toBe('invalid-feedback');
    }
  });
});
