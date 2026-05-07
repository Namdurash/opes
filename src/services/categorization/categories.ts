import type { Category, CategoryId } from '../../domain/categorization';

export const CATEGORIES: Record<CategoryId, Category> = {
  groceries: {
    id: 'groceries',
    label: 'Продукти',
    icon: 'cart',
    emoji: '🛒',
    color: '#4CAF50',
    bgColor: '#FEF3C7',
  },
  transport: {
    id: 'transport',
    label: 'Транспорт',
    icon: 'bus',
    emoji: '🚇',
    color: '#2196F3',
    bgColor: '#DBEAFE',
  },
  entertainment: {
    id: 'entertainment',
    label: 'Розваги',
    icon: 'film',
    emoji: '🎬',
    color: '#9C27B0',
    bgColor: '#F3E8FF',
  },
  cafes_restaurants: {
    id: 'cafes_restaurants',
    label: 'Кафе та ресторани',
    icon: 'coffee',
    emoji: '☕',
    color: '#FF9800',
    bgColor: '#FFE4E6',
  },
  shopping: {
    id: 'shopping',
    label: 'Покупки',
    icon: 'shopping-bag',
    emoji: '🛍️',
    color: '#E91E63',
    bgColor: '#FCE7F3',
  },
  utilities: {
    id: 'utilities',
    label: 'Комунальні',
    icon: 'zap',
    emoji: '💡',
    color: '#009688',
    bgColor: '#ECFDF5',
  },
  transfers: {
    id: 'transfers',
    label: 'Перекази',
    icon: 'arrow-right-left',
    emoji: '💸',
    color: '#78909C',
    bgColor: '#E0F2FE',
  },
  donations: {
    id: 'donations',
    label: 'Донати',
    icon: 'heart',
    emoji: '🫶',
    color: '#8B5CF6',
    bgColor: '#EDE9FE',
  },
  other: {
    id: 'other',
    label: 'Інше',
    icon: 'circle',
    emoji: '🔘',
    color: '#9E9E9E',
    bgColor: '#F4F4F5',
  },
} as const;

export const getCategoryById = (id: CategoryId): Category =>
  CATEGORIES[id] ?? CATEGORIES.other;
