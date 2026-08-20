import type { MonobankRawClientInfo, MonobankRawStatementItem } from '../types';

/**
 * One sandbox account holder. `buildStatements` is a function of the clock rather
 * than a stored array — the fake keeps no module-level mutable state (D-015), so
 * every call re-derives "today" from `now`.
 */
export interface SandboxTestUser {
  clientInfo: MonobankRawClientInfo;
  buildStatements: (now: Date) => MonobankRawStatementItem[];
}

const startOfDay = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

interface TodayStatementFixture {
  id: string;
  minutesAgo: number;
  mcc: number;
  amount: number;
  balance: number;
  description: string;
}

interface HistoricalStatementFixture {
  id: string;
  day: number;
  hour: number;
  mcc: number;
  amount: number;
  balance: number;
  description: string;
}

const buildRawItem = (
  id: string,
  timeSec: number,
  mcc: number,
  amount: number,
  balance: number,
  description: string,
): MonobankRawStatementItem => ({
  id,
  time: timeSec,
  description,
  mcc,
  originalMcc: mcc,
  hold: false,
  amount,
  operationAmount: amount,
  currencyCode: 980,
  commissionRate: 0,
  cashbackAmount: 0,
  balance,
});

const buildTodayItem = (fixture: TodayStatementFixture, now: Date): MonobankRawStatementItem => {
  const flooredMs = Math.max(
    startOfDay(now).getTime(),
    now.getTime() - fixture.minutesAgo * 60000,
  );
  return buildRawItem(
    fixture.id,
    Math.floor(flooredMs / 1000),
    fixture.mcc,
    fixture.amount,
    fixture.balance,
    fixture.description,
  );
};

const buildHistoricalItem = (
  fixture: HistoricalStatementFixture,
  now: Date,
  monthsAgo: number,
): MonobankRawStatementItem => {
  const date = new Date(now.getFullYear(), now.getMonth() - monthsAgo, fixture.day, fixture.hour);
  return buildRawItem(
    fixture.id,
    Math.floor(date.getTime() / 1000),
    fixture.mcc,
    fixture.amount,
    fixture.balance,
    fixture.description,
  );
};

// 4 statements dated today. Offsets are fixed minutes-ago, floored at the start of
// today, so they stay inside today at any hour and never land in the future (D-016).
// One of the four (t01) carries a donations MCC.
const TODAY_STATEMENTS: TodayStatementFixture[] = [
  {
    id: 'sandbox-u1-t01',
    minutesAgo: 35,
    mcc: 8398,
    amount: -25000,
    balance: 975000,
    description: 'Благодійний фонд «Повернись живим»',
  },
  {
    id: 'sandbox-u1-t02',
    minutesAgo: 200,
    mcc: 5411,
    amount: -84550,
    balance: 890450,
    description: 'АТБ Маркет',
  },
  {
    id: 'sandbox-u1-t03',
    minutesAgo: 430,
    mcc: 5812,
    amount: -15000,
    balance: 875450,
    description: 'Кафе Львівська Копальня Кави',
  },
  {
    id: 'sandbox-u1-t04',
    minutesAgo: 700,
    mcc: 4111,
    amount: 500000,
    balance: 1375450,
    description: 'Укрзалізниця — повернення',
  },
];

