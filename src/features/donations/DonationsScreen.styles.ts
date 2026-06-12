import { makeStyles } from '../../shared/theme';

export const useDonationsScreenStyles = makeStyles(theme => ({
  content: {
    gap: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  hero: {
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: theme.spacing.xl,
  },
  heroAmount: {
    color: theme.colors.primary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  listSection: {
    gap: theme.spacing.sm,
  },
  donationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  donationInfo: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  donationAmount: {
    color: theme.colors.primary,
    flexShrink: 0,
  },
}));
