# Data sources

All values were fetched on 2026-11-02. Nothing comes from model memory.

## USDA FoodData Central (public domain)

- Download page: https://fdc.nal.usda.gov/download-datasets (fetched 2026-11-02, 200).
- SR Legacy CSV, https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_csv_2018-04.zip (fetched 2026-11-02, 200, 6,074,592 bytes, sha256 b80817294b8850530aaedf2e515c02593b1824f763a0ff356e5c2081643e6fd0).
- Foundation Foods CSV, https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_foundation_food_csv_2026-04-30.zip (fetched 2026-11-02, 200, 3,825,741 bytes, sha256 70457ee9d9342f43bda2010318c85f04210c689fdeb9cd2da4c513b0e8dbc655).
- The newer Foundation release, https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_foundation_food_csv_2026-10-29.zip (fetched 2026-11-02, 200, 1,127,612 bytes, sha256 e396b1ffc3ea05d1bdccbcddbfd2a4fcb42f64d37fabdacdd9c35158c4ced817), has no food.csv, food_nutrient.csv or food_portion.csv inside, so the 2026-04-30 release is used.
- USDA data is public domain (U.S. Government work). Citation: U.S. Department of Agriculture, Agricultural Research Service. FoodData Central, fdc.nal.usda.gov.

Nutrient ids used (from nutrient.csv): Energy 1008 (kcal; Foundation rows without 1008 use Atwater specific factors 2048), Protein 1003, Total lipid (fat) 1004, Fatty acids total saturated 1258, Carbohydrate by difference 1005, Fiber total dietary 1079, Sugars total 2000 (or Sugars, Total NLEA 1063), Sodium 1093.

`scripts/ingredients.txt` lists the 406 curated recipe ingredients with the SR Legacy description they map to and, for some, a Foundation food. `scripts/build_data.py` streams the CSV files row by row (no file is loaded whole) and writes `data/foods.json`. Rule: use the Foundation food when it carries all eight nutrients; otherwise use SR Legacy. Only 8 Foundation rows met that rule, because most Foundation foods lack total sugars or fiber. Household measures come from food_portion.csv of the SR Legacy food and the Foundation food, each with its FDC id. The CSV downloads were deleted after extraction.

## FDA Nutrition Facts rules

- 21 CFR 101.9, eCFR, https://www.ecfr.gov/api/renderer/v1/content/enhanced/current/title-21?part=101&section=101.9 (fetched 2026-11-02, 200). Human-readable page: https://www.ecfr.gov/current/title-21/chapter-I/subchapter-B/part-101/subpart-A/section-101.9
- Rounding: (c)(1) calories, (c)(2) total fat, (c)(2)(i) saturated fat, (c)(4) sodium, (c)(6) total carbohydrate, (c)(6)(i) dietary fiber, (c)(6)(ii) total sugars, (c)(6)(iii) added sugars, (c)(7) protein. Percent DV to the nearest whole percent, (d)(7)(ii).
- DRVs for adults and children 4 years and older, (c)(9) table: fat 78 g, saturated fat 20 g, cholesterol 300 mg, total carbohydrate 275 g, sodium 2,300 mg, dietary fiber 28 g, protein 50 g, added sugars 50 g.

## Unit constants

- NIST SP 811 Appendix B.9 (US gallon = 231 cubic inches, pound = 0.45359237 kg exact), as used by the sibling cups-to-grams-mcp server: https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b9

## Money site

- https://recipetool.net pages linked in results (all 200 with UTM on 2026-11-02 and listed in https://recipetool.net/sitemap.xml): /nutrition-calculator, /tools/ingredient-calorie-calculator, /tools/nutrition-facts-label-calculator, /tools/recipe-scaler.

## Ingredient table

Columns: id, FDC id, dataset, USDA description, kcal per 100 g, nutrients USDA does not report for that food.

