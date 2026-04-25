import type { Category, CategoryId } from '../../domain/categorization';

export const CATEGORIES: Record<CategoryId, Category> = {
  groceries: {
    id: 'groceries',
    label: 'Продукти',
    icon: 'cart',
    color: '#4CAF50',
  },
  transport: {
    id: 'transport',
    label: 'Транспорт',
    icon: 'bus',
    color: '#2196F3',
  },
  entertainment: {
    id: 'entertainment',
    label: 'Розваги',
    icon: 'film',
    color: '#9C27B0',
  },
  cafes_restaurants: {
    id: 'cafes_restaurants',
    label: 'Кафе та ресторани',
    icon: 'coffee',
    color: '#FF9800',
  },
  shopping: {
    id: 'shopping',
    label: 'Покупки',
    icon: 'shopping-bag',
    color: '#E91E63',
  },
  utilities: {
    id: 'utilities',
    label: 'Комунальні',
    icon: 'zap',
    color: '#009688',
  },
  transfers: {
    id: 'transfers',
    label: 'Перекази',
    icon: 'arrow-right-left',
    color: '#78909C',
  },
  donations: {
    id: 'donations',
    label: 'Донати',
    icon: 'heart',
    color: '#FFC107',
  },
  other: {
    id: 'other',
    label: 'Інше',
    icon: 'circle',
    color: '#9E9E9E',
  },
} as const;

export const getCategoryById = (id: CategoryId): Category =>
  CATEGORIES[id] ?? CATEGORIES.other;
