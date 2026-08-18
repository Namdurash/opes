<!-- aif:meta
{ "schema": 1, "ticket": "OPES-59", "lang": "uk", "risk": "high" }
-->

# OPES-59 — Тестова збірка: ізоляція збірки й даних

## Навіщо

Зараз немає середовища, у якому можна ганяти застосунок, не ризикуючи зачепити
реальні дані. Локальна база — не кеш, а єдине джерело істини, тож будь-яка спроба
«просто подивитись, як воно поводиться» відбувається на живих даних, і відкотити її
нізвідки.

Ця зміна дає фундамент: окрему тестову збірку, яка стоїть на пристрої поруч із
реальним застосунком, має власну базу й не має жодного доступу ні до реальних даних,
ні до реального банківського API. Наповнення цієї збірки фікстурами — предмет
окремого тікета (OPES-60); тут закладається саме ізоляція.

## Як вмикається

Тестове середовище — властивість збірки, а не перемикач усередині застосунку.
Вмикається змінною оточення через наявний `src/shared/env` (react-native-config).
Потрібне на обох платформах — iOS і Android.

Тестова збірка має **власний bundle id / applicationId** і ставиться на пристрій
поруч із реальним застосунком, не замінюючи його. Це навмисно: пісочниці різні, тож
і файл бази, і MMKV зі збереженим токеном розділяє операційна система, а не наш код.
Тестова збірка не має читати сховище реального застосунку за жодних обставин. На
домашньому екрані вона підписана інакше, щоб дві встановлені поруч збірки не
плутались; іконка лишається та сама.

Прапорець середовища й bundle id мають виставлятися однією конфігурацією збірки —
щоб не існувало збірки, яка вважає себе тестовою, але живе в пісочниці реального
застосунку.

## Де живуть тестові дані

Тестові дані лежать в окремому файлі бази — та сама схема WatermelonDB, інший файл.
Реальна база застосунку в тестовому режимі не відкривається й не змінюється. Усе, що
з'являється в тестовому режимі, потрапляє тільки в тестову базу.

Ім'я файлу реальної бази мусить лишитись незмінним: користувач звичайної збірки не
має втратити свої дані через цю зміну. Це найважливіша властивість тікета — саме
тут ціна помилки необоротна.

Тестовий користувач один. Розділення даних між кількома тестовими користувачами не
робиться: `transactions` зараз не має `user_id`, а `TransactionsRepository.getAll()`
повертає всі транзакції бази без фільтра, тому чесна багатоюзерність вимагала б
міграції схеми й проскопування запитів — тобто роботи майбутньої фічі зміни
користувачів.

## Monobank у тестовій збірці

Тестова збірка не звертається до `api.monobank.ua` — ніколи й жодним шляхом. Це
стосується і підключення, і всіх тригерів синхронізації: pull-to-refresh на
головному екрані та на екрані транзакцій, автосинку після підключення, автосинку при
відкритті екранів, тихого фонового синку.

Поки фейкового сервісу немає (він приходить в OPES-60), підключення до Monobank у
тестовій збірці просто недоступне: жодного мережевого виклику не відбувається.
Ізоляція від реальних банківських даних мусить триматись на тому, що виклику
фізично не існує, а не на тому, що токен не підійде.

Наслідок для цього тікета: тестова збірка стартує порожньою, і наповнити її можна
лише руками — звичайний екран створення картки працює як завжди й пише в тестову
базу.

## Скидання

У налаштуваннях, лише в тестовій збірці, є дія повного скидання. Вона повертає
застосунок у стан першого запуску: витирає всю тестову базу — включно з тим, що я
створив руками, — відключає токен і чистить усе, що тестова збірка зберігає поза
базою (вибір рахунків, збережені фільтри, прапорці онбордингу). Після цього
застосунок сам, у тій самій сесії, опиняється на екрані підключення — ручного
перезапуску не потрібно. Тож на ньому можна перевіряти й флоу онбордингу, не
перевстановлюючи застосунок.

