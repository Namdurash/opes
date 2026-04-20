import { makeStyles } from '../../shared/theme';

export const useHomeScreenStyles = makeStyles(theme => ({
  content: {
    gap: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  header: {
    gap: theme.spacing.xs,
  },
  quickActions: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
  },
  quickActionsButton: {
    marginTop: theme.spacing.sm,
  },
}));
