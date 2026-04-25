import { makeStyles } from '../../../shared/theme';

export const useTransactionItemStyles = makeStyles(theme => ({
  container: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  categoryDot: {
    width: 36,
    height: 36,
    borderRadius: theme.radii.sm,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: theme.spacing.md,
  },
  dotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  content: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  categoryLabel: {
    marginTop: 2,
  },
  amountIncome: {
    color: theme.colors.success,
  },
  amountExpense: {
    color: theme.colors.error,
  },
}));
