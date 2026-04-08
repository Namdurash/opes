import { makeStyles } from '../../../shared/theme';

export const useSectionHeaderStyles = makeStyles(theme => ({
  container: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
  },
}));
