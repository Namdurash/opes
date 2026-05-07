import { makeStyles } from '../../../shared/theme';

export const useTransactionListItemStyles = makeStyles(theme => ({
  pressable: {
    borderRadius: 20,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 14,
    backgroundColor: theme.colors.background,
    overflow: 'hidden' as const,
  },
  row: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 14,
  },
  accentStripe: {
    position: 'absolute' as const,
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  iconBlock: {
    width: 48,
    height: 48,
  },
  iconGlow: {
    position: 'absolute' as const,
    width: 48,
    height: 48,
    borderRadius: 15,
    opacity: 0.4,
    transform: [{ translateY: 3 }],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  iconSurface: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  emoji: {
    fontSize: 21,
  },
  content: {
    flex: 1,
    gap: 3,
  },
  topRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: theme.spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700' as const,
    color: theme.colors.textPrimary,
    lineHeight: 20,
  },
  titleIncome: {
    color: '#15803D',
  },
  amount: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: theme.colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  amountIncome: {
    color: theme.colors.success,
  },
  bottomRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: theme.spacing.sm,
  },
  meta: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.textMuted,
    lineHeight: 18,
  },
  cashbackPill: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: 'rgba(20,184,166,0.08)',
    borderRadius: theme.radii.pill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    gap: 3,
  },
  cashbackText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: theme.colors.cta,
  },
  chevron: {
    fontSize: 16,
    color: theme.colors.textMuted,
    opacity: 0.22,
  },
  pendingBadge: {
    position: 'absolute' as const,
    top: 8,
    right: 10,
    backgroundColor: '#FFFBEB',
    borderRadius: theme.radii.pill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
  },
  pendingText: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: '#D97706',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
}));
