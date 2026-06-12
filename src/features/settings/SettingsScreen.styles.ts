import { makeStyles } from '../../shared/theme';

export const useSettingsScreenStyles = makeStyles(theme => ({
  content: {
    gap: theme.spacing.xl,
  },
  section: {
    gap: theme.spacing.sm,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  settingInfo: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  exportButtons: {
    gap: theme.spacing.sm,
  },
}));
