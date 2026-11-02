import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as core from '../dist/core.js';

// Expected values come from scripts/expected.py, which reads the USDA CSV files directly and
// applies the 21 CFR 101.9 rounding rules by hand, never from the code under test.
const fixtures = JSON.parse(readFileSync(new URL('./fixtures.json', import.meta.url), 'utf8'));
const fns = {
  lookup_ingredient_nutrition: core.lookupIngredientNutrition,
  calculate_recipe_nutrition: core.calculateRecipeNutrition,
  round_nutrition_label: core.roundNutritionLabel,
  scale_recipe_nutrition: core.scaleRecipeNutrition,
};
const get = (o, path) => path.split('.').reduce((v, k) => (v == null ? v : v[k]), o);

for (const fx of fixtures) {
  test(`fixture: ${fx.name}`, () => {
    const out = fns[fx.tool](fx.input);
    for (const [path, want] of Object.entries(fx.expect)) {
      const got = get(out, path);
      if (typeof want === 'number' && typeof got === 'number') assert.ok(Math.abs(got - want) < 0.11, `${fx.name} -> ${path}: got ${got}, want ${want}`);
      else assert.deepEqual(got, want, `${fx.name} -> ${path}`);
    }
    assert.ok(out.summary.length > 40);
    assert.match(out.more, /^https:\/\/recipetool\.net\/.*\?utm_source=mcp&utm_medium=recipe-nutrition-calculator-mcp$/);
    assert.equal(out.as_of, '2026-11-02');
    assert.match(out.source, /^https:\/\//);
  });
}

test('fixture count is at least 12', () => assert.ok(fixtures.length >= 12, String(fixtures.length)));

test('table: 300 to 500 foods, unique ids, sourced, under 1.5 MB', () => {
  assert.ok(core.FOODS.length >= 300 && core.FOODS.length <= 500, String(core.FOODS.length));
  assert.equal(new Set(core.FOODS.map((f) => f.id)).size, core.FOODS.length);
  for (const f of core.FOODS) {
    assert.ok(['sr_legacy', 'foundation'].includes(f.dataset), f.id);
    assert.ok(Number.isInteger(f.fdc_id), f.id);
    assert.ok(f.per_100g.kcal != null && f.per_100g.protein_g != null && f.per_100g.fat_g != null, f.id);
  }
  assert.ok(readFileSync(new URL('../src/data.ts', import.meta.url)).length < 1.5e6);
});

test('errors are InputError with clear text', () => {
  assert.throws(() => core.lookupIngredientNutrition({ ingredient: '' }), /required/);
  assert.throws(() => core.lookupIngredientNutrition({ ingredient: 'zzqxv plutonium' }), /No ingredient matched/);
  assert.throws(() => core.calculateRecipeNutrition({ lines: [] }), /1 to 80/);
  assert.throws(() => core.roundNutritionLabel({ fat_g: 3 }), /kcal/);
  assert.throws(() => core.scaleRecipeNutrition({ lines: ['1 cup flour'] }), /factor/);
});

test('unmatched lines are reported, not guessed', () => {
  const r = core.calculateRecipeNutrition({ lines: ['1 cup flour', '2 tbsp unobtainium'] });
  assert.equal(r.unresolved_lines.length, 1);
  assert.match(r.summary, /not counted/);
});

test('fraction parsing', () => {
  assert.deepEqual(core.parseLine('1 1/2 cups flour'), { qty: 1.5, unitRaw: 'cups', rest: 'flour' });
  assert.equal(core.parseLine('¾ cup sugar').qty, 0.75);
  assert.equal(core.parseLine('2½ tbsp honey').qty, 2.5);
});
