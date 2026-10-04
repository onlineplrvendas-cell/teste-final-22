import { afterEach, describe, expect, it, vi } from 'vitest';
import { getDateStringInSaoPaulo, isCurrentMonthInSP } from '../src/utils/date';
import { maskPhoneBR, normalizePhone } from '../src/utils/phone';

afterEach(() => vi.useRealTimers());

describe('datas em São Paulo', () => {
  it('classifica timestamps pela data local na virada do mês', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-15T12:00:00.000Z'));

    expect(isCurrentMonthInSP('2026-10-01T01:00:00Z')).toBe(false);
    expect(isCurrentMonthInSP('2026-10-01T04:00:00Z')).toBe(true);
    expect(isCurrentMonthInSP('2026-10-01')).toBe(true);
    expect(getDateStringInSaoPaulo('2026-10-01T01:00:00Z')).toBe('2026-09-30');
  });
});

describe('telefones brasileiros', () => {
  it('remove o código do país antes de aplicar a máscara', () => {
    expect(maskPhoneBR('5521999998888')).toBe('(21) 99999-8888');
    expect(maskPhoneBR('5555999998888')).toBe('(55) 99999-8888');
    expect(normalizePhone('55999998888')).toBe('5555999998888');
  });
});