import { makeStyles } from '../../shared/theme';

export const useConnectMonobankScreenStyles = makeStyles(theme => ({
  content: {
    flexGrow: 1,
    gap: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
  },
  header: {
    gap: theme.spacing.xs,
  },
  form: {
    gap: theme.spacing.sm,
  },
  hint: {
    color: theme.colors.textMuted,
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
