// Phoenix — checks the Quick answer checker (app/api/search/check.js).
// Run from the project folder:   node scripts/test_answers.mjs
// Each case is an answer the AI might write; "ok" says whether the site should show it.
import { checkAnswer } from "../app/api/search/check.js";

const P = [
  { author: "Shoghi Effendi", book: "God Passes By", section: "Chapter I", text: "The time was the hour before sunset, on the 22nd day of May, 1844. The participants were the Báb, a twenty-five year old siyyid, of pure and holy lineage, and the young Mullá Ḥusayn, the first to believe in Him." },
  { author: "Shoghi Effendi", book: "God Passes By", section: "Chapter III", text: "Ṭáhirih, a poetess, less than thirty years of age, of distinguished birth, of bewitching charm, of captivating eloquence, indomitable in spirit, unorthodox in her views, audacious in her acts." },
  { author: "‘Abdu’l-Bahá", book: "Some Answered Questions", section: "Part 3", text: "The Bahá’í Faith is an independent religion; a Muslim court in Egypt declared it a separate faith." },
];

const cases = [
  { ok: true,  a: "Mullá Ḥusayn was “the first to believe in Him” [1]." },
  { ok: true,  a: "Ṭáhirih was a poetess “of captivating eloquence” and “indomitable in spirit” [2]." },
  { ok: true,  a: "Their meeting began in \"the hour before sunset\" on 22 May 1844 [1]." },                    // straight quotes
  { ok: true,  a: "Shoghi Effendi calls Ṭáhirih “a poetess … of bewitching charm” [2]." },                         // shortened with …
  { ok: true,  a: "“The time was the hour before sunset,” Shoghi Effendi writes [1]." },                           // punctuation at the edge
  { ok: true,  a: "In “God Passes By” Shoghi Effendi names Mullá Ḥusayn as the first believer [1]." },             // quoting the book title
  { ok: true,  a: "The Báb declared His mission to Mullá Ḥusayn [1][2]." },
  { ok: false, a: "Mullá Ḥusayn was the first believer." },                                                         // no citation
  { ok: false, a: "Mullá Ḥusayn was the first believer [9]." },                                                     // passage 9 was never given
  { ok: false, a: "The Báb said “I am the Gate of God, follow Me” [1]." },                                          // invented quotation
  { ok: false, a: "Ṭáhirih was “of captivating eloquence” [1]." },                                                  // real words, but not in the passage it cites
  { ok: false, a: "Shoghi Effendi calls her “a poetess … of royal birth” [2]." },                                   // one piece of a shortened quote is invented
];

let bad = 0;
for (const c of cases) {
  const problem = checkAnswer(c.a, P);
  const shown = !problem;
  if (shown !== c.ok) { console.log(`✗ ${c.ok ? "should be shown" : "should be dropped"}: ${c.a}${problem ? `  (${problem})` : ""}`); bad++; }
}
console.log(bad ? `\n${bad} problem(s)` : `All good: ${cases.length} answers handled as expected`);
process.exit(bad ? 1 : 0);
