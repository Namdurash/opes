import { makeStyles } from '../../shared/theme';

export const useRegistrationStyles = makeStyles(theme => ({
  content: {
    gap: theme.spacing.md,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.background,
  },
  sectionHeader: {
    marginBottom: theme.spacing.xs,
  },
  addCardButton: {
    marginTop: theme.spacing.xs,
  },
  error: {
    color: theme.colors.error,
  },
}));
