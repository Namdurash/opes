import { makeStyles } from '../../shared/theme';

export const useCardDetailScreenStyles = makeStyles(theme => ({
  content: {
    gap: theme.spacing.lg,
  },
  details: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  detailValue: {
    flexShrink: 1,
    textAlign: 'right',
  },
  actions: {
    gap: theme.spacing.sm,
  },
  readOnlyNote: {
    paddingHorizontal: theme.spacing.xs,
  },
}));
