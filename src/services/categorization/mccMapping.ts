import type { CategoryId } from '../../domain/categorization';

interface MccRange {
  from: number;
  to: number;
  categoryId: CategoryId;
}

const MCC_RANGES: MccRange[] = [
  // Transport — rail, bus, taxi, limo, ferry, tolls
  { from: 4011, to: 4011, categoryId: 'transport' },
  { from: 4111, to: 4131, categoryId: 'transport' },
  { from: 4214, to: 4214, categoryId: 'transport' },
  { from: 4411, to: 4411, categoryId: 'transport' },
  { from: 4457, to: 4457, categoryId: 'transport' },
  { from: 4468, to: 4468, categoryId: 'transport' },
  { from: 4511, to: 4511, categoryId: 'transport' },
  { from: 4722, to: 4722, categoryId: 'transport' },
  { from: 4784, to: 4789, categoryId: 'transport' },

  // Utilities — telecom, internet, cable
  { from: 4812, to: 4816, categoryId: 'utilities' },
  { from: 4821, to: 4821, categoryId: 'utilities' },

  // Transfers — wire/money transfer
  { from: 4829, to: 4829, categoryId: 'transfers' },

  // Utilities — electric, gas, water, sanitary
  { from: 4899, to: 4900, categoryId: 'utilities' },

  // Shopping — hardware, nursery, lumber, glass, paint, flooring
  { from: 5200, to: 5200, categoryId: 'shopping' },
  { from: 5211, to: 5261, categoryId: 'shopping' },

  // Shopping — department, variety, misc general merchandise
  { from: 5300, to: 5311, categoryId: 'shopping' },
  { from: 5331, to: 5331, categoryId: 'shopping' },
  { from: 5399, to: 5399, categoryId: 'shopping' },

  // Groceries — grocery stores, supermarkets, meat, bakeries, dairy, candy
  { from: 5411, to: 5411, categoryId: 'groceries' },
  { from: 5422, to: 5422, categoryId: 'groceries' },
  { from: 5441, to: 5441, categoryId: 'groceries' },
  { from: 5451, to: 5451, categoryId: 'groceries' },
  { from: 5462, to: 5462, categoryId: 'groceries' },
  { from: 5499, to: 5499, categoryId: 'groceries' },

  // Transport — fuel stations, automated fuel
  { from: 5541, to: 5542, categoryId: 'transport' },

  // Shopping — apparel, shoes, clothing
  { from: 5137, to: 5139, categoryId: 'shopping' },
  { from: 5611, to: 5699, categoryId: 'shopping' },

  // Shopping — furniture, electronics, appliances, music, records
  { from: 5712, to: 5735, categoryId: 'shopping' },

  // Shopping — computers, software, office equipment
  { from: 5734, to: 5734, categoryId: 'shopping' },
  { from: 5944, to: 5947, categoryId: 'shopping' },
  { from: 5948, to: 5948, categoryId: 'shopping' },
  { from: 5949, to: 5949, categoryId: 'shopping' },

  // Shopping — books, stationery, art supplies
  { from: 5942, to: 5943, categoryId: 'shopping' },
  { from: 5950, to: 5950, categoryId: 'shopping' },
  { from: 5970, to: 5970, categoryId: 'shopping' },

  // Shopping — cosmetics, pharmacies, optical, florists, pet stores
  { from: 5912, to: 5912, categoryId: 'shopping' },
  { from: 5921, to: 5921, categoryId: 'shopping' },
  { from: 5931, to: 5932, categoryId: 'shopping' },
  { from: 5933, to: 5933, categoryId: 'shopping' },
  { from: 5935, to: 5935, categoryId: 'shopping' },
  { from: 5937, to: 5937, categoryId: 'shopping' },
  { from: 5940, to: 5941, categoryId: 'shopping' },
  { from: 5960, to: 5969, categoryId: 'shopping' },
  { from: 5971, to: 5971, categoryId: 'shopping' },
  { from: 5972, to: 5972, categoryId: 'shopping' },
  { from: 5973, to: 5973, categoryId: 'shopping' },
  { from: 5975, to: 5978, categoryId: 'shopping' },
  { from: 5983, to: 5983, categoryId: 'shopping' },
  { from: 5992, to: 5992, categoryId: 'shopping' },
  { from: 5993, to: 5994, categoryId: 'shopping' },
  { from: 5995, to: 5995, categoryId: 'shopping' },
  { from: 5996, to: 5996, categoryId: 'shopping' },
  { from: 5997, to: 5998, categoryId: 'shopping' },
  { from: 5999, to: 5999, categoryId: 'shopping' },

  // Cafes & Restaurants
  { from: 5811, to: 5814, categoryId: 'cafes_restaurants' },

  // Entertainment — digital goods, games, streaming
  { from: 5815, to: 5818, categoryId: 'entertainment' },

  // Transfers — financial institutions, money orders, wire
  { from: 6010, to: 6012, categoryId: 'transfers' },
  { from: 6051, to: 6051, categoryId: 'transfers' },
  { from: 6211, to: 6211, categoryId: 'transfers' },
  { from: 6300, to: 6300, categoryId: 'transfers' },
  { from: 6399, to: 6399, categoryId: 'transfers' },
  { from: 6513, to: 6513, categoryId: 'transfers' },
  { from: 6540, to: 6540, categoryId: 'transfers' },

  // Transport — car rental, parking, repair
  { from: 7511, to: 7519, categoryId: 'transport' },
  { from: 7523, to: 7523, categoryId: 'transport' },
  { from: 7531, to: 7531, categoryId: 'transport' },
  { from: 7534, to: 7535, categoryId: 'transport' },
  { from: 7538, to: 7542, categoryId: 'transport' },
  { from: 7549, to: 7549, categoryId: 'transport' },

  // Entertainment — cinema, theater, amusement
  { from: 7832, to: 7833, categoryId: 'entertainment' },
  { from: 7841, to: 7841, categoryId: 'entertainment' },
  { from: 7911, to: 7911, categoryId: 'entertainment' },
  { from: 7922, to: 7922, categoryId: 'entertainment' },
  { from: 7929, to: 7929, categoryId: 'entertainment' },
  { from: 7932, to: 7933, categoryId: 'entertainment' },
  { from: 7941, to: 7941, categoryId: 'entertainment' },
  { from: 7991, to: 7999, categoryId: 'entertainment' },

  // Donations — charitable, religious organizations
  { from: 8398, to: 8398, categoryId: 'donations' },
  { from: 8661, to: 8661, categoryId: 'donations' },
];

export const resolveCategoryByMcc = (mcc: number): CategoryId => {
  const match = MCC_RANGES.find(
    range => mcc >= range.from && mcc <= range.to,
  );
  return match?.categoryId ?? 'other';
};