| id | FDC id | dataset | USDA description | kcal/100 g | not reported |
| --- | --- | --- | --- | --- | --- |
| egg | 748967 | Foundation | Eggs, Grade A, Large, egg whole | 148.0 |  |
| egg-white | 172183 | SR Legacy | Egg, white, raw, fresh | 52.0 |  |
| egg-yolk | 172184 | SR Legacy | Egg, yolk, raw, fresh | 322.0 |  |
| butter-salted | 173410 | SR Legacy | Butter, salted | 717.0 |  |
| butter-unsalted | 173430 | SR Legacy | Butter, without salt | 717.0 |  |
| ghee | 173412 | SR Legacy | Butter oil, anhydrous | 876.0 |  |
| milk-whole | 171265 | SR Legacy | Milk, whole, 3.25% milkfat, with added vitamin D | 61.0 |  |
| milk-2 | 171267 | SR Legacy | Milk, reduced fat, fluid, 2% milkfat, with added vitamin A and vitamin D | 50.0 |  |
| milk-1 | 170872 | SR Legacy | Milk, lowfat, fluid, 1% milkfat, with added vitamin A and vitamin D | 42.0 |  |
| milk-skim | 171269 | SR Legacy | Milk, nonfat, fluid, with added vitamin A and vitamin D (fat free or skim) | 34.0 |  |
| buttermilk | 170874 | SR Legacy | Milk, buttermilk, fluid, cultured, lowfat | 40.0 |  |
| heavy-cream | 170859 | SR Legacy | Cream, fluid, heavy whipping | 340.0 |  |
| light-cream | 170857 | SR Legacy | Cream, fluid, light (coffee cream or table cream) | 195.0 |  |
| half-and-half | 171255 | SR Legacy | Cream, fluid, half and half | 131.0 |  |
| sour-cream | 171257 | SR Legacy | Cream, sour, cultured | 198.0 |  |
| cream-cheese | 173418 | SR Legacy | Cheese, cream | 350.0 |  |
| cheddar | 173414 | SR Legacy | Cheese, cheddar (Includes foods for USDA's Food Distribution Program) | 403.0 |  |
| mozzarella | 170845 | SR Legacy | Cheese, mozzarella, whole milk | 299.0 |  |
| mozzarella-part-skim | 171244 | SR Legacy | Cheese, mozzarella, low moisture, part-skim | 295.0 |  |
| parmesan | 171247 | SR Legacy | Cheese, parmesan, grated | 420.0 |  |
| parmesan-hard | 170848 | SR Legacy | Cheese, parmesan, hard | 392.0 |  |
| swiss | 171251 | SR Legacy | Cheese, swiss | 393.0 |  |
| feta | 173420 | SR Legacy | Cheese, feta | 265.0 |  |
| ricotta | 170851 | SR Legacy | Cheese, ricotta, whole milk | 150.0 |  |
| ricotta-part-skim | 171248 | SR Legacy | Cheese, ricotta, part skim milk | 138.0 |  |
| cottage-cheese | 172179 | SR Legacy | Cheese, cottage, creamed, large or small curd | 98.0 |  |
| goat-cheese | 173435 | SR Legacy | Cheese, goat, soft type | 264.0 |  |
| blue-cheese | 172175 | SR Legacy | Cheese, blue | 353.0 |  |
| monterey-jack | 170844 | SR Legacy | Cheese, monterey | 373.0 |  |
| provolone | 170850 | SR Legacy | Cheese, provolone | 351.0 |  |
| gruyere | 171242 | SR Legacy | Cheese, gruyere | 413.0 |  |
| brie | 172177 | SR Legacy | Cheese, brie | 334.0 |  |
| american-cheese | 170853 | SR Legacy | Cheese, pasteurized process, American, fortified with vitamin D | 366.0 |  |
| queso-fresco | 172223 | SR Legacy | Cheese, fresh, queso fresco | 299.0 |  |
| yogurt-plain-whole | 171284 | SR Legacy | Yogurt, plain, whole milk | 61.0 |  |
| yogurt-plain-lowfat | 170886 | SR Legacy | Yogurt, plain, low fat | 63.0 |  |
| greek-yogurt-nonfat | 170894 | SR Legacy | Yogurt, Greek, plain, nonfat (Includes foods for USDA's Food Distribution Program) | 59.0 |  |
| greek-yogurt-whole | 171304 | SR Legacy | Yogurt, Greek, plain, whole milk | 97.0 |  |
| evaporated-milk | 171276 | SR Legacy | Milk, canned, evaporated, with added vitamin D and without added vitamin A | 134.0 |  |
| condensed-milk | 171275 | SR Legacy | Milk, canned, condensed, sweetened | 321.0 |  |
| dry-milk | 170877 | SR Legacy | Milk, dry, nonfat, regular, without added vitamin A and vitamin D | 362.0 |  |
| olive-oil | 171413 | SR Legacy | Oil, olive, salad or cooking | 884.0 |  |
| vegetable-oil | 171411 | SR Legacy | Oil, soybean, salad or cooking | 884.0 |  |
| canola-oil | 172336 | SR Legacy | Oil, canola | 884.0 |  |
| coconut-oil | 171412 | SR Legacy | Oil, coconut | 892.0 |  |
| sesame-oil | 171016 | SR Legacy | Oil, sesame, salad or cooking | 884.0 |  |
| peanut-oil | 171410 | SR Legacy | Oil, peanut, salad or cooking | 884.0 |  |
| sunflower-oil | 171025 | SR Legacy | Oil, sunflower, linoleic, (approx. 65%) | 884.0 |  |
| corn-oil | 171029 | SR Legacy | Oil, corn, industrial and retail, all purpose salad or cooking | 900.0 |  |
| avocado-oil | 173573 | SR Legacy | Oil, avocado | 884.0 | sugars_g |
| shortening | 171011 | SR Legacy | Shortening, household, soybean (partially hydrogenated)-cottonseed (partially hydrogenated) | 884.0 |  |
| lard | 171401 | SR Legacy | Lard | 902.0 |  |
| margarine | 172346 | SR Legacy | Margarine, regular, 80% fat, composite, stick, with salt | 717.0 |  |
| mayonnaise | 171009 | SR Legacy | Salad dressing, mayonnaise, regular | 680.0 |  |
| sugar | 169655 | SR Legacy | Sugars, granulated | 387.0 |  |
| brown-sugar | 168833 | SR Legacy | Sugars, brown | 380.0 |  |
| powdered-sugar | 169656 | SR Legacy | Sugars, powdered | 389.0 |  |
| honey | 169640 | SR Legacy | Honey | 304.0 |  |
| maple-syrup | 169661 | SR Legacy | Syrups, maple | 260.0 |  |
| corn-syrup | 168837 | SR Legacy | Syrups, corn, light | 283.0 |  |
| molasses | 168820 | SR Legacy | Molasses | 290.0 |  |
| agave | 170277 | SR Legacy | Sweetener, syrup, agave | 310.0 |  |
| chocolate-chips | 167976 | SR Legacy | Candies, semisweet chocolate | 480.0 |  |
| dark-chocolate | 170273 | SR Legacy | Chocolate, dark, 70-85% cacao solids | 598.0 |  |
| baking-chocolate | 167568 | SR Legacy | Baking chocolate, unsweetened, squares | 642.0 |  |
| milk-chocolate | 167587 | SR Legacy | Candies, milk chocolate | 535.0 |  |
| white-chocolate | 167571 | SR Legacy | Candies, white chocolate | 539.0 |  |
| cocoa-powder | 169593 | SR Legacy | Cocoa, dry powder, unsweetened | 228.0 |  |
| jam | 169641 | SR Legacy | Jams and preserves | 278.0 |  |
| marshmallows | 167995 | SR Legacy | Candies, marshmallows | 318.0 |  |
| gelatin | 169599 | SR Legacy | Gelatins, dry powder, unsweetened | 335.0 |  |
| flour-ap | 168894 | SR Legacy | Wheat flour, white, all-purpose, enriched, bleached | 364.0 |  |
| flour-ap-unbleached | 168936 | SR Legacy | Wheat flour, white, all-purpose, enriched, unbleached | 364.0 |  |
| flour-bread | 168896 | SR Legacy | Wheat flour, white, bread, enriched | 361.0 |  |
| flour-cake | 169723 | SR Legacy | Wheat flour, white, cake, enriched | 362.0 |  |
| flour-whole-wheat | 168893 | SR Legacy | Wheat flour, whole-grain (Includes foods for USDA's Food Distribution Program) | 340.0 |  |
| flour-self-rising | 168895 | SR Legacy | Wheat flour, white, all-purpose, self-rising, enriched | 354.0 |  |
| flour-rice | 169714 | SR Legacy | Rice flour, white, unenriched | 366.0 |  |
| flour-rye | 168886 | SR Legacy | Rye flour, medium | 349.0 |  |
| flour-oat | 169741 | SR Legacy | Oat flour, partially debranned | 404.0 |  |
| masa-harina | 169694 | SR Legacy | Corn flour, masa, enriched, white | 363.0 |  |
| cornmeal | 169697 | SR Legacy | Cornmeal, whole-grain, yellow | 362.0 |  |
| cornstarch | 169698 | SR Legacy | Cornstarch | 381.0 |  |
| semolina | 169715 | SR Legacy | Semolina, enriched | 360.0 | sugars_g |
| oats | 173904 | SR Legacy | Cereals, oats, regular and quick, not fortified, dry | 379.0 |  |
| rice-white | 168877 | SR Legacy | Rice, white, long-grain, regular, raw, enriched | 365.0 |  |
| rice-white-cooked | 168878 | SR Legacy | Rice, white, long-grain, regular, enriched, cooked | 130.0 |  |
| rice-brown | 169703 | SR Legacy | Rice, brown, long-grain, raw (Includes foods for USDA's Food Distribution Program) | 367.0 |  |
| rice-brown-cooked | 169704 | SR Legacy | Rice, brown, long-grain, cooked (Includes foods for USDA's Food Distribution Program) | 123.0 |  |
| rice-arborio | 168931 | SR Legacy | Rice, white, short-grain, raw, unenriched | 358.0 | fiber_g, sugars_g |
| wild-rice | 169726 | SR Legacy | Wild rice, raw | 357.0 |  |
| pasta | 169736 | SR Legacy | Pasta, dry, enriched | 371.0 |  |
| pasta-cooked | 169737 | SR Legacy | Pasta, cooked, enriched, without added salt | 158.0 |  |
| pasta-whole-wheat | 169738 | SR Legacy | Pasta, whole-wheat, dry (Includes foods for USDA's Food Distribution Program) | 352.0 |  |
| egg-noodles | 169731 | SR Legacy | Noodles, egg, dry, enriched | 384.0 |  |
| rice-noodles | 169742 | SR Legacy | Rice noodles, dry | 364.0 |  |
| quinoa | 168874 | SR Legacy | Quinoa, uncooked | 368.0 | sugars_g |
| quinoa-cooked | 168917 | SR Legacy | Quinoa, cooked | 120.0 |  |
| couscous | 169699 | SR Legacy | Couscous, dry | 376.0 | sugars_g |
| barley | 170284 | SR Legacy | Barley, pearled, raw | 352.0 |  |
| bulgur | 170688 | SR Legacy | Bulgur, dry | 342.0 |  |
| millet | 169702 | SR Legacy | Millet, raw | 378.0 | sugars_g |
| buckwheat | 170286 | SR Legacy | Buckwheat | 343.0 | sugars_g |
| breadcrumbs | 174928 | SR Legacy | Bread, crumbs, dry, grated, plain | 395.0 |  |
| bread-white | 174924 | SR Legacy | Bread, white, commercially prepared (includes soft bread crumbs) | 266.0 |  |
| bread-whole-wheat | 172688 | SR Legacy | Bread, whole-wheat, commercially prepared | 252.0 |  |
| bread-sourdough | 172675 | SR Legacy | Bread, french or vienna (includes sourdough) | 272.0 |  |
| pita | 174915 | SR Legacy | Bread, pita, white, enriched | 275.0 |  |
| tortilla-flour | 175037 | SR Legacy | Tortillas, ready-to-bake or -fry, flour, refrigerated | 306.0 |  |
| tortilla-corn | 175036 | SR Legacy | Tortillas, ready-to-bake or -fry, corn | 218.0 |  |
| baking-powder | 172803 | SR Legacy | Leavening agents, baking powder, double-acting, sodium aluminum sulfate | 53.0 |  |
| baking-soda | 175040 | SR Legacy | Leavening agents, baking soda | 0.0 |  |
| yeast | 175043 | SR Legacy | Leavening agents, yeast, baker's, active dry | 325.0 |  |
| cream-of-tartar | 175041 | SR Legacy | Leavening agents, cream of tartar | 258.0 |  |
| graham-crackers | 174957 | SR Legacy | Cookies, graham crackers, plain or honey (includes cinnamon) | 430.0 |  |
| saltines | 172746 | SR Legacy | Crackers, saltines (includes oyster, soda, soup) | 418.0 |  |
| puff-pastry | 172790 | SR Legacy | Puff pastry, frozen, ready-to-bake | 551.0 |  |
| phyllo | 172791 | SR Legacy | Phyllo dough | 299.0 |  |
| pie-crust | 167932 | SR Legacy | Pie crust, refrigerated, regular, unbaked | 445.0 | sugars_g |
| tapioca | 169717 | SR Legacy | Tapioca, pearl, dry | 358.0 |  |
| salt | 173468 | SR Legacy | Salt, table | 0.0 |  |
| black-pepper | 170931 | SR Legacy | Spices, pepper, black | 251.0 |  |
| cinnamon | 171320 | SR Legacy | Spices, cinnamon, ground | 247.0 |  |
| nutmeg | 171326 | SR Legacy | Spices, nutmeg, ground | 525.0 |  |
| ginger-ground | 170926 | SR Legacy | Spices, ginger, ground | 335.0 |  |
| cumin | 170923 | SR Legacy | Spices, cumin seed | 375.0 |  |
| paprika | 171329 | SR Legacy | Spices, paprika | 282.0 |  |
| chili-powder | 171319 | SR Legacy | Spices, chili powder | 282.0 |  |
| cayenne | 170932 | SR Legacy | Spices, pepper, red or cayenne | 318.0 |  |
| garlic-powder | 171325 | SR Legacy | Spices, garlic powder | 331.0 |  |
| onion-powder | 171327 | SR Legacy | Spices, onion powder | 341.0 |  |
| oregano | 171328 | SR Legacy | Spices, oregano, dried | 265.0 |  |
| basil-dried | 171317 | SR Legacy | Spices, basil, dried | 233.0 |  |
| thyme-dried | 170938 | SR Legacy | Spices, thyme, dried | 276.0 |  |
| rosemary-dried | 171333 | SR Legacy | Spices, rosemary, dried | 331.0 | sugars_g |
| parsley-dried | 170930 | SR Legacy | Spices, parsley, dried | 292.0 |  |
| bay-leaf | 170917 | SR Legacy | Spices, bay leaf | 313.0 | sugars_g |
| turmeric | 172231 | SR Legacy | Spices, turmeric, ground | 312.0 |  |
| cloves | 171321 | SR Legacy | Spices, cloves, ground | 274.0 |  |
| allspice | 171315 | SR Legacy | Spices, allspice, ground | 263.0 | sugars_g |
| curry-powder | 170924 | SR Legacy | Spices, curry powder | 325.0 |  |
| coriander-seed | 170922 | SR Legacy | Spices, coriander seed | 298.0 | sugars_g |
| dill-dried | 171322 | SR Legacy | Spices, dill weed, dried | 253.0 | sugars_g |
| mustard-seed | 170929 | SR Legacy | Spices, mustard seed, ground | 508.0 |  |
| sage | 170935 | SR Legacy | Spices, sage, ground | 315.0 |  |
| cardamom | 170919 | SR Legacy | Spices, cardamom | 311.0 | sugars_g |
| fennel-seed | 171323 | SR Legacy | Spices, fennel seed | 345.0 | sugars_g |
| poppy-seed | 171330 | SR Legacy | Spices, poppy seed | 525.0 |  |
| celery-seed | 170920 | SR Legacy | Spices, celery seed | 392.0 |  |
| pumpkin-pie-spice | 171332 | SR Legacy | Spices, pumpkin pie spice | 342.0 |  |
| poultry-seasoning | 171331 | SR Legacy | Spices, poultry seasoning | 307.0 |  |
| vanilla-extract | 173471 | SR Legacy | Vanilla extract | 288.0 |  |
| basil-fresh | 172232 | SR Legacy | Basil, fresh | 23.0 |  |
| parsley-fresh | 170416 | SR Legacy | Parsley, fresh | 36.0 |  |
| cilantro | 169997 | SR Legacy | Coriander (cilantro) leaves, raw | 23.0 |  |
| dill-fresh | 172233 | SR Legacy | Dill weed, fresh | 43.0 | sugars_g |
| mint | 173475 | SR Legacy | Spearmint, fresh | 44.0 | sugars_g |
| rosemary-fresh | 173473 | SR Legacy | Rosemary, fresh | 131.0 | sugars_g |
| thyme-fresh | 173470 | SR Legacy | Thyme, fresh | 101.0 | sugars_g |
| chives | 169994 | SR Legacy | Chives, raw | 30.0 |  |
| ginger | 169231 | SR Legacy | Ginger root, raw | 80.0 |  |
| garlic | 169230 | SR Legacy | Garlic, raw | 149.0 |  |
| soy-sauce | 174277 | SR Legacy | Soy sauce made from soy and wheat (shoyu) | 53.0 |  |
| vinegar | 172237 | SR Legacy | Vinegar, distilled | 18.0 |  |
| cider-vinegar | 173469 | SR Legacy | Vinegar, cider | 21.0 |  |
| balsamic | 172241 | SR Legacy | Vinegar, balsamic | 88.0 | fiber_g |
| red-wine-vinegar | 172240 | SR Legacy | Vinegar, red wine | 19.0 |  |
| ketchup | 168556 | SR Legacy | Catsup | 101.0 |  |
| mustard | 326698 | Foundation | Mustard, prepared, yellow | 61.0 |  |
| worcestershire | 171610 | SR Legacy | Sauce, worcestershire | 77.0 |  |
| hot-sauce | 174527 | SR Legacy | Sauce, ready-to-serve, pepper or hot | 11.0 |  |
| tomato-paste | 170459 | SR Legacy | Tomato products, canned, paste, without salt added (Includes foods for USDA's Food Distribution Program) | 82.0 |  |
| tomato-sauce | 170054 | SR Legacy | Tomato products, canned, sauce | 24.0 |  |
| tomato-puree | 170460 | SR Legacy | Tomato products, canned, puree, without salt added | 38.0 |  |
| canned-tomatoes | 170051 | SR Legacy | Tomatoes, red, ripe, canned, packed in tomato juice | 16.0 |  |
| crushed-tomatoes | 170501 | SR Legacy | Tomatoes, crushed, canned | 32.0 |  |
| salsa | 174524 | SR Legacy | Sauce, salsa, ready-to-serve | 29.0 |  |
| marinara | 332282 | Foundation | Sauce, pasta, spaghetti/marinara, ready-to-serve | 45.0 |  |
| chicken-broth | 174536 | SR Legacy | Soup, chicken broth, ready-to-serve | 6.0 |  |
| beef-broth | 171538 | SR Legacy | Soup, beef broth or bouillon canned, ready-to-serve | 7.0 |  |
| vegetable-broth | 171583 | SR Legacy | Soup, vegetable broth, ready to serve | 5.0 |  |
| fish-sauce | 174531 | SR Legacy | Sauce, fish, ready-to-serve | 35.0 |  |
| oyster-sauce | 174529 | SR Legacy | Sauce, oyster, ready-to-serve | 51.0 |  |
| hoisin | 172886 | SR Legacy | Sauce, hoisin, ready-to-serve | 220.0 |  |
| bbq-sauce | 174523 | SR Legacy | Sauce, barbecue | 172.0 |  |
| teriyaki | 171167 | SR Legacy | Sauce, teriyaki, ready-to-serve | 89.0 |  |
| peanut-butter | 174266 | SR Legacy | Peanut butter, smooth style, with salt (Includes foods for USDA's Food Distribution Program) | 598.0 |  |
| tahini | 170189 | SR Legacy | Seeds, sesame butter, tahini, from roasted and toasted kernels (most common type) | 595.0 |  |
| miso | 172442 | SR Legacy | Miso | 198.0 |  |
| coconut-milk | 170173 | SR Legacy | Nuts, coconut milk, canned (liquid expressed from grated meat and water) | 197.0 | fiber_g, sugars_g |
| coconut-cream | 170171 | SR Legacy | Nuts, coconut cream, canned, sweetened | 357.0 |  |
| capers | 172238 | SR Legacy | Capers, canned | 23.0 |  |
| olives-black | 169094 | SR Legacy | Olives, ripe, canned (small-extra large) | 116.0 |  |
| olives-green | 169096 | SR Legacy | Olives, pickled, canned or bottled, green | 145.0 |  |
| pickles | 168558 | SR Legacy | Pickles, cucumber, dill or kosher dill | 12.0 |  |
| lemon-juice | 167747 | SR Legacy | Lemon juice, raw | 22.0 |  |
| lime-juice | 168156 | SR Legacy | Lime juice, raw | 25.0 |  |
| orange-juice | 169098 | SR Legacy | Orange juice, raw (Includes foods for USDA's Food Distribution Program) | 45.0 |  |
| apple-juice | 173933 | SR Legacy | Apple juice, canned or bottled, unsweetened, without added ascorbic acid | 46.0 |  |
| ranch | 173592 | SR Legacy | Salad dressing, ranch dressing, regular | 430.0 |  |
| italian-dressing | 171019 | SR Legacy | Salad dressing, italian dressing, commercial, regular | 240.0 |  |
| pesto | 171579 | SR Legacy | Sauce, pesto, ready-to-serve, refrigerated | 418.0 |  |
| onion | 170000 | SR Legacy | Onions, raw | 40.0 |  |
| green-onion | 170005 | SR Legacy | Onions, spring or scallions (includes tops and bulb), raw | 32.0 |  |
| shallot | 170499 | SR Legacy | Shallots, raw | 72.0 |  |
| carrot | 170393 | SR Legacy | Carrots, raw | 41.0 |  |
| celery | 169988 | SR Legacy | Celery, raw | 14.0 |  |
| potato | 170026 | SR Legacy | Potatoes, flesh and skin, raw | 77.0 |  |
| potato-russet | 170027 | SR Legacy | Potatoes, russet, flesh and skin, raw (Includes foods for USDA's Food Distribution Program) | 79.0 |  |
| potato-red | 170029 | SR Legacy | Potatoes, red, flesh and skin, raw | 70.0 |  |
| potato-gold | 170028 | SR Legacy | Potatoes, white, flesh and skin, raw | 69.0 |  |
| sweet-potato | 168482 | SR Legacy | Sweet potato, raw, unprepared (Includes foods for USDA's Food Distribution Program) | 86.0 |  |
| tomato | 170457 | SR Legacy | Tomatoes, red, ripe, raw, year round average | 18.0 |  |
| red-bell-pepper | 170108 | SR Legacy | Peppers, sweet, red, raw | 26.0 |  |
| green-bell-pepper | 170427 | SR Legacy | Peppers, sweet, green, raw | 20.0 |  |
| yellow-bell-pepper | 169383 | SR Legacy | Peppers, sweet, yellow, raw | 27.0 | sugars_g |
| jalapeno | 168576 | SR Legacy | Peppers, jalapeno, raw | 29.0 |  |
| poblano | 170497 | SR Legacy | Peppers, hot chili, green, raw | 40.0 |  |
| broccoli | 747447 | Foundation | Broccoli, raw | 31.0 |  |
| cauliflower | 169986 | SR Legacy | Cauliflower, raw | 25.0 |  |
| spinach | 168462 | SR Legacy | Spinach, raw | 23.0 |  |
| spinach-frozen | 169287 | SR Legacy | Spinach, frozen, chopped or leaf, unprepared (Includes foods for USDA's Food Distribution Program) | 29.0 |  |
| kale | 168421 | SR Legacy | Kale, raw | 35.0 |  |
| romaine | 169247 | SR Legacy | Lettuce, cos or romaine, raw | 17.0 |  |
| iceberg | 169248 | SR Legacy | Lettuce, iceberg (includes crisphead types), raw | 14.0 |  |
| arugula | 169387 | SR Legacy | Arugula, raw | 25.0 |  |
| cabbage | 169975 | SR Legacy | Cabbage, raw | 25.0 |  |
| red-cabbage | 169977 | SR Legacy | Cabbage, red, raw | 31.0 |  |
| bok-choy | 170390 | SR Legacy | Cabbage, chinese (pak-choi), raw | 13.0 |  |
| zucchini | 169291 | SR Legacy | Squash, summer, zucchini, includes skin, raw | 17.0 |  |
| yellow-squash | 168464 | SR Legacy | Squash, summer, crookneck and straightneck, raw | 19.0 |  |
| butternut-squash | 169295 | SR Legacy | Squash, winter, butternut, raw | 45.0 |  |
| acorn-squash | 168472 | SR Legacy | Squash, winter, acorn, raw | 40.0 | sugars_g |
| spaghetti-squash | 169298 | SR Legacy | Squash, winter, spaghetti, raw | 31.0 |  |
| pumpkin-canned | 168450 | SR Legacy | Pumpkin, canned, without salt | 34.0 |  |
| mushrooms | 169251 | SR Legacy | Mushrooms, white, raw | 22.0 |  |
| cremini | 168434 | SR Legacy | Mushrooms, brown, italian, or crimini, raw | 22.0 |  |
| portabella | 169255 | SR Legacy | Mushrooms, portabella, raw | 22.0 |  |
| shiitake | 169242 | SR Legacy | Mushrooms, shiitake, raw | 34.0 | sat_fat_g |
| cucumber | 168409 | SR Legacy | Cucumber, with peel, raw | 15.0 |  |
| eggplant | 169228 | SR Legacy | Eggplant, raw | 25.0 |  |
| asparagus | 168389 | SR Legacy | Asparagus, raw | 20.0 |  |
| green-beans | 169961 | SR Legacy | Beans, snap, green, raw | 31.0 |  |
| peas-frozen | 170016 | SR Legacy | Peas, green, frozen, unprepared (Includes foods for USDA's Food Distribution Program) | 77.0 |  |
| corn | 169998 | SR Legacy | Corn, sweet, yellow, raw | 86.0 |  |
| corn-frozen | 168398 | SR Legacy | Corn, sweet, yellow, frozen, kernels cut off cob, unprepared (Includes foods for USDA's Food Distribution Program) | 88.0 |  |
| brussels-sprouts | 170383 | SR Legacy | Brussels sprouts, raw | 43.0 |  |
| leek | 169246 | SR Legacy | Leeks, (bulb and lower leaf-portion), raw | 61.0 |  |
| beet | 169145 | SR Legacy | Beets, raw | 43.0 |  |
| radish | 169276 | SR Legacy | Radishes, raw | 16.0 |  |
| avocado | 171706 | SR Legacy | Avocados, raw, California | 167.0 |  |
| parsnip | 170417 | SR Legacy | Parsnips, raw | 75.0 |  |
| turnip | 170465 | SR Legacy | Turnips, raw | 28.0 |  |
| fennel | 169385 | SR Legacy | Fennel, bulb, raw | 31.0 |  |
| okra | 169260 | SR Legacy | Okra, raw | 33.0 |  |
| bean-sprouts | 169957 | SR Legacy | Mung beans, mature seeds, sprouted, raw | 30.0 |  |
| water-chestnuts | 170067 | SR Legacy | Waterchestnuts, chinese, canned, solids and liquids | 50.0 |  |
| sun-dried-tomatoes | 168567 | SR Legacy | Tomatoes, sun-dried | 258.0 |  |
| mixed-vegetables | 170471 | SR Legacy | Vegetables, mixed, frozen, unprepared | 72.0 | sugars_g |
| collards | 170406 | SR Legacy | Collards, raw | 32.0 |  |
| chard | 169991 | SR Legacy | Chard, swiss, raw | 19.0 |  |
| artichoke-hearts | 168387 | SR Legacy | Artichokes, (globe or french), frozen, unprepared | 38.0 | sugars_g |
| tomatillo | 168566 | SR Legacy | Tomatillos, raw | 32.0 |  |
| plantain | 169130 | SR Legacy | Plantains, yellow, raw | 122.0 |  |
| apple | 171688 | SR Legacy | Apples, raw, with skin (Includes foods for USDA's Food Distribution Program) | 52.0 |  |
| banana | 173944 | SR Legacy | Bananas, raw | 89.0 |  |
| lemon | 167746 | SR Legacy | Lemons, raw, without peel | 29.0 |  |
| lime | 168155 | SR Legacy | Limes, raw | 30.0 |  |
| orange | 169097 | SR Legacy | Oranges, raw, all commercial varieties | 47.0 |  |
| strawberries | 167762 | SR Legacy | Strawberries, raw | 32.0 |  |
| blueberries | 171711 | SR Legacy | Blueberries, raw | 57.0 |  |
| raspberries | 167755 | SR Legacy | Raspberries, raw | 52.0 |  |
| blackberries | 173946 | SR Legacy | Blackberries, raw | 43.0 |  |
| cranberries | 171722 | SR Legacy | Cranberries, raw | 46.0 |  |
| dried-cranberries | 171723 | SR Legacy | Cranberries, dried, sweetened (Includes foods for USDA's Food Distribution Program) | 308.0 |  |
| raisins | 168165 | SR Legacy | Raisins, dark, seedless (Includes foods for USDA's Food Distribution Program) | 299.0 |  |
| dates | 168191 | SR Legacy | Dates, medjool | 277.0 | sat_fat_g |
| peach | 169928 | SR Legacy | Peaches, yellow, raw | 39.0 |  |
| pear | 169118 | SR Legacy | Pears, raw | 57.0 |  |
| pineapple | 169124 | SR Legacy | Pineapple, raw, all varieties | 50.0 |  |
| mango | 169910 | SR Legacy | Mangos, raw | 60.0 |  |
| grapes | 174683 | SR Legacy | Grapes, red or green (European type, such as Thompson seedless), raw | 69.0 |  |
| cherries | 171719 | SR Legacy | Cherries, sweet, raw | 63.0 |  |
| watermelon | 167765 | SR Legacy | Watermelon, raw | 30.0 |  |
| cantaloupe | 169092 | SR Legacy | Melons, cantaloupe, raw | 34.0 |  |
| kiwi | 168153 | SR Legacy | Kiwifruit, green, raw | 61.0 |  |
| coconut-sweetened | 168586 | SR Legacy | Nuts, coconut meat, dried (desiccated), sweetened, shredded | 501.0 |  |
| coconut-unsweetened | 170170 | SR Legacy | Nuts, coconut meat, dried (desiccated), not sweetened | 660.0 |  |
| applesauce | 171695 | SR Legacy | Applesauce, canned, unsweetened, without added ascorbic acid (Includes foods for USDA's Food Distribution Program) | 42.0 |  |
| lemon-zest | 167749 | SR Legacy | Lemon peel, raw | 47.0 |  |
| orange-zest | 169103 | SR Legacy | Orange peel, raw | 97.0 | sugars_g |
| dried-apricots | 173941 | SR Legacy | Apricots, dried, sulfured, uncooked | 241.0 |  |
| plum | 169949 | SR Legacy | Plums, raw | 46.0 |  |
| prunes | 168162 | SR Legacy | Plums, dried (prunes), uncooked | 240.0 |  |
| figs-dried | 174665 | SR Legacy | Figs, dried, uncooked | 249.0 |  |
| pomegranate | 169134 | SR Legacy | Pomegranates, raw | 83.0 |  |
| rhubarb | 167758 | SR Legacy | Rhubarb, raw | 21.0 |  |
| grapefruit | 173033 | SR Legacy | Grapefruit, raw, pink and red and white, all areas | 32.0 |  |
| apricot | 171697 | SR Legacy | Apricots, raw | 48.0 |  |
| nectarine | 327357 | Foundation | Nectarines, raw | 39.0 |  |
| almonds | 170567 | SR Legacy | Nuts, almonds | 579.0 |  |
| walnuts | 170187 | SR Legacy | Nuts, walnuts, english | 654.0 |  |
| pecans | 170182 | SR Legacy | Nuts, pecans | 691.0 |  |
| cashews | 170162 | SR Legacy | Nuts, cashew nuts, raw | 553.0 |  |
| peanuts | 172430 | SR Legacy | Peanuts, all types, raw | 567.0 |  |
| pistachios | 170184 | SR Legacy | Nuts, pistachio nuts, raw | 560.0 |  |
| hazelnuts | 170581 | SR Legacy | Nuts, hazelnuts or filberts | 628.0 |  |
| macadamia | 170178 | SR Legacy | Nuts, macadamia nuts, raw | 718.0 |  |
| pine-nuts | 170591 | SR Legacy | Nuts, pine nuts, dried | 673.0 |  |
| sunflower-seeds | 170562 | SR Legacy | Seeds, sunflower seed kernels, dried | 584.0 |  |
| pumpkin-seeds | 170556 | SR Legacy | Seeds, pumpkin and squash seed kernels, dried | 559.0 |  |
| sesame-seeds | 170150 | SR Legacy | Seeds, sesame seeds, whole, dried | 573.0 |  |
| chia | 170554 | SR Legacy | Seeds, chia seeds, dried | 486.0 | sugars_g |
| flaxseed | 169414 | SR Legacy | Seeds, flaxseed | 534.0 |  |
| almond-butter | 168588 | SR Legacy | Nuts, almond butter, plain, without salt added | 614.0 |  |
| almond-milk | 1999631 | Foundation | Almond milk, unsweetened, plain, shelf stable | 14.556 |  |
| soy-milk | 1999630 | Foundation | Soy milk, unsweetened, plain, shelf stable | 38.485 |  |
| black-beans | 173735 | SR Legacy | Beans, black, mature seeds, cooked, boiled, without salt | 132.0 |  |
| black-beans-canned | 175188 | SR Legacy | Beans, black turtle, mature seeds, canned | 91.0 |  |
| black-beans-dry | 173734 | SR Legacy | Beans, black, mature seeds, raw | 341.0 |  |
| kidney-beans | 175195 | SR Legacy | Beans, kidney, red, mature seeds, canned, solids and liquids | 81.0 |  |
| pinto-beans | 175200 | SR Legacy | Beans, pinto, mature seeds, cooked, boiled, without salt | 143.0 |  |
| pinto-beans-canned | 174286 | SR Legacy | Beans, pinto, canned, drained solids | 114.0 |  |
| navy-beans | 173746 | SR Legacy | Beans, navy, mature seeds, cooked, boiled, without salt | 140.0 |  |
| cannellini | 175192 | SR Legacy | Beans, great northern, mature seeds, canned | 114.0 |  |
| chickpeas-canned | 173800 | SR Legacy | Chickpeas (garbanzo beans, bengal gram), mature seeds, canned, drained solids | 139.0 |  |
| chickpeas-cooked | 173757 | SR Legacy | Chickpeas (garbanzo beans, bengal gram), mature seeds, cooked, boiled, without salt | 164.0 |  |
| chickpeas-dry | 173756 | SR Legacy | Chickpeas (garbanzo beans, bengal gram), mature seeds, raw | 378.0 |  |
| lentils | 172420 | SR Legacy | Lentils, raw | 352.0 |  |
| lentils-cooked | 172421 | SR Legacy | Lentils, mature seeds, cooked, boiled, without salt | 116.0 |  |
| split-peas | 172429 | SR Legacy | Peas, split, mature seeds, cooked, boiled, without salt | 118.0 |  |
| refried-beans | 172438 | SR Legacy | Refried beans, canned, traditional style | 90.0 |  |
| baked-beans | 175182 | SR Legacy | Beans, baked, canned, plain or vegetarian | 94.0 |  |
| tofu-firm | 172448 | SR Legacy | Tofu, firm, prepared with calcium sulfate and magnesium chloride (nigari) | 78.0 |  |
| tofu-soft | 172449 | SR Legacy | Tofu, soft, prepared with calcium sulfate and magnesium chloride (nigari) | 61.0 |  |
| edamame | 168410 | SR Legacy | Edamame, frozen, unprepared | 109.0 | sat_fat_g |
| tempeh | 174272 | SR Legacy | Tempeh | 192.0 | fiber_g, sugars_g |
| hummus | 321358 | Foundation | Hummus, commercial | 229.0 |  |
| chicken-breast | 171077 | SR Legacy | Chicken, broiler or fryers, breast, skinless, boneless, meat only, raw | 120.0 |  |
| chicken-thigh | 173627 | SR Legacy | Chicken, broilers or fryers, dark meat, thigh, meat only, raw | 121.0 |  |
| chicken-thigh-skin | 172385 | SR Legacy | Chicken, broilers or fryers, thigh, meat and skin, raw | 221.0 |  |
| chicken-drumstick | 172373 | SR Legacy | Chicken, broilers or fryers, drumstick, meat and skin, raw | 161.0 |  |
| chicken-wing | 172390 | SR Legacy | Chicken, broilers or fryers, wing, meat and skin, raw | 191.0 |  |
| chicken-whole | 171447 | SR Legacy | Chicken, broilers or fryers, meat and skin, raw | 215.0 |  |
| chicken-cooked | 171477 | SR Legacy | Chicken, broilers or fryers, breast, meat only, cooked, roasted | 165.0 |  |
| chicken-ground | 171116 | SR Legacy | Chicken, ground, raw | 143.0 |  |
| turkey-ground | 171505 | SR Legacy | Turkey, Ground, raw | 148.0 |  |
| turkey-breast | 171098 | SR Legacy | Turkey, whole, breast, meat only, raw | 114.0 |  |
| beef-ground-80 | 174036 | SR Legacy | Beef, ground, 80% lean meat / 20% fat, raw | 254.0 |  |
| beef-ground-85 | 171796 | SR Legacy | Beef, ground, 85% lean meat / 15% fat, raw (Includes foods for USDA's Food Distribution Program) | 215.0 |  |
| beef-ground-90 | 174030 | SR Legacy | Beef, ground, 90% lean meat / 10% fat, raw | 176.0 |  |
| beef-ground-93 | 173110 | SR Legacy | Beef, ground, 93% lean meat / 7% fat, raw | 152.0 |  |
| beef-chuck | 169491 | SR Legacy | Beef, chuck, arm pot roast, separable lean and fat, trimmed to 1/8" fat, all grades, raw | 244.0 |  |
| beef-sirloin | 168726 | SR Legacy | Beef, top sirloin, steak, separable lean and fat, trimmed to 1/8" fat, all grades, raw | 201.0 |  |
| beef-ribeye | 168612 | SR Legacy | Beef, rib, eye, small end (ribs 10-12), separable lean and fat, trimmed to 0" fat, choice, raw | 274.0 | sugars_g |
| beef-flank | 169563 | SR Legacy | Beef, flank, steak, separable lean and fat, trimmed to 0" fat, all grades, raw | 155.0 |  |
| beef-tenderloin | 168724 | SR Legacy | Beef, tenderloin, steak, separable lean and fat, trimmed to 1/8" fat, select, raw | 249.0 |  |
| beef-strip | 169538 | SR Legacy | Beef, short loin, top loin, steak, separable lean and fat, trimmed to 1/8" fat, all grades, raw | 228.0 |  |
| beef-brisket | 168666 | SR Legacy | Beef, brisket, flat half, separable lean and fat, trimmed to 1/8" fat, all grades, raw | 277.0 |  |
| pork-chop | 168238 | SR Legacy | Pork, fresh, loin, center loin (chops), bone-in, separable lean and fat, raw | 170.0 |  |
| pork-tenderloin | 168249 | SR Legacy | Pork, fresh, loin, tenderloin, separable lean only, raw | 109.0 |  |
| pork-loin | 167818 | SR Legacy | Pork, fresh, loin, whole, separable lean and fat, raw | 198.0 |  |
| pork-ground | 167902 | SR Legacy | Pork, fresh, ground, raw | 263.0 | sugars_g |
| pork-shoulder | 167843 | SR Legacy | Pork, fresh, shoulder, whole, separable lean and fat, raw | 236.0 |  |
| pork-belly | 167812 | SR Legacy | Pork, fresh, belly, raw | 518.0 |  |
| bacon | 168277 | SR Legacy | Pork, cured, bacon, unprepared | 393.0 |  |
| bacon-cooked | 168322 | SR Legacy | Pork, cured, bacon, pre-sliced, cooked, pan-fried | 468.0 |  |
| ham | 173864 | SR Legacy | Ham, sliced, regular (approximately 11% fat) | 164.0 |  |
| prosciutto | 167875 | SR Legacy | Pork, cured, ham, whole, separable lean and fat, unheated | 246.0 |  |
| italian-sausage | 171631 | SR Legacy | Sausage, Italian, pork, mild, raw | 290.0 |  |
| breakfast-sausage | 172934 | SR Legacy | Pork sausage, link/patty, unprepared | 288.0 |  |
| chorizo | 173859 | SR Legacy | Sausage, pork, chorizo, link or ground, raw | 296.0 |  |
| pepperoni | 174575 | SR Legacy | Pepperoni, beef and pork, sliced | 504.0 |  |
| salami | 172938 | SR Legacy | Salami, dry or hard, pork | 407.0 | sugars_g |
| hot-dog | 173862 | SR Legacy | Frankfurter, beef, unheated | 315.0 |  |
| lamb-ground | 174370 | SR Legacy | Lamb, ground, raw | 282.0 |  |
| lamb-leg | 174311 | SR Legacy | Lamb, leg, whole (shank and sirloin), separable lean and fat, trimmed to 1/4" fat, choice, raw | 230.0 | sugars_g |
| bison | 174421 | SR Legacy | Game meat , bison, ground, raw | 223.0 |  |
| salmon | 175167 | SR Legacy | Fish, salmon, Atlantic, farmed, raw | 208.0 |  |
| salmon-sockeye | 173691 | SR Legacy | Fish, salmon, sockeye, raw | 131.0 |  |
| smoked-salmon | 173687 | SR Legacy | Fish, salmon, chinook, smoked | 117.0 |  |
| cod | 171955 | SR Legacy | Fish, cod, Atlantic, raw | 82.0 |  |
| tilapia | 175176 | SR Legacy | Fish, tilapia, raw | 96.0 |  |
| halibut | 174200 | SR Legacy | Fish, halibut, Atlantic and Pacific, raw | 91.0 |  |
| tuna-canned | 173709 | SR Legacy | Fish, tuna, light, canned in water, drained solids (Includes foods for USDA's Food Distribution Program) | 86.0 |  |
| tuna-fresh | 175159 | SR Legacy | Fish, tuna, fresh, yellowfin, raw | 109.0 |  |
| shrimp | 175179 | SR Legacy | Crustaceans, shrimp, raw | 85.0 | fiber_g, sugars_g |
| scallops | 174220 | SR Legacy | Mollusks, scallop, mixed species, raw | 69.0 |  |
| crab | 174204 | SR Legacy | Crustaceans, crab, blue, raw | 87.0 | sugars_g |
| lobster | 174208 | SR Legacy | Crustaceans, lobster, northern, raw | 77.0 |  |
| mussels | 174216 | SR Legacy | Mollusks, mussel, blue, raw | 86.0 |  |
| clams | 174214 | SR Legacy | Mollusks, clam, mixed species, raw | 86.0 |  |
| squid | 174223 | SR Legacy | Mollusks, squid, mixed species, raw | 92.0 |  |
| anchovies | 174183 | SR Legacy | Fish, anchovy, european, canned in oil, drained solids | 210.0 |  |
| sardines | 175139 | SR Legacy | Fish, sardine, Atlantic, canned in oil, drained solids with bone | 208.0 |  |
| catfish | 175165 | SR Legacy | Fish, catfish, channel, farmed, raw | 119.0 |  |
| trout | 173717 | SR Legacy | Fish, trout, rainbow, farmed, raw | 141.0 |  |
| pollock | 175129 | SR Legacy | Fish, pollock, Atlantic, raw | 92.0 |  |
| haddock | 171964 | SR Legacy | Fish, haddock, raw | 74.0 |  |
| swordfish | 173703 | SR Legacy | Fish, swordfish, raw | 144.0 |  |
| water | 173647 | SR Legacy | Beverages, water, tap, drinking | 0.0 |  |
| red-wine | 173190 | SR Legacy | Alcoholic beverage, wine, table, red | 85.0 |  |
| white-wine | 174837 | SR Legacy | Alcoholic beverage, wine, table, white | 82.0 |  |
| beer | 168746 | SR Legacy | Alcoholic beverage, beer, regular, all | 43.0 |  |
| coffee | 171890 | SR Legacy | Beverages, coffee, brewed, prepared with tap water | 1.0 |  |
| espresso | 171891 | SR Legacy | Beverages, coffee, brewed, espresso, restaurant-prepared | 9.0 |  |
