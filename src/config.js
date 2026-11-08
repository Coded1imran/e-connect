// ─────────────────────────────────────────────────────────────
// E-Connect Global Config
// Change things here — no need to touch any other file.
// ─────────────────────────────────────────────────────────────

export const APP_NAME = 'E-Connect';

// Verified Lecturer Badge subscription.
// PLACEHOLDER PRICE — replace `amount` / `currency` when final pricing is decided.
export const SUBSCRIPTION = {
  name: 'Verified Lecturer Badge',
  amount: 9.99,
  currency: '$',
  period: 'month', // billed per month
  durationDays: 30,
};

// e.g. "$9.99/month"
export const PRICE_LABEL = `${SUBSCRIPTION.currency}${SUBSCRIPTION.amount}/${SUBSCRIPTION.period}`;

// Demo credentials shown on the login page
export const DEMO_ACCOUNTS = {
  student: { email: 'sara@student.com', password: 'pass123' },
  lecturer: { email: 'dr.ade@econnect.com', password: 'pass123' },
};
