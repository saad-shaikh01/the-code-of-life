import { DecoderService } from './decoder.service';

describe('DecoderService', () => {
  let service: DecoderService;

  beforeEach(() => {
    service = new DecoderService();
  });

  it('encodes the full alphabet into numeric tokens', () => {
    const result = service.encode('ABCDEFGHIJKLMNOPQRSTUVWXYZ');

    expect(result.output).toBe(
      '1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26',
    );
    expect(result.unmappedSymbols).toEqual([]);
    expect(result.mappedCount).toBe(26);
    expect(result.totalSymbols).toBe(26);
  });

  it('round-trips letters, spaces, and punctuation from the page 6 legend', () => {
    const original = `A B Z,?;:'".!&-*...`;
    const encoded = service.encode(original);

    expect(encoded.output).toBe(
      '1  2  26 27 28 29 30 31 32 33 34 35 36 0 37',
    );

    const decoded = service.decode(encoded.output);

    expect(decoded.output).toBe(original);
    expect(decoded.unmappedSymbols).toEqual([]);
  });

  it('handles empty inputs without throwing', () => {
    expect(service.encode('')).toEqual({
      output: '',
      unmappedSymbols: [],
      mappedCount: 0,
      totalSymbols: 0,
    });

    expect(service.decode('')).toEqual({
      output: '',
      unmappedSymbols: [],
      mappedCount: 0,
      totalSymbols: 0,
    });
  });

  it('tracks unknown characters as unmapped during encoding', () => {
    const result = service.encode('A@Z');

    expect(result.output).toBe('1 @ 26');
    expect(result.unmappedSymbols).toEqual(['@']);
    expect(result.mappedCount).toBe(2);
    expect(result.totalSymbols).toBe(3);
  });

  it('accepts numeric attempts when validating or scoring similarity', () => {
    const attempt = '1  2  26';
    const reflection = 'A B Z';

    expect(service.validateAttempt(attempt, reflection)).toBe(true);
    expect(service.calculateSimilarity(attempt, reflection)).toBe(1);
  });
});
