import { makeStyles } from '../../../shared/theme';

export const useCardItemStyles = makeStyles(theme => ({
  container: {
    minHeight: 160,
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radii.md,
    overflow: 'hidden',
  },
  containerContent: {
    flex: 1,
  },
  header: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xs,
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  title: {
    flex: 1,
  },
  amount: {
    flexShrink: 0,
  },
  body: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    marginTop: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  imageBackground: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  image: {
    resizeMode: 'cover',
  },
  imageContent: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.cta,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  placeholder: {
    width: 56,
    height: 56,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.cta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  details: {
    flex: 1,
  },
}));
