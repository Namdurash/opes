export interface User {
  id: string;
  name: string;
  passwordHash: string;
  createdAt: number;
}

export interface Card {
  id: string;
  userId: string;
  cardName: string;
  createdAt: number;
}
