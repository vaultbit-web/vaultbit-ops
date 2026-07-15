/**
 * Cálculo de importes de un presupuesto.
 *
 * Helper puro — NO es Server Action. Se usa en cliente para previsualizar
 * y en server (Server Action) para validar antes de persistir. Single
 * source of truth de la fórmula.
 */

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export interface QuoteAmountsInput {
  base_price_eur: number;
  discount_percent?: number;
  vat_percent?: number;
}

export interface QuoteAmounts {
  subtotal: number;
  vatAmount: number;
  total: number;
}

export function computeQuoteAmounts(input: QuoteAmountsInput): QuoteAmounts {
  const base = Math.max(0, input.base_price_eur);
  const discount = Math.max(0, Math.min(100, input.discount_percent ?? 0));
  const vat = Math.max(0, Math.min(100, input.vat_percent ?? 21));

  const subtotal = round2(base * (1 - discount / 100));
  const vatAmount = round2(subtotal * (vat / 100));
  const total = round2(subtotal + vatAmount);

  return { subtotal, vatAmount, total };
}
