import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { InputError, lookupIngredientNutrition, calculateRecipeNutrition, roundNutritionLabel, scaleRecipeNutrition, FOODS } from './core.js';

export const SERVER_NAME = 'recipe-nutrition-calculator-mcp';
export const SERVER_VERSION = '1.0.0';

const RO = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };

type Fn = (i: Record<string, unknown>) => { summary: string } & Record<string, unknown>;
function wrap(fn: Fn) {
  return async (args: Record<string, unknown>) => {
    try {
      const out = fn(args);
      return { content: [{ type: 'text' as const, text: `${out.summary}\n\n${JSON.stringify(out, null, 2)}` }], structuredContent: out };
    } catch (e) {
      const msg = e instanceof InputError ? e.message : `Unexpected error: ${(e as Error).message}`;
      return { content: [{ type: 'text' as const, text: msg }], isError: true };
    }
  };
}

const linesSchema = z.array(z.string().min(1).max(200)).min(1).max(80).describe('Ingredient lines, one per item, amount first: "2 cups all-purpose flour", "1/2 cup butter", "2 large eggs", "200 g chicken breast", "1 tsp salt".');

export function registerTools(server: McpServer): void {
  server.registerTool('lookup_ingredient_nutrition', {
    title: 'Look up USDA nutrients for an ingredient',
    description: `Returns USDA FoodData Central nutrient values per 100 g (calories, protein, total fat, saturated fat, carbohydrate, fiber, total sugars, sodium) for a common recipe ingredient, with its FDC id, the USDA household measures (1 cup, 1 tbsp, 1 large, 1 clove) in grams, and optionally the nutrients for an amount such as 1.5 cup or 3 large. ${FOODS.length} ingredients from SR Legacy and Foundation Foods, embedded, no API key. Use it instead of estimating nutrition from memory.`,
    inputSchema: {
      ingredient: z.string().min(1).max(100).describe('Ingredient name, e.g. "cheddar cheese", "brown rice", "olive oil", "large egg".'),
      amount: z.number().positive().max(100000).describe('Optional amount to compute nutrients for, e.g. 1.5.').optional(),
      unit: z.string().max(30).describe('Unit for amount: g, oz, lb, kg, cup, tbsp, tsp, fl oz, ml, or "each" for a counted item (uses the USDA medium or large size). Default g.').optional(),
    },
    annotations: { title: 'Look up ingredient nutrition', ...RO },
  }, wrap(lookupIngredientNutrition));

  server.registerTool('calculate_recipe_nutrition', {
    title: 'Calculate nutrition for a whole recipe and per serving',
    description: 'Parses ingredient lines ("2 cups flour", "1 stick butter" as 8 tbsp, "3 large eggs", "1 lb ground beef"), converts cups, spoons and counted items to grams with USDA household measure weights for that specific food, and sums USDA FoodData Central nutrients. Returns per-line grams and matches, recipe totals, per-serving values, and the per-serving values rounded by the FDA Nutrition Facts rules (21 CFR 101.9) with percent Daily Value. Lines it cannot match are listed, never guessed.',
    inputSchema: {
      lines: linesSchema,
      servings: z.number().positive().max(1000).describe('Number of servings the recipe makes. Default 1.').optional(),
    },
    annotations: { title: 'Calculate recipe nutrition', ...RO },
  }, wrap(calculateRecipeNutrition));

  server.registerTool('round_nutrition_label', {
    title: 'Round values for an FDA Nutrition Facts label',
    description: 'Applies the FDA Nutrition Facts rounding rules from 21 CFR 101.9(c) to unrounded per-serving values: calories (under 5 = 0, nearest 5 up to 50, nearest 10 above), fat and saturated fat (nearest 0.5 g under 5 g), sodium (nearest 5 mg up to 140 mg, nearest 10 above), carbohydrate, fiber, sugars, added sugars and protein (nearest gram, "less than 1g" rules). Adds percent Daily Value from the 2,000-calorie DRVs (fat 78 g, saturated fat 20 g, sodium 2,300 mg, carbohydrate 275 g, fiber 28 g, added sugars 50 g). Rules copied from the eCFR text.',
    inputSchema: {
      kcal: z.number().min(0).max(100000).describe('Calories per serving, unrounded.'),
      fat_g: z.number().min(0).max(10000).describe('Total fat, g per serving.').optional(),
      sat_fat_g: z.number().min(0).max(10000).describe('Saturated fat, g per serving.').optional(),
      sodium_mg: z.number().min(0).max(1000000).describe('Sodium, mg per serving.').optional(),
      carbs_g: z.number().min(0).max(10000).describe('Total carbohydrate, g per serving.').optional(),
      fiber_g: z.number().min(0).max(10000).describe('Dietary fiber, g per serving.').optional(),
      sugars_g: z.number().min(0).max(10000).describe('Total sugars, g per serving.').optional(),
      added_sugars_g: z.number().min(0).max(10000).describe('Added sugars, g per serving.').optional(),
      protein_g: z.number().min(0).max(10000).describe('Protein, g per serving.').optional(),
    },
    annotations: { title: 'Round nutrition label', ...RO },
  }, wrap(roundNutritionLabel));

  server.registerTool('scale_recipe_nutrition', {
    title: 'Scale a recipe and recompute its nutrition',
    description: 'Scales ingredient lines by a factor or from original to target servings (parses mixed numbers and fraction characters), then recomputes total and per-serving nutrition with USDA FoodData Central values and FDA label rounding for the scaled recipe.',
    inputSchema: {
      lines: linesSchema,
      factor: z.number().positive().max(100).describe('Multiply every quantity by this, e.g. 2 or 0.5. Or give servings instead.').optional(),
      original_servings: z.number().positive().max(1000).describe('Servings the recipe makes now.').optional(),
      target_servings: z.number().positive().max(1000).describe('Servings you want.').optional(),
    },
    annotations: { title: 'Scale recipe nutrition', ...RO },
  }, wrap(scaleRecipeNutrition));
}

export function createServer(): McpServer {
  const server = new McpServer({ name: SERVER_NAME, version: SERVER_VERSION });
  registerTools(server);
  return server;
}
