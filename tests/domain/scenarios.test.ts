import { describe, expect, it } from 'vitest';

import {
  getConfiguredRetryPhrase,
  getScenarioById,
  IMPOSSIBLE_DEADLINE_SCENARIO,
} from '../../src/domain/scenarios';

describe('synthetic scenarios', () => {
  it('ships the selected impossible-deadline practice setup without research claims', () => {
    expect(IMPOSSIBLE_DEADLINE_SCENARIO).toMatchObject({
      id: 'boundary-impossible-deadline',
      title: 'Set a boundary: an impossible deadline',
      counterpart: 'Your manager',
      contentSource: 'synthetic',
      contentDisclosure: 'Synthetic practice scenario',
    });
    expect(IMPOSSIBLE_DEADLINE_SCENARIO.phrases).toHaveLength(4);
    expect(getScenarioById(IMPOSSIBLE_DEADLINE_SCENARIO.id)).toBe(
      IMPOSSIBLE_DEADLINE_SCENARIO,
    );
  });

  it('selects the exact configured retry clause', () => {
    expect(getConfiguredRetryPhrase(IMPOSSIBLE_DEADLINE_SCENARIO)).toEqual({
      id: 'offer-reliable-friday',
      text: 'I can deliver a reliable version by Friday.',
      purpose: 'alternative',
    });
  });
});
