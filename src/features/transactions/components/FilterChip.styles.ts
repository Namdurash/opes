import { makeStyles } from '../../../shared/theme';

export const useFilterChipStyles = makeStyles(theme => ({
  pill: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.radii.pill,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
  },
  label: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  dismissButton: {
    padding: theme.spacing.sm,
  },
  dismissText: {
    fontSize: 16,
    color: theme.colors.textMuted,
  },
}));
