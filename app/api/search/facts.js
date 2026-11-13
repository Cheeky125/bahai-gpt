// Phoenix — Quick facts.
// Hand-checked answers to the most common basic questions. Every answer is backed by the passages
// listed in `ids` (shown first, in order, so [1] = ids[0], [2] = ids[1] …).
//
// Rules for adding or editing a fact:
//  - Only cite passages from the Writings or messages themselves, never an editor's introduction,
//    preface, foreword or footnote (those are stored under the book's author and would look like scripture).
//  - Every number, date and name in the answer must be stated in a cited passage, and every phrase
//    in “curly quotes” must appear word-for-word in one of them.
//  - A fact must only fire for a plain who/when/where/how-long question about that exact subject.
//    Questions about what someone *said* or *taught*, or *why* something is so, go to the full search.
//  - After any change, run:  node scripts/test_facts.mjs   (it lists questions that must and must not trigger).

export function normalizeQuestion(s) {
  return " " + String(s)
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[’'ʼ]s\b/g, "") // possessive: "Bahá’u’lláh’s birthday" → "Bahá’u’lláh birthday"
    .replace(/[’‘'`ʼ\-]/g, "")
    .replace(/[^a-z0-9?]+/g, " ")
    .replace(/\babdu?l ?baha\b/g, "abdulbaha")
    .replace(/\bbaha ?u ?llah?\b/g, "bahaullah")
    .replace(/\bthe master\b/g, "abdulbaha")
    .replace(/\?/g, " ")
    .replace(/\s+/g, " ")
    .trim() + " ";
}

const has = (n, re) => re.test(n);

// Words that show the person wants teachings, reasons or passages, not a date or a place.
const TOPICAL = /\b(say|says|said|saying|write|wrote|written|writes|writing|writings|teach|teaches|taught|teaching|teachings|reveal|reveals|revealed|tablets?|quotes?|quotations?|passages?|views?|think|thinks|thought|believe|believes|beliefs?|why|meaning|mean|means|significance|purpose|importance|important|explain|explains|afterlife|soul|spirit|prayers?|pray|praying|feel|feelings|advice|guidance|message|messages|letters?|lessons?|story|stories|talks?|speech|speeches)\b/;
const notTopical = (n) => !TOPICAL.test(n);

const AB = /\babdulbaha\b/;
const BU = /\bbahaullah\b/;
const BAB = /\bbab\b/;
const DEATH = /\b(die|died|dies|death|pass(ed)? away|passing|ascension|ascended)\b/;
const BIRTH = /\b(born|birth|birthday|birthplace)\b/;
const LETTERS = /\bfirst (person )?(to )?believ\w*|\bletters? of the living\b|\bfirst believers?\b|\bwho (was|is) mulla husayn\b/;
const AQDAS_NAMES = "(kitabiaqdas|kitab i aqdas|aqdas|most holy book)";
const IQAN_NAMES = "(kitabiiqan|kitab i iqan|iqan|book of certitude)";
const AQDAS = new RegExp(`\\b${AQDAS_NAMES}\\b`);
const IQAN = new RegExp(`\\b${IQAN_NAMES}\\b`);
// "Who wrote / when was it revealed / where was it revealed / what is it (about)" — questions about a book itself.
const aboutBook = (n, names) =>
  (has(n, /\b(who|when|where|what year|which year)\b/) && has(n, /\b(wrote|write|written|writ|reveal|revealed|composed)\b/)) ||
  new RegExp(`^ (what|whats) (is |was )?(the )?${names} (about )?$`).test(n);

export const FACTS = [
  {
    key: "abdulbaha-death",
    test: (n) => has(n, AB) && has(n, DEATH) && notTopical(n),
    answer: "‘Abdu’l-Bahá passed away in the early hours of 28 November 1921, “in the 78th year of His age” — that is, at the age of 77 [1].",
    ids: ["god-passes-by-00569"],
  },
  {
    key: "abdulbaha-travels",
    test: (n) => has(n, AB) && notTopical(n) && has(n, /\b(travel\w*|journey\w*|visit\w*|tours?|toured|voyage\w*|sail\w*|went to|go to|come to|came to|west|western|america|american|united states|usa|canada|europe|european|england|britain|london|paris|new york)\b/),
    answer: "‘Abdu’l-Bahá sailed for Europe in August 1911 and reached London on 4 September 1911 [1]. On 25 March 1912 He sailed for America, arriving in New York on 11 April 1912; His tour of eight months carried Him “from coast to coast”, and He sailed from New York on 5 December [1]. Shoghi Effendi writes that His journeys to the West, and in particular this tour of the United States, “may be said to have marked the culmination of His ministry” [2]. In all He made three visits to Europe between 1911 and 1913 [3].",
    ids: ["god-passes-by-00517", "god-passes-by-00537", "muhj-1986-2001-02093"],
  },
  {
    key: "bahaullah-burial",
    test: (n) => has(n, BU) && has(n, /\b(buried|burial|bury|tomb|grave|resting place|restingplace|interred|shrine)\b/) && notTopical(n) && !has(n, /\blaws?\b/),
    answer: "Bahá’u’lláh was laid to rest shortly after sunset on the day of His ascension [1], 29 May 1892 [3], in a house adjacent to the Mansion [1]. This is the Tomb of Bahá’u’lláh at Bahjí [2].",
    ids: ["god-passes-by-00408", "god-passes-by-00563", "god-passes-by-00406"],
  },
  {
    key: "bahaullah-death",
    test: (n) => has(n, BU) && has(n, DEATH) && notTopical(n),
    answer: "Bahá’u’lláh ascended at the hour of dawn on 29 May 1892, “in the 75th year of His age” — that is, at the age of 74 [1]. He was laid to rest shortly after sunset the same day, beside the Mansion [2].",
    ids: ["god-passes-by-00406", "god-passes-by-00408"],
  },
  {
    key: "bahaullah-birth",
    test: (n) => has(n, BU) && has(n, BIRTH) && notTopical(n) && !has(n, /\bmission\b/),
    answer: "Bahá’u’lláh was born on 12 November 1817 — the Universal House of Justice marked 12 November 1967 as “the 150th anniversary of Bahá’u’lláh’s birth” [1]. He was born in Ṭihrán (Tehran), where the house of His birth is now a Bahá’í property [2].",
    ids: ["muhj-1963-1986-00478", "god-passes-by-00611"],
  },
  {
    key: "bahaullah-prison",
    test: (n) => has(n, BU) && has(n, /\b(prison\w*|imprison\w*|jail\w*|siyah|chal|siyahchal|exile\w*|banish\w*|incarcerat\w*)\b/) && notTopical(n),
    answer: "In August 1852 Bahá’u’lláh was cast into the Síyáh-Chál in Ṭihrán, where His imprisonment lasted “no less than four months”. His exile then took Him to Baghdád and as far as Adrianople, and ended with His twenty-four years’ incarceration in ‘Akká [1].",
    ids: ["god-passes-by-00162"],
  },
  {
    key: "bab-birth",
    test: (n) => has(n, BAB) && has(n, BIRTH) && !has(n, BU) && notTopical(n),
    answer: "‘Abdu’l-Bahá records that the Báb was born on the first day of Muḥarram in the year 1235 A.H. [1] — the year 1819 [2]. Bahá’u’lláh’s birth fell on the second day of Muḥarram, and Bahá’u’lláh says “These two days are accounted as one in the sight of God” [3].",
    ids: ["travelers-narrative-00003", "muhj-1963-1986-01848", "kitab-i-aqdas-00291"],
  },
  {
    key: "bab-death",
    test: (n) => has(n, BAB) && has(n, /\b(die|died|dies|death|martyr\w*|execut\w*|kill\w*|shot)\b/) && notTopical(n),
    answer: "The Báb was executed on 9 July 1850, “during the thirty-first year of His age and the seventh of His ministry” — that is, at the age of 30 [1].",
    ids: ["god-passes-by-00093"],
  },
  {
    key: "bab-declaration",
    test: (n) => notTopical(n) && ((has(n, BAB) && has(n, /\bdeclar\w*/)) || has(n, /\bbahai (era|faith|religion)\b.*\b(start|started|begin|began|founded|origin)\b/) || has(n, /\b(start|began|begin|founded)\b.*\bbahai (era|faith|religion)\b/)),
    answer: "The Báb declared His mission in Shíráz to Mullá Ḥusayn, the first to believe in Him. Their meeting began in “the hour before sunset, on the 22nd day of May, 1844” and the interview lasted until dawn [1]. The Báb Himself dates the beginning of His Revelation to “when two hours and eleven minutes had passed on the eve of the fifth of Jamádíyu’l-Avval, 1260 A.H.” [2]. Shoghi Effendi writes that “May 23, 1844, signalizes the commencement of the most turbulent period of the Heroic Age of the Bahá’í Era” [3].",
    ids: ["god-passes-by-00017", "selections-writings-bab-00287", "god-passes-by-00015"],
  },
  {
    key: "letters-of-the-living",
    test: (n) => has(n, LETTERS) && notTopical(n.replace(new RegExp(LETTERS.source, "g"), " ")),
    answer: "Mullá Ḥusayn was the first to believe in the Báb [1]. Forty days later the enrollment of the seventeen remaining Letters of the Living began; the last, but first in rank, was Quddús, and one of them, Ṭáhirih, was a woman who never attained the presence of the Báb [2].",
    ids: ["god-passes-by-00017", "god-passes-by-00021"],
  },
  {
    key: "shoghi-effendi",
    test: (n) => notTopical(n) && (has(n, /\bshoghi\b/) || (has(n, /\bthe guardian\b/) && !has(n, /\bangels?\b/))) &&
      has(n, /\bwho (was|is)\b|\b(born|birth|birthday|die|died|death|pass(ed)? away|passing|buried|burial|resting place|grave|appointed|become|became)\b/),
    answer: "Shoghi Effendi was the eldest grandson of ‘Abdu’l-Bahá [1], Who in His Will and Testament named him “the Guardian of the Cause of God” [2]. He was born in 1897 [3] and passed away unexpectedly in November 1957 [4]; his resting-place is in London [5].",
    ids: ["muhj-2001-2022-00577", "will-testament-abdul-baha-00016", "muhj-1963-1986-01233", "uhj-20231128_001-046", "muhj-1963-1986-00056"],
  },
  {
    key: "uhj-first-election",
    test: (n) => has(n, /\b(universal house of justice|uhj)\b/) && notTopical(n) && !has(n, /\bmembers?\b/) &&
      has(n, /\bfirst\b|\b(established|founded|formed|created|began|begin|start|started)\b|\bwhen was\b/),
    answer: "The Universal House of Justice was first elected in 1963 [1], at Riḍván, which marked the end of the Ten Year Crusade [2]. Its members were all in Haifa at the time of the election [3].",
    ids: ["uhj-20231128_001-046", "muhj-1963-1986-00245", "muhj-1963-1986-00056"],
  },
  {
    key: "aqdas",
    test: (n) => has(n, AQDAS) && aboutBook(n, AQDAS_NAMES),
    answer: "The Kitáb-i-Aqdas is Bahá’u’lláh’s “Most Holy Book”, which Shoghi Effendi calls “the Mother Book of His Dispensation, and the Charter of His New World Order” [1]. It was revealed soon after Bahá’u’lláh had been transferred to the house of ‘Údí Khammár, “circa 1873” [2], in ‘Akká [3].",
    ids: ["god-passes-by-00388", "god-passes-by-00389", "muhj-1986-2001-01044"],
  },
  {
    key: "iqan",
    test: (n) => has(n, IQAN) && aboutBook(n, IQAN_NAMES),
    answer: "The Kitáb-i-Íqán (Book of Certitude) was revealed by Bahá’u’lláh around 1862, during His exile in ‘Iráq, “within the space of two days and two nights,” in answer to questions from a maternal uncle of the Báb [1].",
    ids: ["god-passes-by-00229"],
  },
  {
    key: "ridvan",
    test: (n) => has(n, /\bridvan\b/) && notTopical(n) && has(n, /\bwhat (is|was|are)\b|\bwhen\b|\bhow (long|many)\b|\bwhat does ridvan (celebrate|commemorate|mark)\b/),
    answer: "Riḍván is the Most Great Festival, which Bahá’u’lláh calls “the King of Festivals” [1]; it celebrates His Declaration [2]. He tarried in the Garden of Riḍván for twelve days [3], leaving it on 3 May 1863 [4], and work is forbidden on the first, ninth and twelfth days of the Festival [5].",
    ids: ["kitab-i-aqdas-00153", "god-passes-by-00257", "days-remembrance-00115", "god-passes-by-00258", "kitab-i-aqdas-00290"],
  },
  {
    key: "holy-days",
    test: (n) => has(n, /\bholy ?days?\b/) && notTopical(n) && has(n, /\b(what|which|how many|list|when|work|school)\b/),
    answer: "There are nine Holy Days on which work is to be suspended [1]: Naw-Rúz; the first, ninth and twelfth days of Riḍván [2]; the Declaration of the Báb; the Ascension of Bahá’u’lláh; the Martyrdom of the Báb [3]; and the Twin Holy Birthdays, the Birth of the Báb and the Birth of Bahá’u’lláh [4].",
    ids: ["god-passes-by-00669", "kitab-i-aqdas-00290", "muhj-2001-2022-01357", "muhj-2001-2022-01356"],
  },
  {
    key: "fast",
    test: (n) => has(n, /\b(fast|fasting|the fast)\b/) && !has(n, /\b(break ?fast|how fast|so fast|too fast|very fast)\b/) && notTopical(n),
    answer: "Bahá’u’lláh ordained “a fast of nineteen days” [1], kept in the month of ‘Alá [2]: “Abstain from food and drink from sunrise to sundown” [3]. At its close comes the feast of Naw-Rúz [4]. Prayer and fasting are binding “from the beginning of maturity” [5], which is fifteen for both men and women [6]. “The traveler, the ailing, those who are with child or giving suck, are not bound by the Fast” [4], and those “weak from illness or age” are exempted [5].",
    ids: ["summons-lord-hosts-00169", "importance-obligatory-prayer-fasting-00015", "kitab-i-aqdas-00058", "kitab-i-aqdas-00057", "kitab-i-aqdas-00051", "kitab-i-aqdas-00320"],
  },
  {
    key: "age-of-maturity",
    test: (n) => has(n, /\bage of maturity\b/) || (has(n, /\b(what|which) age\b|\bhow old\b/) && has(n, /\b(pray\w*|obligatory|maturity|mature)\b/) && !has(n, /\b(abdulbaha|bahaullah|bab|shoghi)\b/)),
    answer: "The age of maturity for religious duties, such as obligatory prayer and fasting, is fifteen for both men and women [1].",
    ids: ["kitab-i-aqdas-00320", "kitab-i-aqdas-00051"],
  },
  {
    key: "junior-youth",
    test: (n) => has(n, /\bjunior youth\b/) && notTopical(n) && has(n, /\b(age|ages|how old|years old)\b|\bwho (is|are)\b|^ (what is|whats|what are) (a )?junior youths? $/),
    answer: "Junior youth are young people who “fall between the ages of, say, 12 and 15” — a special group between childhood and youth [1].",
    ids: ["muhj-1986-2001-02740"],
  },
  {
    key: "calendar",
    test: (n) => has(n, /\b(calendar|badi)\b/) && notTopical(n) && !has(n, /\b(today|todays|tomorrow|date|now|current)\b/) && has(n, /\b(what|how|when|who|which)\b/),
    answer: "The Báb introduced the Badí‘ calendar and its pattern of months and days, and Bahá’u’lláh provided essential clarifications and additions [1]. Its year has “nineteen months of nineteen days each” [2], and the new year, Naw-Rúz, falls on the day of the vernal equinox [3].",
    ids: ["muhj-2001-2022-01354", "world-order-bahaullah-00253", "muhj-2001-2022-01780"],
  },
];

export function matchFact(q) {
  const n = normalizeQuestion(q);
  return FACTS.find((f) => f.test(n)) || null;
}
