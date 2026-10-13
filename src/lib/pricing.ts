export const DEFAULT_MARKUP_RATE = 0.25;

export function computeProposedPrice(sellerPrice: number, markupRate = DEFAULT_MARKUP_RATE) {
  const markup = roundMoney(sellerPrice * markupRate);
  const proposed = roundMoney(sellerPrice + markup);
  return { sellerPrice: roundMoney(sellerPrice), markup, proposed, markupRate };
}

export function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export function formatMoney(value: number, currency = "EUR") {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(value);
}

export type ExtraFeeInput = { amount: number; confirmed: boolean };

export function summarizeFees(fees: ExtraFeeInput[]) {
  const confirmed = roundMoney(fees.filter((f) => f.confirmed).reduce((s, f) => s + f.amount, 0));
  const unconfirmed = roundMoney(fees.filter((f) => !f.confirmed).reduce((s, f) => s + f.amount, 0));
  return { confirmed, unconfirmed, total: roundMoney(confirmed + unconfirmed) };
}

export function estimateTotal(proposedPrice: number, fees: ExtraFeeInput[]) {
  const extra = summarizeFees(fees);
  return {
    proposedPrice: roundMoney(proposedPrice),
    extras: extra,
    estimatedTotal: roundMoney(proposedPrice + extra.total),
  };
}
