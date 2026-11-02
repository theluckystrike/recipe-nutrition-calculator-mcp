# Recipe Nutrition Calculator MCP

Recipe nutrition for AI assistants: paste ingredient lines, get calories, protein, fat, saturated fat, carbohydrate, fiber, sugars and sodium per recipe and per serving from USDA FoodData Central, rounded by the FDA Nutrition Facts rules.

Hosted MCP URL (no sign-in, no token): `https://recipe-nutrition-calculator-mcp.lipmichal.workers.dev/mcp`

Nutrition calculators and label tools on the web: [recipetool.net](https://recipetool.net/nutrition-calculator?utm_source=github&utm_medium=recipe-nutrition-calculator-mcp)

## Tools

| Tool | What it does |
| --- | --- |
| `lookup_ingredient_nutrition` | USDA nutrients per 100 g for one of 406 common recipe ingredients, with its FDC id, the USDA household measures in grams (1 cup, 1 tbsp, 1 large, 1 clove), and the nutrients for an amount such as 1.5 cup or 3 each. |
| `calculate_recipe_nutrition` | Parses lines like "2 1/4 cups flour", "1 stick butter", "2 large eggs", "1 (15 oz) can black beans", converts them to grams with the USDA weights for that food, and returns totals, per-serving values and the per-serving Nutrition Facts values. Lines it cannot match are listed, not guessed. |
| `round_nutrition_label` | Applies the 21 CFR 101.9(c) rounding steps to unrounded per-serving values and adds percent Daily Value from the 2,000-calorie DRVs. |
| `scale_recipe_nutrition` | Scales ingredient lines by a factor or from one servings count to another, and recomputes the nutrition of the scaled recipe. |

Every result has structured JSON, a one-paragraph summary, an `as_of` date, a `source` URL and a `more` link to the matching recipetool.net page.

## What it knows that your model does not

- Exact USDA values. Each of the 406 ingredients carries the FoodData Central nutrient values and FDC id: 398 from SR Legacy and 8 from the April 2026 Foundation Foods release where that release has all eight nutrients. A model recalls nutrition roughly and changes its answer between runs.
- Food-specific cup weights. A cup of flour is 125 g, packed brown sugar 220 g, shredded cheddar 113 g, chopped onion 160 g, whole milk 244 g. These are the USDA household measures for that food, not one density for everything.
- The label rounding rules. Calories round to 5 up to 50 and to 10 above, fat to 0.5 g under 5 g, sodium to 5 mg up to 140 mg and to 10 mg above, with the "less than 1g" cases for carbohydrate, fiber, sugars and protein. Copied from the eCFR text of 21 CFR 101.9.
- The current Daily Values. Fat 78 g, saturated fat 20 g, sodium 2,300 mg, carbohydrate 275 g, fiber 28 g, added sugars 50 g.

## Install

### Claude.ai custom connector, ChatGPT developer mode

Paste this URL as a custom connector. No token or sign-in.

```
https://recipe-nutrition-calculator-mcp.lipmichal.workers.dev/mcp
```

### Claude Code

```
claude mcp add --transport http recipe-nutrition https://recipe-nutrition-calculator-mcp.lipmichal.workers.dev/mcp
```

Or run it locally over stdio:

```
claude mcp add recipe-nutrition -- npx -y github:theluckystrike/recipe-nutrition-calculator-mcp
```

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "recipe-nutrition": {
      "command": "npx",
      "args": ["-y", "github:theluckystrike/recipe-nutrition-calculator-mcp"]
    }
  }
}
```

### Cursor

Add to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "recipe-nutrition": { "url": "https://recipe-nutrition-calculator-mcp.lipmichal.workers.dev/mcp" }
  }
}
```

### VS Code

Add to `.vscode/mcp.json`:

```json
{
  "servers": {
    "recipe-nutrition": { "type": "http", "url": "https://recipe-nutrition-calculator-mcp.lipmichal.workers.dev/mcp" }
  }
}
```

### Test with curl

```
curl -s -X POST https://recipe-nutrition-calculator-mcp.lipmichal.workers.dev/mcp \
  -H 'content-type: application/json' -H 'accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"calculate_recipe_nutrition","arguments":{"lines":["2 cups all-purpose flour","1 cup sugar","1/2 cup butter"],"servings":4}}}'
```

## Example prompts

- "How many calories per cookie in this recipe? It makes 48." (paste the ingredient list)
- "Make a Nutrition Facts panel for my granola, 12 servings."
- "How much protein is in 1 cup of cooked lentils?"
- "I have 137.4 kcal, 6.8 g fat and 96 mg sodium per serving. What goes on the label?"
- "Scale this chili from 4 to 10 servings and tell me the calories per bowl."

## How it calculates

- Weight units convert exactly (1 oz = 28.349523125 g, 1 lb = 453.59237 g, 1 stick of butter = 1/4 lb).
- Cups and spoons use the USDA household measure for that food. A US cup is 236.588 mL, 16 tbsp or 48 tsp. When the line says chopped, sliced, shredded or packed, the matching USDA measure is used.
- Counted items ("2 large eggs", "3 cloves garlic", "1 medium onion") use the USDA weight for that size. Eggs default to large, produce to medium.
- Can and package sizes in the line ("1 (15 oz) can") use the net weight.
- Nutrients = grams x USDA value per 100 g / 100, summed over lines, divided by servings.
- Label values follow 21 CFR 101.9(c). Percent DV is computed from the unrounded amount and rounded to the nearest whole percent.

19 test fixtures check table values and arithmetic. The expected values come from `scripts/expected.py`, which reads the USDA CSV files directly and applies the rounding rules by hand, not from the server code.

## Data sources

See [DATA_SOURCES.md](DATA_SOURCES.md). In short, nutrient values and household measures come from the USDA FoodData Central SR Legacy (2018-04) and Foundation Foods (2026-04-30) CSV downloads, fetched on 2026-11-02, which are public domain. Rounding rules and Daily Values come from the eCFR text of 21 CFR 101.9, fetched the same day.

## Limitations

- Values are for the raw ingredients as listed. Cooking losses, water evaporation and oil absorbed in frying are not modeled.
- 406 common ingredients, not branded products. Lines that do not match are listed under `unresolved_lines`. Rewrite them or give grams.
- SR Legacy does not report fiber or sugars for a few foods (some spices, grains and oils). Those show as null and the result lists which ingredients lacked a nutrient, so totals are a lower bound for that nutrient.
- Added sugars are not in SR Legacy. `round_nutrition_label` takes added sugars if you supply them.
- Matching is fuzzy. Check the matched name and FDC id in each line.
- This is arithmetic on published reference values. A commercial label may need lab analysis or a compliant database; check FDA guidance.

## Development

```
npm install
npm run build
npm test
npx wrangler deploy
```

`src/core.ts` holds the pure logic and `src/data.ts` the generated table. `src/stdio.ts` and `src/worker.ts` are thin entries over the same tool registry in `src/tools.ts`. Rebuild the table with `scripts/build_data.py` from the USDA CSV downloads.

## License

MIT

Part of the Zovo MCP collection: https://mcp.zovo.one
