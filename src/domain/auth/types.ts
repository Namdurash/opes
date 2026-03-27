export interface User {
  id: string;
  name: string;
  passwordHash: string;
  createdAt: number;
}

export type CardType = 'salary' | 'credit' | 'storage';

export interface Card {
  id: string;
  userId: string;
  title: string;
  moneyAmount: number;
  type: CardType;
  image: string | null;
  createdAt: number;
  sortOrder: number;
}
