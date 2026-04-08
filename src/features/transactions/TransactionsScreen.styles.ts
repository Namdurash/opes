import { makeStyles } from '../../shared/theme';

export const useTransactionsScreenStyles = makeStyles(theme => ({
  listContent: {
    paddingBottom: theme.spacing.xl,
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.lg,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: theme.spacing.xxl,
  },
  footer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
}));
