// Pure nutrition core. No I/O. Nutrient values come from data/foods.json, built by
// scripts/build_data.py from the USDA FoodData Central SR Legacy and Foundation CSV downloads.
// Label rounding follows 21 CFR 101.9(c) and the DRVs in 101.9(c)(9) (eCFR, fetched 2026-11-02).
import { DATA } from './data.js';
export const AS_OF = '2026-11-02';
export const REPO = 'recipe-nutrition-calculator-mcp';
const SITE = 'https://recipetool.net';
export const SR_URL = 'https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_csv_2018-04.zip';
export const FD_URL = 'https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_foundation_food_csv_2026-04-30.zip';
export const ECFR_URL = 'https://www.ecfr.gov/current/title-21/chapter-I/subchapter-B/part-101/subpart-A/section-101.9';
export class InputError extends Error {
}
export function more(path) {
    return `${SITE}${path}?utm_source=mcp&utm_medium=${REPO}`;
}
export const NUTRIENTS = ['kcal', 'protein_g', 'fat_g', 'sat_fat_g', 'carbs_g', 'fiber_g', 'sugars_g', 'sodium_mg'];
export const FOODS = DATA.foods;
// ---------- units ----------
// US customary volume from the US gallon (231 cubic inches): NIST SP 811. Pound = 453.59237 g exact.
const US_GAL = 3785.411784;
export const UNITS = {
    cup: { key: 'cup', kind: 'volume', factor: US_GAL / 16 },
    tbsp: { key: 'tbsp', kind: 'volume', factor: US_GAL / 256 },
    tsp: { key: 'tsp', kind: 'volume', factor: US_GAL / 768 },
    fl_oz: { key: 'fl_oz', kind: 'volume', factor: US_GAL / 128 },
    pint: { key: 'pint', kind: 'volume', factor: US_GAL / 8 },
    quart: { key: 'quart', kind: 'volume', factor: US_GAL / 4 },
    gallon: { key: 'gallon', kind: 'volume', factor: US_GAL },
    ml: { key: 'ml', kind: 'volume', factor: 1 },
    l: { key: 'l', kind: 'volume', factor: 1000 },
    g: { key: 'g', kind: 'weight', factor: 1 },
    kg: { key: 'kg', kind: 'weight', factor: 1000 },
    mg: { key: 'mg', kind: 'weight', factor: 0.001 },
    oz: { key: 'oz', kind: 'weight', factor: 453.59237 / 16 },
    lb: { key: 'lb', kind: 'weight', factor: 453.59237 },
    stick: { key: 'stick', kind: 'weight', factor: 453.59237 / 4 }, // US stick of butter = 1/4 lb
};
const ALIASES = {
    cup: 'cup', cups: 'cup', c: 'cup', tbsp: 'tbsp', tbs: 'tbsp', tbl: 'tbsp', tablespoon: 'tbsp', tablespoons: 'tbsp', T: 'tbsp',
    tsp: 'tsp', teaspoon: 'tsp', teaspoons: 'tsp', t: 'tsp', 'fl oz': 'fl_oz', 'fl. oz': 'fl_oz', 'fl. oz.': 'fl_oz', floz: 'fl_oz',
    'fluid ounce': 'fl_oz', 'fluid ounces': 'fl_oz', pint: 'pint', pints: 'pint', pt: 'pint', quart: 'quart', quarts: 'quart', qt: 'quart',
    gallon: 'gallon', gallons: 'gallon', gal: 'gallon', ml: 'ml', milliliter: 'ml', milliliters: 'ml', millilitre: 'ml', millilitres: 'ml',
    l: 'l', liter: 'l', liters: 'l', litre: 'l', litres: 'l', g: 'g', gram: 'g', grams: 'g', gr: 'g', kg: 'kg', kilogram: 'kg',
    kilograms: 'kg', mg: 'mg', oz: 'oz', ounce: 'oz', ounces: 'oz', lb: 'lb', lbs: 'lb', pound: 'lb', pounds: 'lb', stick: 'stick', sticks: 'stick',
};
export function resolveUnit(raw) {
    const t = raw.trim();
    const k = ALIASES[t] ?? ALIASES[t.toLowerCase()] ?? ALIASES[t.toLowerCase().replace(/\.$/, '')];
    return k ? UNITS[k] : null;
}
// ---------- matching ----------
const norm = (s) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9%]+/g, ' ').trim();
const sing = (w) => (w.length > 3 && w.endsWith('ies') ? w.slice(0, -3) + 'y' : w.length > 3 && w.endsWith('oes') ? w.slice(0, -2) : w.length > 3 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w);
const STOP = new Set(['of', 'and', 'or', 'the', 'a', 'an', 'fresh', 'chopped', 'diced', 'minced', 'sliced', 'grated', 'shredded', 'packed', 'softened',
    'melted', 'cold', 'warm', 'room', 'temperature', 'to', 'taste', 'large', 'medium', 'small', 'finely', 'roughly', 'thinly', 'cut', 'into', 'pieces',
    'peeled', 'divided', 'plus', 'more', 'for', 'serving', 'optional', 'about', 'lightly', 'beaten', 'whisked', 'drained', 'rinsed', 'trimmed',
    'can', 'cans', 'jar', 'jars', 'package', 'packages', 'pkg', 'bag', 'box', 'container', 'carton', 'bottle',
    'whole', 'raw', 'uncooked', 'cubed', 'halved', 'quartered', 'heaping', 'level', 'scant', 'sifted', 'unsifted']);
