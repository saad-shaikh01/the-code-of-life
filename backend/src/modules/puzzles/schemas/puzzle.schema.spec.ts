import { updatePuzzleSchema } from './puzzle.schema';

describe('updatePuzzleSchema', () => {
  it('accepts null for nullable Prisma fields', () => {
    const parsed = updatePuzzleSchema.parse({
      bookChapter: null,
      bookSection: null,
      bookPageRef: null,
      scheduledDate: null,
    });

    expect(parsed).toEqual({
      bookChapter: null,
      bookSection: null,
      bookPageRef: null,
      scheduledDate: null,
    });
  });

  it('rejects null for non-nullable fields', () => {
    expect(() => updatePuzzleSchema.parse({ title: null })).toThrow();
    expect(() =>
      updatePuzzleSchema.parse({ encryptedPattern: null }),
    ).toThrow();
    expect(() =>
      updatePuzzleSchema.parse({ originalReflection: null }),
    ).toThrow();
    expect(() => updatePuzzleSchema.parse({ hints: null })).toThrow();
  });
});