// 20 statements in the previous calendar month. Day 3 repeats (m1-01/m1-02), so the
// month carries a day with more than one statement (D-018). Two carry donations MCCs
// (m1-07 = 8398, m1-13 = 8661).
const MONTH_1_STATEMENTS: HistoricalStatementFixture[] = [
  { id: 'sandbox-u1-m1-01', day: 3, hour: 9, mcc: 5411, amount: -45000, balance: 1200000, description: 'Сільпо' },
  { id: 'sandbox-u1-m1-02', day: 3, hour: 18, mcc: 5812, amount: -32000, balance: 1168000, description: 'Піца Челентано' },
  { id: 'sandbox-u1-m1-03', day: 5, hour: 10, mcc: 4111, amount: -12000, balance: 1156000, description: 'Таксі Uklon' },
  { id: 'sandbox-u1-m1-04', day: 7, hour: 14, mcc: 5941, amount: -25000, balance: 1131000, description: 'Спортмайстер' },
  { id: 'sandbox-u1-m1-05', day: 9, hour: 8, mcc: 4812, amount: -35000, balance: 1096000, description: 'Київстар' },
  { id: 'sandbox-u1-m1-06', day: 11, hour: 20, mcc: 5814, amount: -18000, balance: 1078000, description: 'Макдональдс' },
  { id: 'sandbox-u1-m1-07', day: 13, hour: 12, mcc: 8398, amount: -50000, balance: 1028000, description: 'Благодійний фонд «Повернись живим»' },
  { id: 'sandbox-u1-m1-08', day: 15, hour: 16, mcc: 5411, amount: -67000, balance: 961000, description: 'АТБ Маркет' },
  { id: 'sandbox-u1-m1-09', day: 17, hour: 9, mcc: 7832, amount: -22000, balance: 939000, description: 'Планета Кіно' },
  { id: 'sandbox-u1-m1-10', day: 19, hour: 11, mcc: 5661, amount: -15000, balance: 924000, description: 'Intertop' },
  { id: 'sandbox-u1-m1-11', day: 21, hour: 13, mcc: 4111, amount: -8000, balance: 916000, description: 'Укрзалізниця' },
  { id: 'sandbox-u1-m1-12', day: 23, hour: 17, mcc: 5812, amount: -27000, balance: 889000, description: 'Кафе' },
  { id: 'sandbox-u1-m1-13', day: 25, hour: 19, mcc: 8661, amount: -30000, balance: 859000, description: 'Церква Святого Миколая' },
  { id: 'sandbox-u1-m1-14', day: 2, hour: 10, mcc: 5921, amount: -12000, balance: 847000, description: 'Аптека Подорожник' },
  { id: 'sandbox-u1-m1-15', day: 4, hour: 15, mcc: 4899, amount: -40000, balance: 807000, description: 'Укренерго' },
  { id: 'sandbox-u1-m1-16', day: 6, hour: 21, mcc: 5411, amount: -55000, balance: 752000, description: 'Сільпо' },
  { id: 'sandbox-u1-m1-17', day: 8, hour: 9, mcc: 5541, amount: -60000, balance: 692000, description: 'WOG АЗС' },
  { id: 'sandbox-u1-m1-18', day: 10, hour: 13, mcc: 6011, amount: 1000000, balance: 1692000, description: 'Поповнення рахунку' },
  { id: 'sandbox-u1-m1-19', day: 12, hour: 17, mcc: 5811, amount: -14000, balance: 1678000, description: 'Кафе Львівські Пляцки' },
  { id: 'sandbox-u1-m1-20', day: 14, hour: 20, mcc: 5732, amount: -95000, balance: 1583000, description: 'Comfy' },
];

