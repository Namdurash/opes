import { MonobankService } from './api';

let cached: { token: string; service: MonobankService } | null = null;

export const getMonobankService = (token: string): MonobankService => {
  if (!cached || cached.token !== token) {
    cached = { token, service: new MonobankService(token) };
  }
  return cached.service;
};

export const clearMonobankService = (): void => {
  cached = null;
};
