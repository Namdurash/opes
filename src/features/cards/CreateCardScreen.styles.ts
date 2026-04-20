import { makeStyles } from '../../shared/theme';

export const useCreateCardScreenStyles = makeStyles(theme => ({
  content: {
    gap: theme.spacing.md,
  },
  form: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  typeSection: {
    gap: theme.spacing.xs,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  typeButton: {
    minWidth: 96,
  },
  imageSection: {
    gap: theme.spacing.sm,
  },
  previewImage: {
    width: '100%',
    height: 180,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
}));
