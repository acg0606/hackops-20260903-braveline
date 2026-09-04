export type ScenarioPhrasePurpose =
  | 'acknowledge'
  | 'boundary'
  | 'alternative'
  | 'collaborate';

export interface ScenarioPhrase {
  readonly id: string;
  readonly text: string;
  readonly purpose: ScenarioPhrasePurpose;
}
export interface RehearsalScenario {
  readonly id: string;
  readonly title: string;
  readonly counterpart: string;
  readonly setup: string;
  readonly tension: string;
  readonly goal: string;
  readonly estimatedMinutes: number;
  readonly contentSource: 'synthetic';
  readonly contentDisclosure: string;
  readonly privacyPromise: string;
  readonly phrases: readonly ScenarioPhrase[];
  readonly retryPhraseId: string;
}

const impossibleDeadlinePhrases = Object.freeze<readonly ScenarioPhrase[]>([
  Object.freeze({
    id: 'acknowledge-urgency',
    text: 'I hear how urgent this is.',
    purpose: 'acknowledge',
  }),
  Object.freeze({
    id: 'name-risk',
    text: 'Taking the full scope by tomorrow would put quality at risk.',
    purpose: 'boundary',
  }),
  Object.freeze({
    id: 'offer-reliable-friday',
    text: 'I can deliver a reliable version by Friday.',
    purpose: 'alternative',
  }),
  Object.freeze({
    id: 'invite-tradeoff',
    text: "If tomorrow is fixed, let's choose the critical slice together.",
    purpose: 'collaborate',
  }),
]);

/**
 * A deliberately synthetic scenario fixture. It is not presented as customer
 * research, validated coaching guidance, or a transcript of a real person.
 */
export const IMPOSSIBLE_DEADLINE_SCENARIO: RehearsalScenario = Object.freeze({
  id: 'boundary-impossible-deadline',
  title: 'Set a boundary: an impossible deadline',
  counterpart: 'Your manager',
  setup:
    'Your manager asks for the full project tomorrow. A reliable delivery needs more time.',
  tension:
    'You want to protect quality without sounding defensive or leaving the request unresolved.',
  goal: 'State the limit, offer a credible alternative, and invite a clear tradeoff.',
  estimatedMinutes: 2,
  contentSource: 'synthetic',
  contentDisclosure: 'Synthetic practice scenario',
  privacyPromise: 'Your take stays on this device by default.',
  phrases: impossibleDeadlinePhrases,
  retryPhraseId: 'offer-reliable-friday',
});

export const SCENARIOS: readonly RehearsalScenario[] = Object.freeze([
  IMPOSSIBLE_DEADLINE_SCENARIO,
]);

export function getScenarioById(id: string): RehearsalScenario | undefined {
  return SCENARIOS.find((scenario) => scenario.id === id);
}

export function getScenarioPhrase(
  scenario: RehearsalScenario,
  phraseId: string,
): ScenarioPhrase | undefined {
  return scenario.phrases.find((phrase) => phrase.id === phraseId);
}

export function getConfiguredRetryPhrase(
  scenario: RehearsalScenario,
): ScenarioPhrase {
  const retryPhrase = getScenarioPhrase(scenario, scenario.retryPhraseId);

  if (!retryPhrase) {
    throw new Error(
      `Scenario "${scenario.id}" is missing retry phrase "${scenario.retryPhraseId}".`,
    );
  }

  return retryPhrase;
}
