import { makeStyles } from '../../theme';

export const useGlobalBottomSheetStyles = makeStyles(theme => ({
  iconContainer: {
    alignItems: 'center',
    paddingTop: theme.spacing.sm,
  },
  content: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.lg,
  },
  title: {
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
  },
  actions: {
    gap: theme.spacing.sm,
  },
  background: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.radii.lg,
    borderTopRightRadius: theme.radii.lg,
  },
  handle: {
    backgroundColor: theme.colors.border,
  },
}));
