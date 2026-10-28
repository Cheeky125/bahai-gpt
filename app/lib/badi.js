// Phoenix — the Badí‘ (Bahá’í) calendar.
// Naw-Rúz and the Twin Holy Birthdays move from year to year; their dates for 172–221 B.E. (2015–2064) come
// from the table issued by the Universal House of Justice (as packed in the MIT-licensed BadiDate library:
// day of March for Naw-Rúz, days of Ayyám-i-Há, then month and day of the Birth of the Báb, in base 36).
// Checked against bahai.org/calendar for 183 B.E. Everything else follows from the fixed dates in the
// Kitáb-i-Aqdas and the House of Justice's letter of 10 July 2014.

const YEARS = [
  "l4da", "k4ci", "k5c7", "l4d6", "l4ce", "k4c4", "k5d4", "l4cb", "l4c1", "k4cj", "k5c8", "l4d7", "l4cf", "k4c5",
  "k4d5", "k5ce", "l4c2", "k4d2", "k4ca", "k5da", "l4ch", "k4c6", "k4d6", "k5cf", "l4c4", "k4d4", "k4cc", "k5c1",
  "l4cj", "k4c8", "k4d8", "k5cg", "l4c5", "k4d5", "k4ce", "k5c3", "l4d2", "k4ca", "k4d9", "k5ci", "l4c6", "k4d6",
  "k4cf", "k4c4", "k5d4", "k4cb", "k4bj", "k4cj", "k5c9", "k4d8",
]; // 172 … 221 B.E.
export const FIRST_YEAR = 172, LAST_YEAR = 172 + YEARS.length - 1;

export const MONTHS = [
  ["Bahá", "Splendour"], ["Jalál", "Glory"], ["Jamál", "Beauty"], ["‘Aẓamat", "Grandeur"], ["Núr", "Light"],
  ["Raḥmat", "Mercy"], ["Kalimát", "Words"], ["Kamál", "Perfection"], ["Asmá’", "Names"], ["‘Izzat", "Might"],
  ["Mashíyyat", "Will"], ["‘Ilm", "Knowledge"], ["Qudrat", "Power"], ["Qawl", "Speech"], ["Masá’il", "Questions"],
  ["Sharaf", "Honour"], ["Sulṭán", "Sovereignty"], ["Mulk", "Dominion"], ["‘Alá’", "Loftiness"],
]; // month 0 = Ayyám-i-Há (between Mulk and ‘Alá’)

// Dates are plain calendar days, handled as UTC midnight so time zones never shift them.
const DAY = 86400000;
export const ymd = (y, m, d) => Date.UTC(y, m - 1, d);
export const fromKey = (k) => { const [y, m, d] = k.split("-").map(Number); return ymd(y, m, d); };
export const toKey = (t) => new Date(t).toISOString().slice(0, 10);
export const addDays = (t, n) => t + n * DAY;
export const daysBetween = (a, b) => Math.round((b - a) / DAY);

function yearInfo(by) {
  const c = YEARS[by - FIRST_YEAR];
  if (!c) return null;
  const g = by - FIRST_YEAR + 2015;
  return { nawRuz: ymd(g, 3, parseInt(c[0], 36)), ayyam: parseInt(c[1], 36), twin: [parseInt(c[2], 36), parseInt(c[3], 36)] };
}

// Day of the Bahá’í year (1 = Naw-Rúz) → [month, day]; month 0 is Ayyám-i-Há
function monthDay(doy, ayyam) {
  if (doy <= 342) return [Math.floor((doy - 1) / 19) + 1, ((doy - 1) % 19) + 1];
  if (doy <= 342 + ayyam) return [0, doy - 342];
  return [19, doy - 342 - ayyam];
}
function dayOfYear(month, day, ayyam) {
  if (month === 0) return 342 + day;
  if (month === 19) return 342 + ayyam + day;
  return (month - 1) * 19 + day;
}

// Gregorian day → { year, month, day, monthName, meaning } (the daytime part of the day; days begin at sunset)
export function badiDate(t) {
  const g = new Date(t).getUTCFullYear();
  let by = g - 1844 + (t >= (yearInfo(g - 1844 + 1)?.nawRuz ?? Infinity) ? 1 : 0);
  const info = yearInfo(by);
  if (!info) return null;
  const [month, day] = monthDay(daysBetween(info.nawRuz, t) + 1, info.ayyam);
  return { year: by, month, day, monthName: month ? MONTHS[month - 1][0] : "Ayyám-i-Há", meaning: month ? MONTHS[month - 1][1] : "The Days of Há" };
}
export function gregorian(by, month, day) {
  const info = yearInfo(by);
  return info ? addDays(info.nawRuz, dayOfYear(month, day, info.ayyam) - 1) : null;
}

