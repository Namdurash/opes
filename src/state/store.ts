import { AppRoute } from '../app/navigation/types';

export interface AppState {
  route: AppRoute;
}

export type AppAction = { type: 'navigate'; route: AppRoute };

export const initialAppState: AppState = {
  route: 'home',
};

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'navigate':
      return { ...state, route: action.route };
    default:
      return state;
  }
}
