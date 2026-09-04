import { isFeedback, type Feedback } from './feedback';
import {
  getConfiguredRetryPhrase,
  IMPOSSIBLE_DEADLINE_SCENARIO,
  type RehearsalScenario,
  type ScenarioPhrase,
} from './scenarios';

export type RehearsalPhase =
  | 'prepare'
  | 'guiding'
  | 'handoff'
  | 'recording'
  | 'review'
  | 'retry';

export type GuideLevel = 0 | 15 | 25;
export type ReviewStatus = 'idle' | 'take-ready' | 'take-deleted';

export interface LocalTake {
  readonly uri: string;
  readonly durationMs: number;
  readonly recordedAtIso?: string;
}

export interface RehearsalState {
  readonly scenarioId: string;
  readonly phase: RehearsalPhase;
  readonly activePhraseIndex: number;
  readonly preferredGuideLevel: GuideLevel;
  readonly activeGuideLevel: GuideLevel;
  readonly guideStopped: boolean;
  readonly take: LocalTake | null;
  readonly feedback: Feedback | null;
  readonly retrySegment: ScenarioPhrase | null;
  readonly reviewStatus: ReviewStatus;
}

export type RehearsalEvent =
  | { readonly type: 'SET_GUIDE_LEVEL'; readonly level: GuideLevel }
  | { readonly type: 'BEGIN_GUIDE' }
  | { readonly type: 'GUIDE_PROGRESS'; readonly phraseIndex: number }
  | { readonly type: 'GUIDE_FINISHED' }
  | { readonly type: 'GUIDE_STOP_CONFIRMED' }
  | { readonly type: 'GUIDE_FAILED' }
  | { readonly type: 'BEGIN_RECORDING' }
  | { readonly type: 'RECORDING_FINISHED'; readonly take: LocalTake }
  | { readonly type: 'RECORDING_FAILED' }
  | { readonly type: 'FEEDBACK_READY'; readonly feedback: Feedback }
  | { readonly type: 'RETRY_PHRASE' }
  | { readonly type: 'TAKE_DELETED' }
  | { readonly type: 'START_OVER' };

export type TransitionRejectionReason =
  | 'invalid-state'
  | 'invalid-phase'
  | 'guide-not-stopped'
  | 'invalid-phrase-index'
  | 'invalid-take'
  | 'invalid-feedback'
  | 'feedback-required';

export type RehearsalTransition =
  | {
      readonly accepted: true;
      readonly state: RehearsalState;
    }
  | {
      readonly accepted: false;
      readonly state: RehearsalState;
      readonly reason: TransitionRejectionReason;
    };

const GUIDE_LEVELS: readonly GuideLevel[] = [0, 15, 25];

export function createInitialRehearsalState(
  scenario: RehearsalScenario = IMPOSSIBLE_DEADLINE_SCENARIO,
): RehearsalState {
  return {
    scenarioId: scenario.id,
    phase: 'prepare',
    activePhraseIndex: 0,
    preferredGuideLevel: 15,
    activeGuideLevel: 0,
    guideStopped: true,
    take: null,
    feedback: null,
    retrySegment: null,
    reviewStatus: 'idle',
  };
}

function isValidTake(take: LocalTake): boolean {
  return (
    typeof take.uri === 'string' &&
    take.uri.trim().length > 0 &&
    Number.isFinite(take.durationMs) &&
    take.durationMs > 0
  );
}

