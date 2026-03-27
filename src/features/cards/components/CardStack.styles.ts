import { makeStyles } from '../../../shared/theme';

const CARD_HEIGHT = 160;
const VISIBLE_RATIO = 0.35;

export const CARD_STEP = CARD_HEIGHT * VISIBLE_RATIO;

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
  draggingLayer: {
    shadowColor: theme.colors.textPrimary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
}));
