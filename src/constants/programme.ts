export const BUDGET_BANDS = [
  'Below $10,000',
  '$10,000–$50,000',
  '$50,001–$100,000',
  '$100,001–$500,000',
  'Above $500,000',
] as const

export type BudgetBand = (typeof BUDGET_BANDS)[number]
