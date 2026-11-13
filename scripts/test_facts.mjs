// Phoenix — checks which questions trigger a Quick fact.
// Run from the project folder:   node scripts/test_facts.mjs
// Every line below is a real question. "fires" lists questions that must get that exact Quick fact;
// "silent" lists questions that must NOT get any Quick fact (they go to the full search instead).
// If you change app/api/search/facts.js, run this and make sure it ends with "All good".
import { matchFact, FACTS } from "../app/api/search/facts.js";

const fires = {
  "abdulbaha-death": ["When did ‘Abdu’l-Bahá pass away?", "How old was Abdul Baha when he died?", "When did the Master die?", "Ascension of Abdu'l-Baha date"],
  "abdulbaha-travels": ["What year did ‘Abdu’l-Bahá visit America?", "When did Abdul-Baha travel to the West?", "Abdu'l-Baha's journeys to Europe", "When did ‘Abdu’l-Bahá go to London?"],
  "bahaullah-burial": ["Where is Bahá’u’lláh buried?", "Where is the Shrine of Bahá’u’lláh?", "Bahaullah tomb"],
  "bahaullah-death": ["When did Bahá’u’lláh pass away?", "How old was Baha'u'llah when he died?", "Ascension of Baháʼuʼlláh"],
  "bahaullah-birth": ["When was Bahá’u’lláh born?", "Where was Baha'u'llah born?", "Bahá’u’lláh's birthday"],
  "bahaullah-prison": ["How long was Bahá’u’lláh in prison?", "Where was Bahá’u’lláh imprisoned?", "Siyah-Chal Bahaullah", "Where was Bahá’u’lláh exiled?"],
  "bab-birth": ["When was the Báb born?", "The Bab's birthday"],
  "bab-death": ["How old was the Báb when He was martyred?", "When was the Bab executed?", "When did the Báb die?"],
  "bab-declaration": ["When did the Báb declare His mission?", "When did the Bahá’í Faith begin?", "When was the Bahai faith founded?"],
  "letters-of-the-living": ["Who was the first person to believe in the Báb?", "Who were the Letters of the Living?", "Who was Mulla Husayn?"],
  "shoghi-effendi": ["When did Shoghi Effendi pass away?", "Who was Shoghi Effendi?", "Where is Shoghi Effendi buried?", "When was the Guardian born?"],
  "uhj-first-election": ["When was the Universal House of Justice first elected?", "When was the Universal House of Justice established?", "When was the UHJ founded?"],
  "aqdas": ["What is the Kitáb-i-Aqdas?", "When was the Kitab-i-Aqdas revealed?", "Where was the Aqdas revealed?", "What is the Most Holy Book about?"],
  "iqan": ["Who wrote the Kitáb-i-Íqán?", "When was the Kitab-i-Iqan revealed?", "What is the Book of Certitude?"],
  "ridvan": ["What is Riḍván?", "When is Ridvan?", "How long is Ridvan?", "What does Ridván celebrate?"],
  "holy-days": ["What are the Bahá’í Holy Days?", "How many Holy Days are there?", "Can I work on Holy Days?"],
  "fast": ["How long is the Bahá’í fast?", "When is the Fast?", "Who is exempt from fasting?", "Do Bahá’ís fast?", "At what age do Bahá’ís start fasting?"],
  "age-of-maturity": ["What is the age of maturity?", "At what age do you start saying the obligatory prayer?"],
  "junior-youth": ["What age are junior youth?", "Who are junior youth?", "What is a junior youth?"],
  "calendar": ["What is the Bahá’í calendar?", "How does the Badi calendar work?", "How many months are in the Bahá’í calendar?"],
};

const silent = [
  // from the November 2026 audit: these got a wrong Quick fact before
  "What does Bahá’u’lláh say about death?",
  "What did ‘Abdu’l-Bahá say about death and the afterlife?",
  "Why do Bahá’ís fast?",
  "What did Bahá’u’lláh write in prison?",
  // more traps
  "What is the purpose of fasting?",
  "Prayer for the Fast",
  "How fast did the Faith spread?",
  "What does the Aqdas say about marriage?",
  "What are the laws of the Kitáb-i-Aqdas?",
  "What does the Kitab-i-Iqan teach about progressive revelation?",
  "What did Shoghi Effendi write about the Administrative Order?",
  "Who did Shoghi Effendi appoint as Hands of the Cause?",
  "What did the Universal House of Justice say in the Riḍván 2026 message?",
  "When is the Universal House of Justice elected?",
  "How are members of the Universal House of Justice elected?",
  "Who are the members of the Universal House of Justice?",
  "Why was the Báb executed?",
  "What does Bahá’u’lláh say about burial?",
  "Prayers for the Birth of Bahá’u’lláh",
  "What did ‘Abdu’l-Bahá say in Paris?",
  "Paris Talks",
  "Tablet of Visitation of Bahá’u’lláh",
  "What do junior youth study?",
  "What is today's date in the Bahá’í calendar?",
  "What is the meaning of Riḍván?",
  "How should Bahá’ís observe Holy Days?",
  "What happens to the soul after death?",
  "What is the capital of France?",
  "Who is Bahá’u’lláh?",
  "Who was Táhirih?",
  "Who is my guardian angel?",
  "What did the Letters of the Living teach?",
];

let bad = 0;
for (const [key, qs] of Object.entries(fires)) {
  if (!FACTS.some((f) => f.key === key)) { console.log(`✗ unknown fact "${key}"`); bad++; continue; }
  for (const q of qs) {
    const got = matchFact(q)?.key || null;
    if (got !== key) { console.log(`✗ "${q}" should give ${key}, got ${got || "nothing"}`); bad++; }
  }
}
for (const q of silent) {
  const got = matchFact(q)?.key || null;
  if (got) { console.log(`✗ "${q}" should get no Quick fact, got ${got}`); bad++; }
}
for (const f of FACTS) {
  const refs = [...f.answer.matchAll(/\[(\d+)\]/g)].map((m) => +m[1]);
  const missing = refs.filter((r) => r < 1 || r > f.ids.length);
  if (missing.length) { console.log(`✗ ${f.key}: cites [${missing.join("], [")}] but has only ${f.ids.length} source(s)`); bad++; }
  if (!refs.length) { console.log(`✗ ${f.key}: answer cites no source`); bad++; }
}
const total = Object.values(fires).flat().length + silent.length;
console.log(bad ? `\n${bad} problem(s) in ${total} questions` : `All good: ${total} questions behave as expected`);
process.exit(bad ? 1 : 0);