// 20 statements two calendar months back. Day 2 repeats (m2-01/m2-02) (D-018). One
// statement carries a donations MCC (m2-07 = 8661).
const MONTH_2_STATEMENTS: HistoricalStatementFixture[] = [
  { id: 'sandbox-u1-m2-01', day: 2, hour: 9, mcc: 5411, amount: -43000, balance: 1500000, description: 'Сільпо' },
  { id: 'sandbox-u1-m2-02', day: 2, hour: 19, mcc: 5814, amount: -21000, balance: 1479000, description: 'KFC' },
  { id: 'sandbox-u1-m2-03', day: 4, hour: 11, mcc: 4111, amount: -9000, balance: 1470000, description: 'Таксі Uklon' },
  { id: 'sandbox-u1-m2-04', day: 6, hour: 8, mcc: 4812, amount: -35000, balance: 1435000, description: 'Vodafone' },
  { id: 'sandbox-u1-m2-05', day: 8, hour: 14, mcc: 5661, amount: -18000, balance: 1417000, description: 'Intertop' },
  { id: 'sandbox-u1-m2-06', day: 10, hour: 16, mcc: 5812, amount: -26000, balance: 1391000, description: 'Пузата Хата' },
  { id: 'sandbox-u1-m2-07', day: 12, hour: 9, mcc: 8661, amount: -40000, balance: 1351000, description: 'Червоний Хрест' },
  { id: 'sandbox-u1-m2-08', day: 14, hour: 20, mcc: 5411, amount: -71000, balance: 1280000, description: 'АТБ Маркет' },
  { id: 'sandbox-u1-m2-09', day: 16, hour: 12, mcc: 7832, amount: -22000, balance: 1258000, description: 'Multiplex' },
  { id: 'sandbox-u1-m2-10', day: 18, hour: 15, mcc: 5941, amount: -33000, balance: 1225000, description: 'Спортмайстер' },
  { id: 'sandbox-u1-m2-11', day: 20, hour: 17, mcc: 4899, amount: -45000, balance: 1180000, description: 'Київенерго' },
  { id: 'sandbox-u1-m2-12', day: 22, hour: 10, mcc: 6011, amount: 800000, balance: 1980000, description: 'Поповнення рахунку' },
  { id: 'sandbox-u1-m2-13', day: 24, hour: 13, mcc: 5541, amount: -55000, balance: 1925000, description: 'ОККО АЗС' },
  { id: 'sandbox-u1-m2-14', day: 26, hour: 18, mcc: 5921, amount: -13000, balance: 1912000, description: 'Аптека Подорожник' },
  { id: 'sandbox-u1-m2-15', day: 1, hour: 9, mcc: 5411, amount: -47000, balance: 1865000, description: 'Novus' },
  { id: 'sandbox-u1-m2-16', day: 3, hour: 11, mcc: 5732, amount: -120000, balance: 1745000, description: 'Rozetka' },
  { id: 'sandbox-u1-m2-17', day: 5, hour: 14, mcc: 5811, amount: -16000, balance: 1729000, description: "Кав'ярня Aroma Kava" },
  { id: 'sandbox-u1-m2-18', day: 7, hour: 16, mcc: 4111, amount: -7000, balance: 1722000, description: 'Bolt' },
  { id: 'sandbox-u1-m2-19', day: 9, hour: 19, mcc: 5912, amount: -9000, balance: 1713000, description: 'Аптека' },
  { id: 'sandbox-u1-m2-20', day: 11, hour: 21, mcc: 5651, amount: -25000, balance: 1688000, description: 'Zara' },
];

const TEST_USER_1: SandboxTestUser = {
  clientInfo: {
    clientId: 'sandbox-client-1',
    name: 'Sandbox Test User',
    webHookUrl: '',
    permissions: 'psfj',
    accounts: [
      {
        id: 'sandbox-acc-1',
        sendId: 'sandbox-send-1',
        balance: 1000000,
        creditLimit: 0,
        type: 'black',
        currencyCode: 980,
        cashbackType: 'None',
        maskedPan: ['537541******1234'],
        iban: 'UA123456789012345678901234567',
      },
    ],
    jars: [],
  },
  buildStatements: (now: Date): MonobankRawStatementItem[] => [
    ...TODAY_STATEMENTS.map(fixture => buildTodayItem(fixture, now)),
    ...MONTH_1_STATEMENTS.map(fixture => buildHistoricalItem(fixture, now, 1)),
    ...MONTH_2_STATEMENTS.map(fixture => buildHistoricalItem(fixture, now, 2)),
  ],
};

/** The one token this sandbox build recognises. Exact, case-sensitive lookup. */
export const SANDBOX_TEST_USERS = new Map<string, SandboxTestUser>([
  ['test-user-1', TEST_USER_1],
]);