Поза скиданням тестові дані зберігаються між запусками: створене в одному сеансі є
на місці в наступному.

## Що видно у звичайній збірці

Нічого з переліченого. Спостережувано це означає, що у звичайній збірці немає пункту
скидання в налаштуваннях, тестова база не створюється, а поведінка підключення й
синхронізації не змінюється жодним чином.

## Чого ця зміна не робить

- Не додає фейкового Monobank-сервісу, тестових токенів і фікстур — це OPES-60.
- Не додає перемикання користувачів і не робить багатоюзерність чесною — `user_id`
  у транзакціях не з'являється, запити не проскоповуються.
- Не змінює поведінку звичайної збірки жодним чином.
- Не переписує наявні фічі: списки, фільтри й категоризація лишаються тим самим
  кодом.

## Deliberately left open

- Уся номенклатура: ім'я змінної оточення та її «увімкнене» значення, bundle id та
  підпис тестової збірки на домашньому екрані, ім'я файлу тестової бази, підпис
  пункту скидання в налаштуваннях, імена схеми/флейвора та npm-скриптів для запуску
  тестової збірки.
- Яким механізмом тестовий код тримається поза звичайною збіркою — виключенням із
  бандла на етапі збірки чи рантайм-перевіркою прапорця. Вимога сформульована як
  спостережувана поведінка; спосіб її досягти лишається за специфікацією.
- Де саме спостерігається відсутність мережевого виклику — на рівні monobank-сервісу
  чи на рівні перехопленого HTTP-клієнта.
- Що робити, якщо наявний файл тестової бази створено попередньою версією схеми:
  проганяти звичайні міграції чи дозволено видалити файл і почати заново.
- Чи потрібне підтвердження перед скиданням і наскільки скидання має бути атомарним.
  Мінімум — повторний запуск скидання має приводити застосунок у коректний стан.

## Rework requested at approve

- Assumptions accepted, but one acceptance criterion is missing, and the verification gaps are not accepted as they stand.

1. Missing criterion — cards.

The reset is asserted against transactions (AC-008) and against users (AC-012). Cards are asserted nowhere. Yet in OPES-59 a card is the only thing you can create by hand: there is no fake service and no fixtures yet, and the ticket says so directly — "наповнити її можна лише руками — звичайний екран створення картки". So AC-008 verifies the wiping of something this build can barely contain, while the thing the ticket calls "включно з тим, що я створив руками" goes unverified.

Add one more criterion: after resetSandboxEnvironment(), the row count in cards equals zero.

2. AS-016 is neither asserted nor filed as a gap.

AS-016 claims nothing filter-related is persisted outside the database, and from that infers there are no "saved filters" to clear. The claim is plausible but is neither asserted nor filed as a gap. It should be one or the other.

3. VG-002 is half reducible, and it is the half that hurts.

VG-001 (native configuration) is irreducible — accept. A Gradle flavor, an Xcode scheme and a home-screen label cannot be exercised from jest at all. A manual checklist is the only instrument that exists.

VG-002 bundles three different things:
  - resolveDatabaseName() returns opes with the flag off — verified, AC-003.
  - That value actually reaches the SQLite adapter's options — not verified, and this is a hole in our own code.
  - SQLite, given dbName: 'opes', opens the file opes on a device — not verified, but that is WatermelonDB's contract, not ours.

Point 2 is precisely where the cost of error is irreversible, and it needs no device. The reason the hole exists is that database.ts takes the LokiJS branch under jest, so the SQLite branch never executes in tests at all. Extract the adapter's option-building into a pure function and an in-process test pins that dbName comes from resolveDatabaseName() — which collapses VG-002 down to point 3 alone, i.e. to somebody else's contract.

Add one more criterion on the adapter options: for a non-sandbox build, dbName in the options equals opes. Then restate VG-002 so it honestly covers only "SQLite on a device honours dbName", and that remainder is accepted without discomfort.
