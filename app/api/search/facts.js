// Phoenix — Quick facts.
// Hand-checked answers to the most common basic questions. Every answer is backed by the passages
// listed in `ids` (shown first, in order, so [1] = ids[0], [2] = ids[1] …). Only add a fact here
// after confirming the passage text in the library actually says it.

const ASK = /\b(who|what|whats|when|where|how|which|why|is|are|was|were|did|does|do|tell|list)\b|\?/;

export function normalizeQuestion(s) {
  return " " + String(s)
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[’‘'`ʼ\-]/g, "")
    .replace(/[^a-z0-9?]+/g, " ")
    .replace(/\babdu?l ?baha\b/g, "abdulbaha")
    .replace(/\bbaha ?u ?llah?\b/g, "bahaullah")
    .replace(/\bthe master\b/g, "abdulbaha")
    .trim() + " ";
}

const has = (n, re) => re.test(n);

export const FACTS = [
  {
    key: "abdulbaha-death",
    test: (n) => has(n, /abdulbaha/) && has(n, /\b(die|died|dies|death|pass|passed|passing|ascen\w*|how old)\b/),
    answer: "‘Abdu’l-Bahá passed away in the early hours of 28 November 1921, “in the 78th year of His age” — that is, at the age of 77 [1].",
    ids: ["god-passes-by-00569"],
  },
  {
    key: "abdulbaha-travels",
    test: (n) => has(n, /abdulbaha/) && has(n, /\b(travel\w*|journey\w*|west|america|europe|visit\w*|tour)\b/),
    answer: "Between 1911 and 1913 ‘Abdu’l-Bahá made three visits to Europe to spread the Message of Bahá’u’lláh [1], and an eight-month tour of the United States, which Shoghi Effendi calls the culmination of His ministry [2].",
    ids: ["muhj-1986-2001-02093", "god-passes-by-00537"],
  },
  {
    key: "bahaullah-burial",
    test: (n) => has(n, /bahaullah/) && has(n, /\b(buried|burial|bury|tomb|grave|resting|interred|shrine)\b/),
    answer: "Bahá’u’lláh was laid to rest shortly after sunset on the day of His ascension (29 May 1892), in a house adjacent to the Mansion [1]; this is the Tomb of Bahá’u’lláh at Bahjí [2].",
    ids: ["god-passes-by-00408", "god-passes-by-00563", "god-passes-by-00406"],
  },
  {
    key: "bahaullah-death",
    test: (n) => has(n, /bahaullah/) && has(n, /\b(die|died|dies|death|pass|passed|passing|ascen\w*|how old)\b/),
    answer: "Bahá’u’lláh ascended at dawn on 29 May 1892, “in the 75th year of His age” — that is, at the age of 74 [1]. He was laid to rest the same day, beside the Mansion [2].",
    ids: ["god-passes-by-00406", "god-passes-by-00408"],
  },
  {
    key: "bahaullah-birth",
    test: (n) => has(n, /bahaullah/) && has(n, /\b(born|birth|birthday|birthplace)\b/) && !has(n, /mission/),
    answer: "Bahá’u’lláh was born on 12 November 1817 — the Universal House of Justice marked 12 November 1967 as “the 150th anniversary of Bahá’u’lláh’s birth” [1]. He was born in Ṭihrán (Tehran), where the house of His birth is now a Bahá’í property [2].",
    ids: ["muhj-1963-1986-00478", "god-passes-by-00611"],
  },
  {
    key: "bahaullah-prison",
    test: (n) => has(n, /bahaullah/) && has(n, /\b(prison\w*|imprison\w*|jail\w*|siyah|chal|exile\w*|banish\w*|incarcerat\w*)\b/),
    answer: "In August 1852 Bahá’u’lláh was cast into the Síyáh-Chál in Ṭihrán, where He was imprisoned for “no less than four months.” His exile then took Him to Baghdád, Adrianople and finally ‘Akká, where He spent twenty-four years as a prisoner [1].",
    ids: ["god-passes-by-00162"],
  },
  {
    key: "bab-birth",
    test: (n) => has(n, /\bbab\b/) && has(n, /\b(born|birth|birthday)\b/) && !has(n, /bahaullah/),
    answer: "The Báb was born on 20 October 1819 (the first day of Muḥarram, 1235 A.H.) [1].",
    ids: ["selections-writings-bab-00648"],
  },
  {
    key: "bab-death",
    test: (n) => has(n, /\bbab\b/) && has(n, /\b(die|died|dies|death|martyr\w*|execut\w*|kill\w*|shot|how old)\b/),
    answer: "The Báb was executed in Tabríz on 9 July 1850, “during the thirty-first year of His age and the seventh of His ministry” — that is, at the age of 30 [1].",
    ids: ["god-passes-by-00093"],
  },
  {
    key: "bab-declaration",
    test: (n) => (has(n, /\bbab\b/) && has(n, /\bdeclar\w*/)) || has(n, /\bbahai (era|faith|religion)\b.*\b(start|started|begin|began|founded|origin)\b/) || has(n, /\b(start|began|begin|founded)\b.*\bbahai (era|faith|religion)\b/),
    answer: "The Báb declared His mission in Shíráz in the hour before sunset on 22 May 1844, to Mullá Ḥusayn, the first to believe in Him [1]. That date (observed on 23 May) opens the Bahá’í Era, and the Bahá’í calendar begins in 1844 [2][3].",
    ids: ["god-passes-by-00017", "god-passes-by-00015", "days-remembrance-00005"],
  },
  {
    key: "letters-of-the-living",
    test: (n) => has(n, /\bfirst (person )?(to )?believ\w*|\bletters? of the living\b|\bmulla husayn\b|\bfirst believer\b/),
    answer: "Mullá Ḥusayn was the first to believe in the Báb [1]. After forty days the seventeen remaining Letters of the Living were enrolled; the last, but first in rank, was Quddús, and one of them was a woman who never met the Báb in person [2].",
    ids: ["god-passes-by-00017", "god-passes-by-00021"],
  },
  {
    key: "shoghi-effendi",
    test: (n) => has(n, /\b(shoghi|guardian)\b/) && has(n, /\b(who|when|appoint\w*|born|birth|die|died|death|pass|passed|passing|buried|resting)\b/),
    answer: "In His Will and Testament ‘Abdu’l-Bahá appointed His eldest grandson, Shoghi Effendi, as Guardian of the Cause and Interpreter of its teachings [1]. Shoghi Effendi was born in 1897 [2] and passed away in 1957 [3] (the 25th anniversary of his passing was 4 November 1982 [4]); his resting-place is in London [5].",
    ids: ["kitab-i-aqdas-00011", "muhj-1963-1986-01233", "muhj-1963-1986-00009", "muhj-1963-1986-00029", "muhj-1963-1986-00056"],
  },
  {
    key: "uhj-first-election",
    test: (n) => has(n, /\b(universal house of justice|uhj)\b/) && has(n, /\b(first|elect\w*|when|establish\w*|found\w*|formed|start\w*)\b/),
    answer: "The Universal House of Justice was first elected at Riḍván 1963, between 28 April and 2 May 1963 [1].",
    ids: ["muhj-1963-1986-00025"],
  },
  {
    key: "aqdas",
    test: (n) => has(n, /\b(kitabiaqdas|kitab i aqdas|aqdas|most holy book)\b/) && has(n, ASK),
    answer: "The Kitáb-i-Aqdas is Bahá’u’lláh’s Most Holy Book, “the principal repository of the laws of His Revelation” [1]. He revealed it around 1873 [2], in the House of ‘Údí Khammár in ‘Akká [3].",
    ids: ["days-remembrance-00005", "kitab-i-aqdas-00026", "muhj-1986-2001-01044"],
  },
  {
    key: "iqan",
    test: (n) => has(n, /\b(kitabiiqan|kitab i iqan|iqan|book of certitude)\b/) && has(n, ASK),
    answer: "The Kitáb-i-Íqán (Book of Certitude) was revealed by Bahá’u’lláh around 1862, during His exile in ‘Iráq, “within the space of two days and two nights,” in answer to questions from a maternal uncle of the Báb [1].",
    ids: ["god-passes-by-00229"],
  },
  {
    key: "ridvan",
    test: (n) => has(n, /\bridvan\b/) && has(n, ASK),
    answer: "Riḍván, “the King of Festivals,” commemorates Bahá’u’lláh’s declaration of His mission during twelve days, three of which are Holy Days [1]. He tarried in the Garden of Riḍván for those twelve days [2], leaving it on 3 May 1863 [3].",
    ids: ["days-remembrance-00005", "days-remembrance-00115", "god-passes-by-00258"],
  },
  {
    key: "holy-days",
    test: (n) => has(n, /\bholy ?days?\b/) && has(n, ASK),
    answer: "There are nine Bahá’í Holy Days, on which work is to be suspended [1][2]: Naw-Rúz, three days of Riḍván, the Declaration of the Báb, the Birth of the Báb, the Birth of Bahá’u’lláh, the Martyrdom of the Báb, and the Ascension of Bahá’u’lláh [3].",
    ids: ["days-remembrance-00006", "muhj-1963-1986-00339", "days-remembrance-00005"],
  },
  {
    key: "fast",
    test: (n) => has(n, /\b(fast|fasting|the fast)\b/) && !has(n, /\bbreak ?fast\b/) && has(n, ASK),
    answer: "The Fast is kept during the month of ‘Alá, ending with Naw-Rúz; Bahá’ís abstain from food and drink from sunrise to sunset [1][2]. Each Bahá’í month has nineteen days, so the Fast lasts nineteen days [3]. It is binding from the age of 15, with exemptions for travellers, the ill, those over 70, women who are with child or nursing, and some others [2].",
    ids: ["importance-obligatory-prayer-fasting-00015", "kitab-i-aqdas-00479", "world-order-bahaullah-00253"],
  },
  {
    key: "age-of-maturity",
    test: (n) => has(n, /\bage of maturity\b/) || (has(n, /\b(what|which) age\b|\bhow old\b/) && has(n, /\b(fast\w*|pray\w*|obligatory|declare|maturity|mature)\b/)),
    answer: "The age of maturity for religious duties, such as obligatory prayer and fasting, is fifteen for both men and women [1].",
    ids: ["kitab-i-aqdas-00320", "kitab-i-aqdas-00479"],
  },
  {
    key: "junior-youth",
    test: (n) => has(n, /\bjunior youth\b/) && has(n, /\b(age|ages|old|years|who|what)\b/),
    answer: "Junior youth are young people who “fall between the ages of, say, 12 and 15” — a special group between childhood and youth [1].",
    ids: ["muhj-1986-2001-02740"],
  },
  {
    key: "calendar",
    test: (n) => has(n, /\b(calendar|badi)\b/) && has(n, ASK),
    answer: "The Bahá’í (Badí‘) calendar was introduced by the Báb and confirmed by Bahá’u’lláh, Who fixed its start at 1844, the year of the Báb’s declaration [1]. Its year has nineteen months of nineteen days each [2].",
    ids: ["days-remembrance-00005", "world-order-bahaullah-00253"],
  },
];

export function matchFact(q) {
  const n = normalizeQuestion(q);
  return FACTS.find((f) => f.test(n)) || null;
}