// Holy Days and anniversaries. off: work is suspended. note: a short, factual description.
const FIXED = [
  { name: "Naw-Rúz", m: 1, d: 1, off: true, note: "The Bahá’í New Year, at the spring equinox, right after the Fast.", theme: "Naw-Rúz, the new day and spiritual springtime" },
  { name: "First Day of Riḍván", m: 2, d: 13, off: true, note: "Bahá’u’lláh declares His mission in the Garden of Riḍván, Baghdad, 1863 — the start of the twelve-day Festival.", theme: "The Festival of Riḍván and the declaration of Bahá’u’lláh" },
  { name: "Ninth Day of Riḍván", m: 3, d: 2, off: true, note: "Bahá’u’lláh’s family joins Him in the Garden of Riḍván.", theme: "The Festival of Riḍván, the King of Festivals" },
  { name: "Twelfth Day of Riḍván", m: 3, d: 5, off: true, note: "Bahá’u’lláh leaves the Garden of Riḍván for Constantinople.", theme: "The Festival of Riḍván and the departure of Bahá’u’lláh from Baghdad" },
  { name: "Declaration of the Báb", m: 4, d: 8, off: true, note: "The Báb declares His mission to Mullá Ḥusayn in Shíráz, 1844, about two hours after sunset.", theme: "The Declaration of the Báb" },
  { name: "Ascension of Bahá’u’lláh", m: 4, d: 13, off: true, note: "Bahá’u’lláh passes away at Bahjí, near ‘Akká, in 1892. Commemorated at 3 a.m.", theme: "The Ascension of Bahá’u’lláh" },
  { name: "Martyrdom of the Báb", m: 6, d: 17, off: true, note: "The Báb is executed in Tabríz in 1850. Commemorated at about noon.", theme: "The Martyrdom of the Báb" },
  { name: "Day of the Covenant", m: 14, d: 4, off: false, note: "Celebrates the Covenant of Bahá’u’lláh and ‘Abdu’l-Bahá as its Centre.", theme: "The Covenant and ‘Abdu’l-Bahá, the Centre of the Covenant" },
  { name: "Ascension of ‘Abdu’l-Bahá", m: 14, d: 6, off: false, note: "‘Abdu’l-Bahá passes away in Haifa in 1921. Commemorated at 1 a.m.", theme: "The Ascension of ‘Abdu’l-Bahá" },
];
export function holyDays(by) {
  const info = yearInfo(by);
  if (!info) return [];
  const [tm, td] = info.twin;
  const [tm2, td2] = td < 19 ? [tm, td + 1] : [tm + 1, 1];
  const list = [
    ...FIXED,
    { name: "Birth of the Báb", m: tm, d: td, off: true, note: "The Báb is born in Shíráz in 1819. Together with the next day, the Twin Holy Birthdays.", theme: "The Birth of the Báb" },
    { name: "Birth of Bahá’u’lláh", m: tm2, d: td2, off: true, note: "Bahá’u’lláh is born in Ṭihrán in 1817. Together with the day before, the Twin Holy Birthdays.", theme: "The Birth of Bahá’u’lláh" },
  ];
  return list.map((h) => ({ ...h, kind: "holyday", year: by, date: gregorian(by, h.m, h.d) })).sort((a, b) => a.date - b.date);
}
export function feasts(by) {
  return MONTHS.map(([name, meaning], i) => ({ kind: "feast", name: `Feast of ${name}`, meaning, month: i + 1, year: by, date: gregorian(by, i + 1, 1), theme: meaning }));
}
export function fast(by) {
  const start = gregorian(by, 19, 1);
  return start == null ? null : { start, end: addDays(start, 18) };
}
// Everything from day t onwards, soonest first
export function upcoming(t, n = 12) {
  const b = badiDate(t);
  if (!b) return [];
  const out = [];
  for (const by of [b.year, b.year + 1]) {
    if (by > LAST_YEAR) break;
    for (const e of [...holyDays(by), ...feasts(by)]) if (e.date >= t) out.push(e);
    const f = fast(by);
    if (f && f.start >= t) out.push({ kind: "fast", name: "The Fast begins", date: f.start, end: f.end, year: by });
  }
  // the Feast of Bahá falls on Naw-Rúz: show it as Naw-Rúz
  return out.filter((e) => !(e.kind === "feast" && e.month === 1)).sort((a, b) => a.date - b.date || (a.kind === "holyday" ? -1 : 1)).slice(0, n);
}
export const fmtDate = (t, opts = { weekday: "short", day: "numeric", month: "long" }) =>
  new Date(t).toLocaleDateString("en-GB", { ...opts, timeZone: "UTC" });
export const badiString = (b) => (b ? `${b.day} ${b.monthName} ${b.year} B.E.` : "");
