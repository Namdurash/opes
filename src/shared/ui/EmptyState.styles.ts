import { makeStyles } from '../theme';

export const useEmptyStateStyles = makeStyles(theme => ({
  container: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  text: {
    textAlign: 'center',
  },
}));
