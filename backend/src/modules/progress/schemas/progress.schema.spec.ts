import { submitProgressSchema } from '@code-of-life/shared';

describe('submitProgressSchema', () => {
  const validPayload = {
    puzzleId: 'puzzle-123',
    completed: true,
    score: 100,
    timeSpent: 300,
    hintsUsed: 2,
  };

  it('accepts integer hintsUsed values within the 0-3 range', () => {
    expect(submitProgressSchema.parse(validPayload)).toEqual(validPayload);
  });

  it('rejects negative hintsUsed values', () => {
    expect(() =>
      submitProgressSchema.parse({
        ...validPayload,
        hintsUsed: -1,
      }),
    ).toThrow();
  });

  it('rejects hintsUsed values above 3', () => {
    expect(() =>
      submitProgressSchema.parse({
        ...validPayload,
        hintsUsed: 4,
      }),
    ).toThrow();
  });

  it('rejects non-integer hintsUsed values', () => {
    expect(() =>
      submitProgressSchema.parse({
        ...validPayload,
        hintsUsed: 1.5,
      }),
    ).toThrow();
  });
});
