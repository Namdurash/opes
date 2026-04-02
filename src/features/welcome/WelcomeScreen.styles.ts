import { makeStyles } from '../../shared/theme';

export const useWelcomeScreenStyles = makeStyles(() => ({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 48,
  },
  header: {
    gap: 8,
  },
  actions: {
    gap: 12,
  },
}));
