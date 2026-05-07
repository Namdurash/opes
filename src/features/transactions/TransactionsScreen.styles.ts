import { makeStyles } from '../../shared/theme';

export const useTransactionsScreenStyles = makeStyles(theme => ({
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: theme.spacing.xxl,
  },
  footer: {
    paddingVertical: theme.spacing.md,
  },
}));
