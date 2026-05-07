import type { Transaction } from '../transactions';

export type CategoryId =
  | 'groceries'
  | 'transport'
  | 'entertainment'
  | 'cafes_restaurants'
  | 'shopping'
  | 'utilities'
  | 'transfers'
  | 'donations'
  | 'other';

export interface Category {
  id: CategoryId;
  label: string;
  icon: string;
  emoji: string;
  color: string;
  bgColor: string;
}

export interface UserOverride {
  id: string;
  transactionId: string;
  categoryId: CategoryId;
  createdAt: number;
}

export interface MerchantRule {
  id: string;
  merchantName: string;
  categoryId: CategoryId;
  createdAt: number;
}

export interface CategorizedTransaction {
  transaction: Transaction;
  category: Category;
}
