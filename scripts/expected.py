"""Write test/fixtures.json. Expected values are read straight from the USDA CSV files and
21 CFR 101.9 rounding rules applied by hand here, never from the server code.
usage: python3 -I expected.py <sr_dir> <foundation_dir> test/fixtures.json"""
import csv, json, sys
sr, fd, out = sys.argv[1:4]
NEED = {'168894', '173410', '748967', '169655', '171265', '168833', '171413', '173414', '173944', '170000', '171287'}
val = {}
for d in (sr, fd):
    with open(d + '/food_nutrient.csv', encoding='utf8') as fh:
        for r in csv.DictReader(fh):
            if r['fdc_id'] in NEED and r['amount']:
                val.setdefault(r['fdc_id'], {})[r['nutrient_id']] = float(r['amount'])
port = {}
with open(sr + '/food_portion.csv', encoding='utf8') as fh:
    for r in csv.DictReader(fh):
        if r['fdc_id'] in NEED:
            port[(r['fdc_id'], r['modifier'])] = float(r['gram_weight']) / float(r['amount'])
def kcal(f): return val[f].get('1008', val[f].get('2048'))
r1 = lambda x: round(x + 1e-9, 1)
FX = []
def fx(name, tool, inp, expect): FX.append({'name': name, 'tool': tool, 'input': inp, 'expect': expect})

# lookups: values per 100 g exactly as in the CSV
fx('flour per 100 g from SR Legacy 168894', 'lookup_ingredient_nutrition', {'ingredient': 'all-purpose flour'},
   {'food.fdc_id': 168894, 'food.per_100g.kcal': kcal('168894'), 'food.per_100g.protein_g': val['168894']['1003'], 'food.per_100g.carbs_g': val['168894']['1005']})
fx('salted butter per 100 g, SR Legacy 173410', 'lookup_ingredient_nutrition', {'ingredient': 'butter'},
   {'food.fdc_id': 173410, 'food.per_100g.fat_g': val['173410']['1004'], 'food.per_100g.sodium_mg': val['173410']['1093'], 'food.per_100g.sat_fat_g': val['173410']['1258']})
fx('large egg is a Foundation food 748967', 'lookup_ingredient_nutrition', {'ingredient': 'egg'},
   {'food.fdc_id': 748967, 'food.per_100g.protein_g': val['748967']['1003'], 'food.per_100g.kcal': kcal('748967')})
fx('1 cup brown sugar is the USDA packed cup, 220 g', 'lookup_ingredient_nutrition', {'ingredient': 'brown sugar', 'amount': 1, 'unit': 'cup'},
   {'for_amount.grams': port[('168833', 'cup packed')], 'for_amount.nutrients.kcal': round(kcal('168833') * port[('168833', 'cup packed')] / 100, 2)})
fx('3 large eggs weigh 150 g (USDA large = 50 g)', 'lookup_ingredient_nutrition', {'ingredient': 'egg', 'amount': 3, 'unit': 'each'},
   {'for_amount.grams': 3 * port[('171287', 'large')]})
# recipes
fx('100 g sugar', 'calculate_recipe_nutrition', {'lines': ['100 g granulated sugar']},
   {'total.kcal': r1(kcal('169655')), 'total.carbs_g': r1(val['169655']['1005']), 'total_weight_g': 100})
cup_milk = port[('171265', 'cup')]
fx('1 cup whole milk = USDA cup weight', 'calculate_recipe_nutrition', {'lines': ['1 cup whole milk']},
   {'total_weight_g': cup_milk, 'total.kcal': r1(kcal('171265') * cup_milk / 100), 'total.protein_g': r1(val['171265']['1003'] * cup_milk / 100)})
