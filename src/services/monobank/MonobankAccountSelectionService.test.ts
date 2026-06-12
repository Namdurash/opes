import { MonobankAccountSelectionService } from './MonobankAccountSelectionService';

const makeStorage = (initial: Record<string, string> = {}) => {
  const data = new Map<string, string>(Object.entries(initial));
  return {
    set: (key: string, value: string): void => {
      data.set(key, value);
    },
    getString: (key: string): string | undefined => data.get(key),
    delete: (key: string): void => {
      data.delete(key);
    },
  };
};

describe('MonobankAccountSelectionService', () => {
  it('returns null when the user has not chosen yet (= sync all)', () => {
    const service = new MonobankAccountSelectionService(makeStorage());
    expect(service.getSelectedAccountIds()).toBeNull();
  });

  it('round-trips an explicit selection', () => {
    const service = new MonobankAccountSelectionService(makeStorage());
    service.setSelectedAccountIds(['acc-a', 'acc-b']);
    expect(service.getSelectedAccountIds()).toEqual(['acc-a', 'acc-b']);
  });

  it('persists an empty selection as an empty list (not null)', () => {
    const service = new MonobankAccountSelectionService(makeStorage());
    service.setSelectedAccountIds([]);
    expect(service.getSelectedAccountIds()).toEqual([]);
  });

  it('clears the selection back to null', () => {
    const service = new MonobankAccountSelectionService(makeStorage());
    service.setSelectedAccountIds(['acc-a']);
    service.clear();
    expect(service.getSelectedAccountIds()).toBeNull();
  });

  it('treats malformed stored data as no selection', () => {
    const service = new MonobankAccountSelectionService(
      makeStorage({ monobank_selected_account_ids: '{"not":"an array"}' }),
    );
    expect(service.getSelectedAccountIds()).toBeNull();
  });
});
