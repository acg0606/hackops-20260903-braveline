import {
  getConfiguredRetryPhrase,
  type RehearsalScenario,
  type ScenarioPhrase,
} from './scenarios';

export const FEEDBACK_SOURCES = [
  'transcript-grounded',
  'demo-safe fallback',
] as const;

export type FeedbackSource = (typeof FEEDBACK_SOURCES)[number];

/**
 * Deliberately contains one strength and one next step, rather than a score or
 * an open-ended coaching report.
 */
export interface Feedback {
  readonly strength: string;
  readonly nextStep: string;
  readonly evidencePhrase: string;
  readonly retryPhrase: string;
  readonly source: FeedbackSource;
}

export interface FeedbackInput {
  readonly scenario: RehearsalScenario;
  readonly durationMs: number;
  readonly transcript?: string | null;
  readonly hasValidAudio?: boolean;
  readonly isSilent?: boolean;
}

export interface FeedbackProvider {
  readonly id: 'deterministic-local';
  readonly mode: 'local-deterministic';
  generate(input: FeedbackInput): Feedback;
}

export const MIN_MEANINGFUL_TAKE_MS = 1_500;

function cleanText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function comparable(value: string): string {
  return cleanText(value)
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .toLocaleLowerCase('en-US');
}

function findGroundedScenarioPhrase(
  transcript: string,
  scenario: RehearsalScenario,
): ScenarioPhrase | undefined {
  const normalizedTranscript = comparable(transcript);

  return [...scenario.phrases]
    .sort((left, right) => right.text.length - left.text.length)
    .find((phrase) => normalizedTranscript.includes(comparable(phrase.text)));
}

function transcriptExcerpt(transcript: string): string {
  const cleaned = cleanText(transcript);
  return cleaned.length <= 120 ? cleaned : `${cleaned.slice(0, 117).trimEnd()}...`;
}

function safeFallback(
  input: FeedbackInput,
  retryPhrase: ScenarioPhrase,
): Feedback {
  const hasValidAudio = input.hasValidAudio ?? input.durationMs > 0;

  if (!hasValidAudio || input.durationMs <= 0) {
    return {
      strength: 'You opened a private practice session.',
      nextStep: 'Record a take before reviewing the wording.',
      evidencePhrase: 'No valid take was available; speech content was not assessed.',
      retryPhrase: retryPhrase.text,
      source: 'demo-safe fallback',
    };
  }

  if (input.isSilent || input.durationMs < MIN_MEANINGFUL_TAKE_MS) {
    return {
      strength: 'You started the rehearsal loop.',
      nextStep: 'Try again and leave enough time to speak the complete boundary.',
      evidencePhrase: 'The take was too short or silent; speech content was not assessed.',
      retryPhrase: retryPhrase.text,
      source: 'demo-safe fallback',
    };
  }

  return {
    strength: 'You completed a take that you can replay privately.',
    nextStep: `On the next take, practise the highlighted boundary: "${retryPhrase.text}"`,
    evidencePhrase: 'No transcript was available; wording was not assessed.',
    retryPhrase: retryPhrase.text,
    source: 'demo-safe fallback',
  };
}

export function generateDeterministicFeedback(input: FeedbackInput): Feedback {
  const retryPhrase = getConfiguredRetryPhrase(input.scenario);
  const transcript = input.transcript ? cleanText(input.transcript) : '';

  if (
    !transcript ||
    input.isSilent ||
    input.durationMs < MIN_MEANINGFUL_TAKE_MS ||
    input.hasValidAudio === false
  ) {
    return safeFallback(input, retryPhrase);
  }

  const transcriptContainsRetryPhrase = comparable(transcript).includes(
    comparable(retryPhrase.text),
  );
  const groundedPhrase = findGroundedScenarioPhrase(transcript, input.scenario);

  if (transcriptContainsRetryPhrase) {
    return {
      strength: 'You offered a specific, workable alternative instead of stopping at no.',
      nextStep:
        'On the retry, state the limit first, then let the concrete alternative stand as its own sentence.',
      evidencePhrase: retryPhrase.text,
      retryPhrase: retryPhrase.text,
      source: 'transcript-grounded',
    };
  }

  return {
    strength: 'Your recorded wording gives you a concrete sentence to revise.',
    nextStep: `Make the workable alternative explicit: "${retryPhrase.text}"`,
    evidencePhrase: groundedPhrase?.text ?? transcriptExcerpt(transcript),
    retryPhrase: retryPhrase.text,
    source: 'transcript-grounded',
  };
}

export const deterministicFeedbackProvider: FeedbackProvider = Object.freeze({
  id: 'deterministic-local',
  mode: 'local-deterministic',
  generate: generateDeterministicFeedback,
});

export function isFeedback(value: unknown): value is Feedback {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  const requiredStrings = [
    candidate.strength,
    candidate.nextStep,
    candidate.evidencePhrase,
    candidate.retryPhrase,
  ];

  return (
    requiredStrings.every(
      (item) => typeof item === 'string' && cleanText(item).length > 0,
    ) &&
    FEEDBACK_SOURCES.includes(candidate.source as FeedbackSource)
  );
}

export function assertFeedback(value: unknown): asserts value is Feedback {
  if (!isFeedback(value)) {
    throw new Error('Feedback does not satisfy the BraveLine feedback contract.');
  }
}