const toks = (s) => norm(s).split(' ').filter((w) => w && !STOP.has(w)).map(sing);
function trigrams(s) {
    const p = `  ${norm(s)} `;
    const out = new Set();
    for (let i = 0; i < p.length - 2; i++)
        out.add(p.slice(i, i + 3));
    return out;
}
function dice(a, b) {
    let n = 0;
    for (const x of a)
        if (b.has(x))
            n++;
    return (2 * n) / (a.size + b.size || 1);
}
export function scoreFood(q, f) {
    const nq = norm(q);
    const names = [f.name, f.id.replace(/-/g, ' '), ...f.aliases];
    if (names.some((n) => norm(n) === nq))
        return 1;
    const qt = toks(q);
    const qg = trigrams(qt.join(' ') || q);
    let best = 0;
    for (const n of names) {
        const nt = toks(n);
        if (qt.length && nt.length && qt.join(' ') === nt.join(' '))
            return 0.98;
        const hit = qt.filter((w) => nt.includes(w)).length;
        const cover = qt.length ? hit / qt.length : 0;
        const extra = nt.length ? hit / nt.length : 0;
        const s = 0.5 * cover + 0.25 * extra + 0.25 * dice(qg, trigrams(n));
        if (s > best)
            best = s;
    }
    return Math.min(best, 0.97);
}
export function rankFoods(q) {
    return FOODS.map((food) => ({ food, score: scoreFood(q, food) }))
        .sort((a, b) => b.score - a.score || a.food.name.length - b.food.name.length);
}
// Text used for matching: drop parentheticals and anything after the first comma ("onion, chopped").
export function matchText(rest) {
    return rest.replace(/\([^)]*\)/g, ' ').split(/,|;| - /)[0].replace(/\s+/g, ' ').trim();
}
export function findFood(q, min = 0.55) {
    if (!q || !q.trim())
        throw new InputError('ingredient is required, e.g. "all-purpose flour".');
    const r = rankFoods(matchText(q) || q);
    if (r[0].score < min)
        throw new InputError(`No ingredient matched "${q}". Closest: ${r.slice(0, 5).map((x) => x.food.name).join('; ')}. Call lookup_ingredient_nutrition with a simpler name.`);
    return r[0].food;
}
// ---------- numbers ----------
const r1 = (x) => Math.round(x * 10) / 10;
const r2 = (x) => Math.round(x * 100) / 100;
export function nutrientsFor(f, grams) {
    const out = {};
    for (const k of NUTRIENTS) {
        const v = f.per_100g[k];
        out[k] = v == null ? null : r2((v * grams) / 100);
    }
    return out;
}
function addInto(acc, p) {
    for (const k of NUTRIENTS)
        acc[k] += p[k] ?? 0;
}
const zero = () => ({ kcal: 0, protein_g: 0, fat_g: 0, sat_fat_g: 0, carbs_g: 0, fiber_g: 0, sugars_g: 0, sodium_mg: 0 });
const roundProfile = (p) => Object.fromEntries(NUTRIENTS.map((k) => [k, r1(p[k])]));
function fdcSource(f) {
    return f.dataset === 'foundation' ? FD_URL : SR_URL;
}
function foodCard(f) {
    return {
        id: f.id, name: f.name, usda_description: f.description, fdc_id: f.fdc_id,
        dataset: f.dataset === 'foundation' ? 'USDA FoodData Central Foundation Foods (2026-04-30 release)' : 'USDA FoodData Central SR Legacy (2018-04)',
        fdc_page: `https://fdc.nal.usda.gov/food-details/${f.fdc_id}/nutrients`,
        energy_basis: f.energy_nutrient === '1008' ? 'Energy (kcal), nutrient 1008' : f.energy_nutrient === '2048' ? 'Energy, Atwater specific factors (2048)' : 'Energy, Atwater general factors (2047)',
        per_100g: f.per_100g,
        not_reported_by_usda: NUTRIENTS.filter((k) => f.per_100g[k] == null),
    };
}
// ---------- line parsing ----------
const VULGAR = { '½': 1 / 2, '⅓': 1 / 3, '⅔': 2 / 3, '¼': 1 / 4, '¾': 3 / 4, '⅕': 1 / 5, '⅖': 2 / 5, '⅗': 3 / 5, '⅘': 4 / 5, '⅙': 1 / 6, '⅚': 5 / 6, '⅛': 1 / 8, '⅜': 3 / 8, '⅝': 5 / 8, '⅞': 7 / 8 };
export function parseLine(line) {
    let s = line.trim().replace(/^[-*•]\s*/, '');
    for (const [k, v] of Object.entries(VULGAR))
        s = s.replace(new RegExp(`(\\d)\\s*${k}`), (_m, d) => `${d} ${v}`).replace(k, String(v));
    const m = s.match(/^(\d+(?:\.\d+)?)(?:\s+(\d+(?:\.\d+)?)\/(\d+)|\s+(0?\.\d+)|\/(\d+))?(?:\s*(?:-|to)\s*\d+(?:\.\d+)?(?:\/\d+)?)?/);
    let qty = null;
    if (m) {
        if (m[5])
            qty = Number(m[1]) / Number(m[5]);
        else if (m[2])
            qty = Number(m[1]) + Number(m[2]) / Number(m[3]);
        else if (m[4])
            qty = Number(m[1]) + Number(m[4]);
        else
            qty = Number(m[1]);
        s = s.slice(m[0].length).trim();
    }
    let unitRaw = null;
    const um = s.match(/^([A-Za-z.]+(?:\s(?:oz|oz\.|ounces?))?)\b\.?/);
    if (um) {
        for (const c of [um[1], um[1].split(' ')[0]]) {
            const lc = c.toLowerCase().replace(/\.$/, '');
            const exact = ['c', 't', 'T', 'l', 'g'].includes(c) ? c : null;
            if (exact || (ALIASES[lc] && !['c', 't', 'l', 'g'].includes(lc))) {
                unitRaw = exact ?? lc;
                s = s.slice(c.length).replace(/^\.?\s*(of\s+)?/, '');
                break;
            }
        }
    }
    return { qty, unitRaw, rest: s.replace(/^,\s*/, '').trim() };
}
const VOL_PORTION = /^(cup|tbsp|tsp|tablespoon|teaspoon|fl oz)\b/;
const pLabel = ([mod, unit, g, fdc]) => `1 ${[unit, mod].filter(Boolean).join(' ')} = ${g} g (FDC ${fdc})`;
function volPortion(f, hint, want = 'cup') {
    // Portions with a unit (Foundation) keep the descriptor in the modifier; SR Legacy puts the unit word first in the modifier.
    const ht = new Set(toks(hint.replace(/,/g, ' ')).concat(norm(hint).split(' ')));
    const cands = f.portions.filter(([mod, unit]) => VOL_PORTION.test(mod) || ['cup', 'tablespoon', 'teaspoon'].includes(unit));
    if (!cands.length)
        return null;
    const scoreP = ([mod, unit]) => {
        const words = unit ? norm(mod).split(' ').filter(Boolean) : norm(mod).split(' ').slice(1);
        const stem = (w) => w.replace(/(ed|es|s|d)$/, '');
        const hs = new Set([...ht].map(stem));
        const hit = words.filter((w) => w.length > 2 && hs.has(stem(w))).length;
        const fam = unit === 'tablespoon' || /^(tbsp|tablespoon)/.test(mod) ? 'tbsp' : unit === 'teaspoon' || /^(tsp|teaspoon)/.test(mod) ? 'tsp' : 'cup';
        const wantFam = want === 'tbsp' || want === 'tsp' ? want : 'cup';
        const DESC = /^(whipped|melted|unpacked|sifted|diced|chopped|sliced|shredded|grated|mashed|cubed|pureed|crumbled|minced|halves|pieces|whole|strips|ground|crushed|cooked|drained|shell|yield)$/;
        const stray = words.filter((w) => DESC.test(w) && !hs.has(stem(w))).length;
        return hit * 2 - stray + (fam === wantFam ? 0.5 : 0) + (fam === 'cup' ? 0.05 : 0) - words.filter((w) => !/^\d/.test(w)).length * 0.1;
    };
    const best = [...cands].sort((a, b) => scoreP(b) - scoreP(a))[0];
    const [mod, unit, g] = best;
    const base = /^(tbsp|tablespoon)/.test(mod) || unit === 'tablespoon' ? 16 : /^(tsp|teaspoon)/.test(mod) || unit === 'teaspoon' ? 48 : /^fl oz/.test(mod) ? 8 : 1;
    return { gPerCup: g * base, label: pLabel(best) };
}
const SIZE = ['extra large', 'jumbo', 'large', 'medium', 'small'];
function countPortion(f, hint) {
    const ht = new Set(norm(hint).split(' ').map(sing));
    const ok = f.portions.filter(([mod, unit]) => !VOL_PORTION.test(mod) && !['cup', 'tablespoon', 'teaspoon'].includes(unit) && !/^(oz|lb|g|nlea|serving|package|container|can\b|cubic)/i.test(mod));
    if (!ok.length)
        return null;
    for (const sz of SIZE) {
        if (norm(hint).includes(sz)) {
            const p = ok.find(([mod]) => norm(mod).startsWith(sz));
            if (p)
                return { g: p[2], label: pLabel(p) };
        }
    }
    for (const p of ok) {
        const first = sing(norm(p[0]).split(' ')[0] || '');
        if (first && ht.has(first) && !SIZE.includes(first))
            return { g: p[2], label: pLabel(p) };
    }
    // US recipes assume large eggs; other produce defaults to the USDA medium size.
    const pref = f.id.startsWith('egg') ? ['large', 'medium'] : ['medium', 'large'];
    const med = ok.find(([mod]) => norm(mod).startsWith(pref[0])) ?? ok.find(([mod]) => norm(mod).startsWith(pref[1])) ?? ok[0];
    return { g: med[2], label: pLabel(med) };
}
export function resolveLine(line) {
    const p = parseLine(String(line));
    const base = { line, quantity: p.qty, unit: p.unitRaw, ingredient_text: p.rest, matched: null, grams: null, grams_basis: null, nutrients: null };
    if (/\bto taste\b|\bfor (serving|garnish)\b|\bas needed\b/i.test(line) && p.qty == null)
        return { ...base, note: 'No amount (to taste or garnish); counted as 0 g.' };
    const PKG = /^(?:(?:cans?|jars?|packages?|pkgs?|bags?|boxes?|containers?|cartons?|bottles?)\s*)?\(?\s*(\d+(?:\.\d+)?)[\s-]*(oz|ounces?|g|grams?|lbs?|pounds?)\.?(?:\s*each)?\s*\)?\s*(?:(?:cans?|jars?|packages?|pkgs?|bags?|boxes?|containers?|cartons?|bottles?)\b)?/i;
    const pkg = !p.unitRaw ? p.rest.match(PKG) : null;
    const mt = matchText(pkg ? p.rest.slice(pkg[0].length) : p.rest);
    const r = rankFoods(mt || p.rest)[0];
    if (!mt || r.score < 0.55)
        return { ...base, note: `No ingredient matched "${mt || p.rest}". Closest: ${rankFoods(mt || p.rest).slice(0, 3).map((x) => x.food.name).join('; ')}. Rewrite the line or give grams.` };
    const f = r.food;
    base.matched = { id: f.id, name: f.name, fdc_id: f.fdc_id, match: Math.round(r.score * 100) / 100 };
    if (p.qty == null)
        return { ...base, note: 'No leading quantity; counted as 0 g. Start the line with an amount, e.g. "2 cups flour".' };
    const unit = p.unitRaw ? resolveUnit(p.unitRaw) : null;
    let grams;
    let basis;
    // Package sizes: "1 (15 oz) can black beans", "2 cans (14.5 oz each) diced tomatoes", "1 8-oz package cream cheese"
    if (pkg) {
        const u = resolveUnit(pkg[2].toLowerCase());
        grams = p.qty * Number(pkg[1]) * u.factor;
        basis = `package size (${pkg[1]} ${u.key} net weight = ${r1(Number(pkg[1]) * u.factor)} g each)`;
    }
    else if (unit && unit.kind === 'weight') {
        grams = p.qty * unit.factor;
        basis = `weight unit (${unit.key} = ${r2(unit.factor)} g)`;
    }
    else if (unit && unit.kind === 'volume') {
        const vp = volPortion(f, p.rest, unit.key);
        if (!vp)
            return { ...base, note: `USDA lists no cup or spoon weight for ${f.name}. Give the amount in grams or ounces.` };
        grams = (p.qty * unit.factor * vp.gPerCup) / UNITS.cup.factor;
        basis = `USDA household measure: ${vp.label}, ${r1(vp.gPerCup)} g per US cup`;
    }
    else {
        const cp = countPortion(f, p.rest);
        if (!cp)
            return { ...base, note: `USDA lists no per-item weight for ${f.name}. Give the amount in grams, ounces or cups.` };
        grams = p.qty * cp.g;
        basis = `USDA household measure: ${cp.label}`;
    }
    return { ...base, grams: r1(grams), grams_basis: basis, nutrients: nutrientsFor(f, grams) };
}
// ---------- FDA label rounding, 21 CFR 101.9(c) ----------
// DRVs for adults and children 4 years and older, 101.9(c)(9) and (c)(7)(iii).
export const DRV = { fat_g: 78, sat_fat_g: 20, carbs_g: 275, sodium_mg: 2300, fiber_g: 28, added_sugars_g: 50, protein_g: 50 };
const nearest = (x, step) => Math.round(x / step) * step;
export function roundCalories(x) {
    if (x < 5)
        return 0;
    return x <= 50 ? nearest(x, 5) : nearest(x, 10);
}
export function roundFat(x) {
    if (x < 0.5)
        return 0;
    return x < 5 ? nearest(x, 0.5) : nearest(x, 1);
}
export function roundSodium(x) {
    if (x < 5)
        return 0;
    return x <= 140 ? nearest(x, 5) : nearest(x, 10);
}
// Carbohydrate, fiber, sugars, added sugars, protein: nearest gram; under 1 g may read "less than 1 gram"; under 0.5 g may be 0.
export function roundGram(x) {
    if (x < 0.5)
        return { value: 0, text: '0g' };
    if (x < 1)
        return { value: 1, text: 'less than 1g' };
    return { value: nearest(x, 1), text: `${nearest(x, 1)}g` };
}
const fmtG = (v) => `${Number.isInteger(v) ? v : v.toFixed(1)}g`;
export function labelFrom(p) {
    const has = (k) => p[k] != null;
    const v = (k) => Number(p[k] ?? 0);
    const pct = (amount, drv) => Math.round((amount / drv) * 100);
    const rows = {};
    const cal = roundCalories(v('kcal'));
    rows.calories = { declared: cal, text: String(cal), percent_dv: null, rule: '101.9(c)(1): under 5 = 0; up to 50 nearest 5; above 50 nearest 10' };
    const fat = roundFat(v('fat_g'));
    rows.total_fat = { declared: fat, text: fmtG(fat), percent_dv: pct(v('fat_g'), DRV.fat_g), rule: '101.9(c)(2): under 0.5 g = 0; under 5 g nearest 0.5 g; otherwise nearest 1 g. DV 78 g' };
    if (has('sat_fat_g')) {
        const s = roundFat(v('sat_fat_g'));
        rows.saturated_fat = { declared: s, text: fmtG(s), percent_dv: pct(v('sat_fat_g'), DRV.sat_fat_g), rule: '101.9(c)(2)(i): same steps as total fat. DV 20 g' };
    }
    if (has('sodium_mg')) {
        const s = roundSodium(v('sodium_mg'));
        rows.sodium = { declared: s, text: `${s}mg`, percent_dv: pct(v('sodium_mg'), DRV.sodium_mg), rule: '101.9(c)(4): under 5 mg = 0; 5 to 140 mg nearest 5 mg; above 140 nearest 10 mg. DV 2,300 mg' };
    }
    const gramRow = (k, name, cite, drv) => {
        if (!has(k))
            return;
        const g = roundGram(v(k));
        rows[name] = { declared: g.value === 1 && g.text.startsWith('less') ? null : g.value, text: g.text, percent_dv: drv ? pct(v(k), drv) : null, rule: `${cite}: nearest 1 g; under 1 g may read "less than 1g"; under 0.5 g may be 0${drv ? `. DV ${drv} g` : ''}` };
    };
    gramRow('carbs_g', 'total_carbohydrate', '101.9(c)(6)', DRV.carbs_g);
    gramRow('fiber_g', 'dietary_fiber', '101.9(c)(6)(i)', DRV.fiber_g);
    gramRow('sugars_g', 'total_sugars', '101.9(c)(6)(ii)', null);
    gramRow('added_sugars_g', 'added_sugars', '101.9(c)(6)(iii)', DRV.added_sugars_g);
    gramRow('protein_g', 'protein', '101.9(c)(7)', null);
    return rows;
}
// ---------- tool: lookup_ingredient_nutrition ----------
export function lookupIngredientNutrition(i) {
    const q = String(i.ingredient ?? '').trim();
    if (!q)
        throw new InputError('ingredient is required, e.g. "cheddar cheese" or "brown rice".');
    const ranked = rankFoods(matchText(q) || q);
    const best = ranked[0];
    if (best.score < 0.45)
        throw new InputError(`No ingredient matched "${q}". Closest: ${ranked.slice(0, 5).map((x) => x.food.name).join('; ')}. The table has ${FOODS.length} common recipe ingredients.`);
    const f = best.food;
    let forAmount = null;
    if (i.amount != null) {
        const amt = Number(i.amount);
        if (!Number.isFinite(amt) || amt <= 0 || amt > 100000)
            throw new InputError('amount must be a positive number.');
        const unitRaw = String(i.unit ?? 'g');
        const res = resolveLine(`${amt} ${unitRaw === 'each' || unitRaw === 'item' ? '' : unitRaw} ${f.aliases[0] ?? f.name}`.replace(/\s+/g, ' '));
        if (res.grams == null)
            throw new InputError(res.note ?? `Could not convert ${amt} ${unitRaw} of ${f.name}.`);
        forAmount = { amount: amt, unit: unitRaw, grams: res.grams, grams_basis: res.grams_basis, nutrients: res.nutrients };
    }
    const n = f.per_100g;
    const summary = `${f.name} (USDA FDC ${f.fdc_id}, ${f.description}) per 100 g: ${n.kcal ?? 'n/a'} kcal, ${n.protein_g ?? 'n/a'} g protein, ${n.fat_g ?? 'n/a'} g fat (${n.sat_fat_g ?? 'n/a'} g saturated), ${n.carbs_g ?? 'n/a'} g carbohydrate, ${n.fiber_g ?? 'n/a'} g fiber, ${n.sugars_g ?? 'n/a'} g sugars, ${n.sodium_mg ?? 'n/a'} mg sodium.` +
        (forAmount ? ` ${forAmount.amount} ${forAmount.unit} = ${forAmount.grams} g: ${forAmount.nutrients.kcal} kcal.` : '') +
        (best.score < 0.8 ? ` Fuzzy match (${Math.round(best.score * 100)}%); check the USDA description.` : '');
    return {
        summary, query: q, food: foodCard(f),
        household_measures: f.portions.map(([mod, unit, g, fdc]) => ({ measure: `1 ${[unit, mod].filter(Boolean).join(' ')}`, grams: g, fdc_id: fdc })),
        for_amount: forAmount,
        other_matches: ranked.slice(1, 6).filter((x) => x.score >= 0.4).map((x) => ({ id: x.food.id, name: x.food.name, fdc_id: x.food.fdc_id, match: Math.round(x.score * 100) / 100 })),
        as_of: AS_OF, source: fdcSource(f), more: more('/tools/ingredient-calorie-calculator'),
    };
}
// ---------- tool: calculate_recipe_nutrition ----------
function totals(lines) {
    const t = zero();
    const missing = {};
    for (const l of lines) {
        if (!l.nutrients)
            continue;
        addInto(t, l.nutrients);
        for (const k of NUTRIENTS)
            if (l.nutrients[k] == null)
                (missing[k] ??= []).push(l.matched?.name ?? l.line);
    }
    return { t, missing };
}
export function calculateRecipeNutrition(i) {
    const lines = i.lines;
    if (!Array.isArray(lines) || lines.length < 1 || lines.length > 80)
        throw new InputError('lines must be a list of 1 to 80 ingredient lines, e.g. ["2 cups all-purpose flour", "1 cup sugar", "2 large eggs"].');
    const servings = i.servings == null ? 1 : Number(i.servings);
    if (!Number.isFinite(servings) || servings <= 0 || servings > 1000)
        throw new InputError('servings must be a number above 0 and at most 1000.');
    const res = lines.map((l) => resolveLine(String(l)));
    const { t, missing } = totals(res);
    const grams = res.reduce((a, l) => a + (l.grams ?? 0), 0);
    const per = Object.fromEntries(NUTRIENTS.map((k) => [k, t[k] / servings]));
    const unresolved = res.filter((l) => l.grams == null && !/counted as 0 g/.test(l.note ?? '')).map((l) => ({ line: l.line, note: l.note }));
    const label = labelFrom(per);
    const summary = `Recipe of ${lines.length} line${lines.length > 1 ? 's' : ''} (${r1(grams)} g matched): ${r1(t.kcal)} kcal total, ${r1(per.kcal)} kcal per serving over ${servings} serving${servings === 1 ? '' : 's'}. ` +
        `Per serving: ${r1(per.protein_g)} g protein, ${r1(per.fat_g)} g fat, ${r1(per.carbs_g)} g carbohydrate, ${r1(per.fiber_g)} g fiber, ${r1(per.sodium_mg)} mg sodium. FDA label rounding gives ${label.calories.text} calories per serving. ` +
        (unresolved.length ? `${unresolved.length} line${unresolved.length > 1 ? 's were' : ' was'} not counted; see unresolved_lines.` : 'Every line was matched to a USDA FoodData Central food.') +
        ' Values are for the raw ingredients as listed; cooking losses and water evaporation are not modeled.';
    return {
        summary, servings,
        total: roundProfile(t), per_serving: roundProfile(per),
        serving_weight_g: r1(grams / servings), total_weight_g: r1(grams),
        per_serving_label: label,
        lines: res, unresolved_lines: unresolved,
        nutrients_not_reported_by_usda: missing,
        as_of: AS_OF, source: SR_URL, sources: [SR_URL, FD_URL, ECFR_URL],
        more: more('/nutrition-calculator'),
    };
}
// ---------- tool: round_nutrition_label ----------
export function roundNutritionLabel(i) {
    const keys = ['kcal', 'fat_g', 'sat_fat_g', 'sodium_mg', 'carbs_g', 'fiber_g', 'sugars_g', 'added_sugars_g', 'protein_g'];
    const p = {};
    for (const k of keys) {
        if (i[k] == null) {
            p[k] = null;
            continue;
        }
        const v = Number(i[k]);
        if (!Number.isFinite(v) || v < 0)
            throw new InputError(`${k} must be a number of 0 or more.`);
        p[k] = v;
    }
    if (p.kcal == null)
        throw new InputError('kcal (calories per serving, unrounded) is required.');
    const label = labelFrom(p);
    const summary = `FDA Nutrition Facts rounding (21 CFR 101.9(c)) per serving: Calories ${label.calories.text}, Total Fat ${label.total_fat.text} (${label.total_fat.percent_dv}% DV)` +
        (label.saturated_fat ? `, Saturated Fat ${label.saturated_fat.text}` : '') + (label.sodium ? `, Sodium ${label.sodium.text}` : '') +
        (label.total_carbohydrate ? `, Total Carbohydrate ${label.total_carbohydrate.text}` : '') + (label.dietary_fiber ? `, Dietary Fiber ${label.dietary_fiber.text}` : '') +
        (label.total_sugars ? `, Total Sugars ${label.total_sugars.text}` : '') + (label.protein ? `, Protein ${label.protein.text}` : '') +
        '. Percent Daily Values use the 2,000-calorie DRVs in 101.9(c)(9), rounded to the nearest whole percent from the unrounded amount.';
    return {
        summary, input: p, label,
        daily_values_used: DRV,
        notes: [
            'Percent DV is computed from the unrounded amount you supplied and rounded to the nearest whole percent (101.9(d)(7)(ii)).',
            'Protein %DV is omitted: it is optional and needs a PDCAAS-corrected protein amount (101.9(c)(7)(ii)).',
            'Total sugars have no Daily Value.',
        ],
        as_of: AS_OF, source: ECFR_URL, more: more('/tools/nutrition-facts-label-calculator'),
    };
}
// ---------- tool: scale_recipe_nutrition ----------
function fmtQty(x) {
    const whole = Math.floor(x + 1e-9);
    const fr = x - whole;
    const fracs = [[0, ''], [1 / 8, '1/8'], [1 / 4, '1/4'], [1 / 3, '1/3'], [3 / 8, '3/8'], [1 / 2, '1/2'], [5 / 8, '5/8'], [2 / 3, '2/3'], [3 / 4, '3/4'], [7 / 8, '7/8'], [1, '']];
    for (const [v, t] of fracs) {
        if (Math.abs(fr - v) < 0.01) {
            const w = v === 1 ? whole + 1 : whole;
            return t ? (w ? `${w} ${t}` : t) : String(w);
        }
    }
    return String(Math.round(x * 1000) / 1000);
}
export function scaleRecipeNutrition(i) {
    const lines = i.lines;
    if (!Array.isArray(lines) || lines.length < 1 || lines.length > 80)
        throw new InputError('lines must be a list of 1 to 80 ingredient lines.');
    let factor;
    const os = i.original_servings == null ? null : Number(i.original_servings);
    const ts = i.target_servings == null ? null : Number(i.target_servings);
    if (i.factor != null)
        factor = Number(i.factor);
    else if (os && ts)
        factor = ts / os;
    else
        throw new InputError('Give factor (e.g. 2 or 0.5), or both original_servings and target_servings.');
    if (!Number.isFinite(factor) || factor <= 0 || factor > 100)
        throw new InputError('The scale factor must be above 0 and at most 100.');
    const scaled = lines.map((line) => {
        const p = parseLine(String(line));
        if (p.qty == null)
            return String(line);
        return `${fmtQty(p.qty * factor)}${p.unitRaw ? ` ${p.unitRaw}` : ''} ${p.rest}`.trim();
    });
    const servings = ts ?? (os ? os * factor : 1);
    const before = calculateRecipeNutrition({ lines, servings: os ?? 1 });
    const after = calculateRecipeNutrition({ lines: scaled, servings });
    const summary = `Scaled ${lines.length} line${lines.length > 1 ? 's' : ''} by ${Math.round(factor * 1000) / 1000}. Total energy goes from ${before.total.kcal} to ${after.total.kcal} kcal; ` +
        `per serving ${after.per_serving.kcal} kcal over ${servings} serving${servings === 1 ? '' : 's'} (FDA label: ${after.per_serving_label.calories.text}). Leavening, salt, spices and bake time do not always scale linearly.`;
    return {
        summary, factor: Math.round(factor * 1000) / 1000, servings,
        scaled_lines: scaled.map((s, k) => ({ original: lines[k], scaled: s })),
        total_before: before.total, total_after: after.total, per_serving: after.per_serving, per_serving_label: after.per_serving_label,
        unresolved_lines: after.unresolved_lines,
        as_of: AS_OF, source: SR_URL, more: more('/tools/recipe-scaler'),
    };
}
