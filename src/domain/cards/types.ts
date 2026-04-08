export type CardType = 'salary' | 'credit' | 'storage' | 'monobank';

export interface Card {
  id: string;
  userId: string;
  title: string;
  moneyAmount: number;
  type: CardType;
  image: string | null;
  createdAt: number;
  sortOrder: number;
  monobankAccountId: string | null;
  currencyCode: number | null;
  currencySymbol: string | null;
  iban: string | null;
  maskedPan: string | null;
  creditLimit: number | null;
  monobankBalance: number | null;
}
