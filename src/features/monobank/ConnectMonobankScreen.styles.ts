import { makeStyles } from '../../shared/theme';

export const useConnectMonobankScreenStyles = makeStyles(theme => ({
  content: {
    flex: 1,
    gap: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
  },
  header: {
    gap: theme.spacing.xs,
  },
  form: {
    gap: theme.spacing.sm,
  },
  label: {
    color: theme.colors.textSecondary,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    fontSize: theme.typography.body.fontSize,
    lineHeight: theme.typography.body.lineHeight,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.surface,
    minHeight: 40,
    textAlignVertical: 'top',
  },
  hint: {
    color: theme.colors.textMuted,
  },
  error: {
    color: theme.colors.error,
  },
  connectedCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    padding: theme.spacing.lg,
    gap: theme.spacing.xs,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.success,
    borderRadius: theme.radii.pill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  badgeText: {
    color: theme.colors.background,
  },
  spacer: {
    flex: 1,
  },
}));
