// Phoenix — checks the obligatory prayers data (app/lib/obligatory.json).
// Run from the project folder:   node scripts/test_obligatory.mjs
// Prayer words ("p") must never contain an instruction such as "Let him then … and say:" —
// instructions belong in their own "r" block so they show in the grey instruction style
// and nobody reads them aloud as part of the prayer.
import fs from "fs";
const d = JSON.parse(fs.readFileSync(new URL("../app/lib/obligatory.json", import.meta.url), "utf8"));
let bad = 0, n = 0;
for (const [name, pr] of Object.entries(d.prayers)) {
  for (const [i, b] of (pr.blocks || []).entries()) {
    n++;
    if (b.p && /\b(let him|let her)\b|\b(and|then) say:\s*$/i.test(b.p)) { console.log(`✗ ${name} prayer, block ${i}: prayer text contains an instruction: …${b.p.slice(-90)}`); bad++; }
    if (b.r && !b.r.trim()) { console.log(`✗ ${name} prayer, block ${i}: empty instruction`); bad++; }
  }
}
console.log(bad ? `\n${bad} problem(s)` : `All good: ${n} blocks checked`);
process.exit(bad ? 1 : 0);
