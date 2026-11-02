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

<!-- data-servers:start -->
## More data servers from the same author

Each one is free, needs no API key and has a hosted URL you can paste into Claude or ChatGPT.

| server | tools | hosted URL |
|---|---|---|
| [cups-to-grams-mcp](https://github.com/theluckystrike/cups-to-grams-mcp) | convert_ingredient, search_ingredients, scale_recipe, convert_oven_temperature | `https://cups-to-grams-mcp.lipmichal.workers.dev/mcp` |
| [dscr-loan-calculator-mcp](https://github.com/theluckystrike/dscr-loan-calculator-mcp) | calculate_dscr, max_loan_for_target_dscr, rent_needed_for_target_dscr, compare_scenarios, amortization_summary | `https://dscr-loan-calculator-mcp.lipmichal.workers.dev/mcp` |
| [gold-price-per-gram-mcp](https://github.com/theluckystrike/gold-price-per-gram-mcp) | get_gold_price_per_gram, get_metal_prices, calculate_jewelry_value, convert_gold_units | `https://gold-price-per-gram-mcp.lipmichal.workers.dev/mcp` |
| [lake-level-mcp](https://github.com/theluckystrike/lake-level-mcp) | search_lakes, get_lake_level, get_lake_history, compare_lakes | `https://lake-level-mcp.lipmichal.workers.dev/mcp` |
| [minimum-wage-mcp](https://github.com/theluckystrike/minimum-wage-mcp) | get_minimum_wage, list_upcoming_increases, compare_states, annual_income_at_minimum_wage | `https://minimum-wage-mcp.lipmichal.workers.dev/mcp` |
| [no-tax-on-overtime-mcp](https://github.com/theluckystrike/no-tax-on-overtime-mcp) | calculate_overtime_deduction, calculate_tips_deduction, calculate_senior_deduction, estimate_tax_savings, explain_eligibility | `https://no-tax-on-overtime-mcp.lipmichal.workers.dev/mcp` |
| [paycheck-calculator-mcp](https://github.com/theluckystrike/paycheck-calculator-mcp) | calculate_take_home_pay, compare_states_take_home, salary_to_hourly, hourly_to_salary, get_federal_tax_brackets | `https://paycheck-calculator-mcp.lipmichal.workers.dev/mcp` |
| [uk-income-tax-salary-mcp](https://github.com/theluckystrike/uk-income-tax-salary-mcp) | calculate_uk_take_home, get_uk_tax_bands, compare_salaries, marginal_rate_at_income | `https://uk-income-tax-salary-mcp.lipmichal.workers.dev/mcp` |
| [us-federal-holidays-business-days-mcp](https://github.com/theluckystrike/us-federal-holidays-business-days-mcp) | list_federal_holidays, is_business_day, add_business_days, count_business_days, invoice_due_date | `https://us-federal-holidays-business-days-mcp.lipmichal.workers.dev/mcp` |
| [ab-test-sample-size-calculator-mcp](https://github.com/theluckystrike/ab-test-sample-size-calculator-mcp) | calculate_sample_size, estimate_test_duration, test_ab_significance, fisher_exact_test, check_peeking_risk | `https://ab-test-sample-size-calculator-mcp.lipmichal.workers.dev/mcp` |
| [aca-premium-tax-credit-calculator-mcp](https://github.com/theluckystrike/aca-premium-tax-credit-calculator-mcp) | get_federal_poverty_level, calculate_premium_tax_credit, check_subsidy_cliff, get_aptc_repayment_cap | `https://aca-premium-tax-credit-calculator-mcp.lipmichal.workers.dev/mcp` |
| [ap-score-distributions-mcp](https://github.com/theluckystrike/ap-score-distributions-mcp) | get_ap_score_distribution, estimate_ap_percentile, compare_ap_exams, list_ap_exams, estimate_ap_score_from_composite | `https://ap-score-distributions-mcp.lipmichal.workers.dev/mcp` |
| [car-loan-interest-deduction-calculator-mcp](https://github.com/theluckystrike/car-loan-interest-deduction-calculator-mcp) | calculate_car_loan_interest_deduction, calculate_salt_deduction, get_tax_brackets_and_standard_deduction, calculate_child_tax_credit | `https://car-loan-interest-deduction-calculator-mcp.lipmichal.workers.dev/mcp` |
| [estate-gift-tax-exemption-calculator-mcp](https://github.com/theluckystrike/estate-gift-tax-exemption-calculator-mcp) | get_exemption_amounts, calculate_estate_tax, check_gift, compare_years | `https://estate-gift-tax-exemption-calculator-mcp.lipmichal.workers.dev/mcp` |
| [retirement-contribution-limits-2027-mcp](https://github.com/theluckystrike/retirement-contribution-limits-2027-mcp) | get_contribution_limits, calculate_max_contribution, get_social_security_cola, compare_years | `https://retirement-contribution-limits-2027-mcp.lipmichal.workers.dev/mcp` |
| [section-179-deduction-calculator-mcp](https://github.com/theluckystrike/section-179-deduction-calculator-mcp) | calculate_section_179, calculate_bonus_depreciation, get_vehicle_depreciation_limits, calculate_asset_loan_payment | `https://section-179-deduction-calculator-mcp.lipmichal.workers.dev/mcp` |
| [student-loan-repayment-assistance-plan-calculator-mcp](https://github.com/theluckystrike/student-loan-repayment-assistance-plan-calculator-mcp) | calculate_rap_payment, compare_rap_vs_standard, get_federal_loan_limits, get_plan_transition_dates | `https://student-loan-repayment-assistance-plan-calculator-mcp.lipmichal.workers.dev/mcp` |
| [subdomain-finder-mcp](https://github.com/theluckystrike/subdomain-finder-mcp) | find_subdomains, resolve_subdomains, get_certificate_history, summarize_attack_surface | `https://subdomain-finder-mcp.lipmichal.workers.dev/mcp` |
| [uk-statutory-sick-pay-maternity-pay-calculator-mcp](https://github.com/theluckystrike/uk-statutory-sick-pay-maternity-pay-calculator-mcp) | calculate_statutory_sick_pay, calculate_statutory_maternity_pay, get_minimum_wage_rates, check_eligibility | `https://uk-statutory-sick-pay-maternity-pay-calculator-mcp.lipmichal.workers.dev/mcp` |

The paid back-office collection (invoices, VAT, PDFs, spreadsheets) is at https://mcp.zovo.one
<!-- data-servers:end -->
