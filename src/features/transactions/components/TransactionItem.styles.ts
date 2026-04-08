import { makeStyles } from '../../../shared/theme';

export const useTransactionItemStyles = makeStyles(theme => ({
  container: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  titleContainer: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  amountIncome: {
    color: theme.colors.success,
  },
  amountExpense: {
    color: theme.colors.error,
  },
}));
