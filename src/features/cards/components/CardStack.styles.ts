import { makeStyles } from '../../../shared/theme';

const CARD_HEIGHT = 160;
const VISIBLE_RATIO = 0.35;

export const useCardStackStyles = makeStyles(theme => ({
  container: {
    paddingBottom: theme.spacing.xs,
  },
  cardLayer: {
    position: 'relative',
  },
  overlapLayer: {
    marginTop: -(CARD_HEIGHT * (1 - VISIBLE_RATIO)),
  },
}));