export function getRehearsalInvariantIssues(
  state: RehearsalState,
  scenario: RehearsalScenario = IMPOSSIBLE_DEADLINE_SCENARIO,
): readonly string[] {
  const issues: string[] = [];

  if (state.scenarioId !== scenario.id) {
    issues.push('state scenarioId does not match the supplied scenario');
  }

  if (
    !Number.isInteger(state.activePhraseIndex) ||
    state.activePhraseIndex < 0 ||
    state.activePhraseIndex >= scenario.phrases.length
  ) {
    issues.push('activePhraseIndex is outside the scenario phrase range');
  }

  if (
    !GUIDE_LEVELS.includes(state.preferredGuideLevel) ||
    !GUIDE_LEVELS.includes(state.activeGuideLevel)
  ) {
    issues.push('guide levels must be 0, 15, or 25');
  }

  if (state.phase === 'guiding') {
    if (state.guideStopped) {
      issues.push('guiding requires guideStopped=false');
    }
    if (state.activeGuideLevel !== state.preferredGuideLevel) {
      issues.push('guiding active level must equal the preferred guide level');
    }
  } else if (state.activeGuideLevel !== 0) {
    issues.push('the active guide level must be zero outside guiding');
  }

  if (state.phase === 'prepare' && !state.guideStopped) {
    issues.push('prepare requires the guide to be stopped');
  }

  if (
    (state.phase === 'recording' ||
      state.phase === 'review' ||
      state.phase === 'retry') &&
    !state.guideStopped
  ) {
    issues.push(`${state.phase} requires the guide to be stopped`);
  }

  if (state.phase !== 'review' && state.reviewStatus !== 'idle') {
    issues.push('reviewStatus must be idle outside review');
  }

  if (state.phase === 'review' && state.reviewStatus === 'idle') {
    issues.push('review requires take-ready or take-deleted status');
  }

  if (state.reviewStatus === 'take-ready' && !state.take) {
    issues.push('take-ready review requires a take');
  }

  if (state.reviewStatus === 'take-deleted' && state.take) {
    issues.push('take-deleted review cannot retain a take');
  }

  if (state.take && !isValidTake(state.take)) {
    issues.push('take must contain a non-empty URI and positive finite duration');
  }

  if (state.take && state.phase !== 'review') {
    issues.push('a completed take can exist only in review');
  }

  if (state.feedback && (state.phase !== 'review' || state.reviewStatus !== 'take-ready')) {
    issues.push('feedback can exist only for a ready take in review');
  }

  if (state.feedback && !isFeedback(state.feedback)) {
    issues.push('feedback does not satisfy the feedback contract');
  }

  if (
    state.feedback &&
    state.feedback.retryPhrase !== getConfiguredRetryPhrase(scenario).text
  ) {
    issues.push('feedback retryPhrase must match the configured scenario phrase');
  }

  if (state.phase === 'retry' && !state.retrySegment) {
    issues.push('retry requires a selected segment');
  }

  if (
    state.retrySegment &&
    state.retrySegment.id !== scenario.retryPhraseId
  ) {
    issues.push('retrySegment must be the configured scenario retry phrase');
  }

  if (state.reviewStatus === 'take-deleted' && state.retrySegment) {
    issues.push('take-deleted review cannot retain a retry segment');
  }

  if (
    (state.phase === 'prepare' || state.phase === 'guiding' || state.phase === 'handoff') &&
    (state.take || state.feedback || state.retrySegment)
  ) {
    issues.push(`${state.phase} cannot retain take, feedback, or retry data`);
  }

  return issues;
}

export function assertRehearsalState(
  state: RehearsalState,
  scenario: RehearsalScenario = IMPOSSIBLE_DEADLINE_SCENARIO,
): void {
  const issues = getRehearsalInvariantIssues(state, scenario);
  if (issues.length > 0) {
    throw new Error(`Invalid rehearsal state: ${issues.join('; ')}`);
  }
}

function accepted(state: RehearsalState): RehearsalTransition {
  return { accepted: true, state };
}

function rejected(
  state: RehearsalState,
  reason: TransitionRejectionReason,
): RehearsalTransition {
  return { accepted: false, state, reason };
}

function phaseIs(state: RehearsalState, ...phases: RehearsalPhase[]): boolean {
  return phases.includes(state.phase);
}

