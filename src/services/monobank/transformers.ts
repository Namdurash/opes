import type {
  MonobankRawAccount,
  MonobankRawClientInfo,
  MonobankRawStatementItem,
  MonobankAccount,
  MonobankClientInfo,
  MonobankStatement,
} from './types';

// ISO 4217 numeric → alphabetic symbol
// Covers currencies commonly used by Monobank customers.
const CURRENCY_SYMBOLS: Record<number, string> = {
  980: 'UAH',
  840: 'USD',
  978: 'EUR',
  826: 'GBP',
  756: 'CHF',
  985: 'PLN',
  203: 'CZK',
  348: 'HUF',
  946: 'RON',
  392: 'JPY',
  156: 'CNY',
  124: 'CAD',
  36: 'AUD',
  784: 'AED',
  398: 'KZT',
};

// Number of decimal places (minor units) for each currency.
// Defaults to 2 when not listed.
const MINOR_UNITS: Record<number, number> = {
  392: 0, // JPY
  104: 0, // MMK
  646: 0, // RWF
  800: 0, // UGX
  548: 0, // VUV
  953: 0, // XPF
};

const currencySymbol = (code: number): string => CURRENCY_SYMBOLS[code] ?? String(code);

const toMajorUnits = (amount: number, currencyCode: number): number => {
  const decimals = MINOR_UNITS[currencyCode] ?? 2;
  return amount / Math.pow(10, decimals);
};

const transformAccount = (raw: MonobankRawAccount): MonobankAccount => ({
  id: raw.id,
  sendId: raw.sendId,
  balance: toMajorUnits(raw.balance, raw.currencyCode),
  creditLimit: toMajorUnits(raw.creditLimit, raw.currencyCode),
  type: raw.type,
  currencyCode: raw.currencyCode,
  currencySymbol: currencySymbol(raw.currencyCode),
  maskedPan: raw.maskedPan,
  iban: raw.iban,
});

export const transformClientInfo = (raw: MonobankRawClientInfo): MonobankClientInfo => ({
  clientId: raw.clientId,
  name: raw.name,
  accounts: raw.accounts.map(transformAccount),
});

export const transformStatements = (raw: MonobankRawStatementItem[]): MonobankStatement[] =>
  raw.map(item => ({
    id: item.id,
    time: new Date(item.time * 1000),
    description: item.description,
    mcc: item.mcc,
    amount: toMajorUnits(item.amount, item.currencyCode),
    balance: toMajorUnits(item.balance, item.currencyCode),
    currencyCode: item.currencyCode,
    currencySymbol: currencySymbol(item.currencyCode),
    hold: item.hold,
    comment: item.comment,
  }));
