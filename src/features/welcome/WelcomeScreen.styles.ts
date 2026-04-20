import { makeStyles } from '../../shared/theme';

export const useWelcomeScreenStyles = makeStyles(theme => ({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.xxxl,
  },
  header: {
    gap: theme.spacing.sm,
  },
  actions: {
    gap: theme.spacing.md,
  },
}));