export function transitionRehearsal(
  state: RehearsalState,
  event: RehearsalEvent,
  scenario: RehearsalScenario = IMPOSSIBLE_DEADLINE_SCENARIO,
): RehearsalTransition {
  if (getRehearsalInvariantIssues(state, scenario).length > 0) {
    return rejected(state, 'invalid-state');
  }

  switch (event.type) {
    case 'SET_GUIDE_LEVEL': {
      if (!phaseIs(state, 'prepare', 'guiding')) {
        return rejected(state, 'invalid-phase');
      }

      return accepted({
        ...state,
        preferredGuideLevel: event.level,
        activeGuideLevel: state.phase === 'guiding' ? event.level : 0,
      });
    }

    case 'BEGIN_GUIDE': {
      if (state.phase !== 'prepare') {
        return rejected(state, 'invalid-phase');
      }

      return accepted({
        ...state,
        phase: 'guiding',
        activePhraseIndex: 0,
        activeGuideLevel: state.preferredGuideLevel,
        guideStopped: false,
      });
    }

    case 'GUIDE_PROGRESS': {
      if (state.phase !== 'guiding') {
        return rejected(state, 'invalid-phase');
      }
      if (
        !Number.isInteger(event.phraseIndex) ||
        event.phraseIndex < 0 ||
        event.phraseIndex >= scenario.phrases.length
      ) {
        return rejected(state, 'invalid-phrase-index');
      }

      return accepted({ ...state, activePhraseIndex: event.phraseIndex });
    }

    case 'GUIDE_FINISHED': {
      if (state.phase !== 'guiding') {
        return rejected(state, 'invalid-phase');
      }

      return accepted({
        ...state,
        phase: 'handoff',
        activeGuideLevel: 0,
        guideStopped: false,
      });
    }

    case 'GUIDE_STOP_CONFIRMED': {
      if (state.phase !== 'handoff') {
        return rejected(state, 'invalid-phase');
      }

      return accepted({ ...state, guideStopped: true });
    }

    case 'GUIDE_FAILED': {
      if (state.phase !== 'guiding') {
        return rejected(state, 'invalid-phase');
      }

      return accepted({
        ...state,
        phase: 'handoff',
        activeGuideLevel: 0,
        guideStopped: true,
      });
    }

    case 'BEGIN_RECORDING': {
      if (!phaseIs(state, 'handoff', 'retry')) {
        return rejected(state, 'invalid-phase');
      }
      if (!state.guideStopped) {
        return rejected(state, 'guide-not-stopped');
      }

      return accepted({
        ...state,
        phase: 'recording',
        activeGuideLevel: 0,
        take: null,
        feedback: null,
        reviewStatus: 'idle',
      });
    }

    case 'RECORDING_FINISHED': {
      if (state.phase !== 'recording') {
        return rejected(state, 'invalid-phase');
      }
      if (!isValidTake(event.take)) {
        return rejected(state, 'invalid-take');
      }

      return accepted({
        ...state,
        phase: 'review',
        take: { ...event.take, uri: event.take.uri.trim() },
        feedback: null,
        reviewStatus: 'take-ready',
      });
    }

    case 'RECORDING_FAILED': {
      if (state.phase !== 'recording') {
        return rejected(state, 'invalid-phase');
      }

      return accepted({
        ...state,
        phase: state.retrySegment ? 'retry' : 'handoff',
        take: null,
        feedback: null,
        guideStopped: true,
        reviewStatus: 'idle',
      });
    }

    case 'FEEDBACK_READY': {
      if (state.phase !== 'review' || state.reviewStatus !== 'take-ready' || !state.take) {
        return rejected(state, 'invalid-phase');
      }
      if (!isFeedback(event.feedback)) {
        return rejected(state, 'invalid-feedback');
      }
      if (
        event.feedback.retryPhrase !== getConfiguredRetryPhrase(scenario).text
      ) {
        return rejected(state, 'invalid-feedback');
      }

      return accepted({ ...state, feedback: event.feedback });
    }

    case 'RETRY_PHRASE': {
      if (state.phase !== 'review' || state.reviewStatus !== 'take-ready') {
        return rejected(state, 'invalid-phase');
      }
      if (!state.feedback) {
        return rejected(state, 'feedback-required');
      }

      const retrySegment = getConfiguredRetryPhrase(scenario);
      const activePhraseIndex = scenario.phrases.findIndex(
        (phrase) => phrase.id === retrySegment.id,
      );

      return accepted({
        ...state,
        phase: 'retry',
        activePhraseIndex,
        take: null,
        feedback: null,
        retrySegment,
        reviewStatus: 'idle',
      });
    }

    case 'TAKE_DELETED': {
      if (state.phase !== 'review' || state.reviewStatus !== 'take-ready' || !state.take) {
        return rejected(state, 'invalid-phase');
      }

      return accepted({
        ...state,
        take: null,
        feedback: null,
        retrySegment: null,
        reviewStatus: 'take-deleted',
      });
    }

    case 'START_OVER': {
      return accepted({
        ...createInitialRehearsalState(scenario),
        preferredGuideLevel: state.preferredGuideLevel,
      });
    }
  }
}

export function rehearsalReducer(
  state: RehearsalState,
  event: RehearsalEvent,
): RehearsalState {
  return transitionRehearsal(state, event).state;
}