# 2 cups flour + 1 cup sugar + 1/2 cup butter (8 tbsp), 4 servings; grams from the USDA cup portions
g_flour, g_sugar, g_butter = 2 * port[('168894', 'cup')], port[('169655', 'cup')], port[('173410', 'cup')] / 2
tot = kcal('168894') * g_flour / 100 + kcal('169655') * g_sugar / 100 + kcal('173410') * g_butter / 100
fat = val['168894']['1004'] * g_flour / 100 + val['173410']['1004'] * g_butter / 100 + val['169655'].get('1004', 0) * g_sugar / 100
fx('three-line dough, totals and per serving', 'calculate_recipe_nutrition', {'lines': ['2 cups all-purpose flour', '1 cup sugar', '1/2 cup butter'], 'servings': 4},
   {'total_weight_g': r1(g_flour + g_sugar + g_butter), 'total.kcal': r1(tot), 'per_serving.kcal': r1(tot / 4), 'total.fat_g': r1(fat)})
fx('1 stick butter = 1/4 lb', 'calculate_recipe_nutrition', {'lines': ['1 stick butter']}, {'total_weight_g': r1(453.59237 / 4)})
fx('1 (15 oz) can uses the net weight', 'calculate_recipe_nutrition', {'lines': ['1 (15 oz) can kidney beans']}, {'total_weight_g': r1(15 * 28.349523125)})
ban = port[('173944', 'medium (7" to 7-7/8" long)')]
fx('2 medium bananas use the USDA medium weight', 'calculate_recipe_nutrition', {'lines': ['2 medium bananas']}, {'total_weight_g': r1(2 * ban)})
fx('1 cup chopped onion uses the chopped cup', 'calculate_recipe_nutrition', {'lines': ['1 cup chopped onion']}, {'total_weight_g': port[('170000', 'cup, chopped')]})
# FDA rounding, 21 CFR 101.9(c), worked by hand from the rule text
fx('calories 47 -> 45 (nearest 5 up to 50)', 'round_nutrition_label', {'kcal': 47, 'fat_g': 4.3, 'sodium_mg': 137, 'carbs_g': 0.7, 'protein_g': 0.3},
   {'label.calories.declared': 45, 'label.total_fat.declared': 4.5, 'label.sodium.declared': 135, 'label.total_carbohydrate.text': 'less than 1g', 'label.protein.declared': 0})
fx('calories 52 -> 50, fat 5.6 -> 6, sodium 143 -> 140', 'round_nutrition_label', {'kcal': 52, 'fat_g': 5.6, 'sat_fat_g': 0.4, 'sodium_mg': 143},
   {'label.calories.declared': 50, 'label.total_fat.declared': 6, 'label.saturated_fat.declared': 0, 'label.sodium.declared': 140})
fx('calories under 5 are 0, sodium under 5 is 0', 'round_nutrition_label', {'kcal': 4.9, 'sodium_mg': 4.9, 'fat_g': 0.49}, {'label.calories.declared': 0, 'label.sodium.declared': 0, 'label.total_fat.declared': 0})
fx('percent DV from the 2,000 kcal DRVs', 'round_nutrition_label', {'kcal': 250, 'fat_g': 39, 'sat_fat_g': 5, 'sodium_mg': 460, 'carbs_g': 55, 'fiber_g': 7, 'added_sugars_g': 10},
   {'label.total_fat.percent_dv': 50, 'label.saturated_fat.percent_dv': 25, 'label.sodium.percent_dv': 20, 'label.total_carbohydrate.percent_dv': 20, 'label.dietary_fiber.percent_dv': 25, 'label.added_sugars.percent_dv': 20})
fx('calories 134.9 -> 130 (nearest 10 above 50)', 'round_nutrition_label', {'kcal': 134.9}, {'label.calories.declared': 130})
# scaling
fx('double 1 cup sugar', 'scale_recipe_nutrition', {'lines': ['1 cup sugar'], 'factor': 2},
   {'scaled_lines.0.scaled': '2 cup sugar', 'total_after.kcal': r1(kcal('169655') * 2 * g_sugar / 100)})
fx('4 to 6 servings: 2 large eggs -> 3 large eggs', 'scale_recipe_nutrition', {'lines': ['2 large eggs', '1 1/2 cups whole milk'], 'original_servings': 4, 'target_servings': 6},
   {'scaled_lines.0.scaled': '3 large eggs', 'scaled_lines.1.scaled': '2 1/4 cups whole milk', 'factor': 1.5, 'servings': 6})
json.dump(FX, open(out, 'w'), indent=1)
print(len(FX), 'fixtures')
