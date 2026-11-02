"""Build data/foods.json from the USDA FoodData Central SR Legacy and Foundation CSV downloads.
usage: python3 -I build_data.py <ingredients.txt> <sr_dir> <foundation_dir> <out.json>

Streams the CSV files row by row and keeps only the selected foods and nutrients.
Primary row: the Foundation food when one is listed and it carries all eight nutrients,
otherwise the SR Legacy food. Household portions (cup, tbsp, each, slice) come from the
SR Legacy food_portion.csv of the SR match, then from the Foundation food.
"""
import csv, json, re, sys

ing_path, sr_dir, fd_dir, out_path = sys.argv[1:5]
SR_URL = 'https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_csv_2018-04.zip'
FD_URL = 'https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_foundation_food_csv_2026-04-30.zip'
FETCHED = '2026-11-02'
# nutrient ids (nutrient.csv): energy kcal 1008, Atwater specific 2048, Atwater general 2047,
# protein 1003, fat 1004, sat fat 1258, carbohydrate by difference 1005, fiber 1079,
# sugars total 2000 / total NLEA 1063, sodium 1093
WANT = {'1008', '2047', '2048', '1003', '1004', '1258', '1005', '1079', '2000', '1063', '1093'}

entries = []
for line in open(ing_path, encoding='utf8'):
    line = line.rstrip('\n')
    if not line or line.startswith('#'):
        continue
    f = line.split('|')
    sr_rx = f[3]
    proxy = sr_rx.startswith('~')
    entries.append({'id': f[0], 'name': f[1], 'aliases': [a.strip() for a in f[2].split(',') if a.strip()],
                    'sr_rx': sr_rx.lstrip('~'), 'sr_portion_only': proxy, 'fd_desc': f[4].strip() if len(f) > 4 else ''})

def foods(d, only=None):
    out = []
    for r in csv.DictReader(open(d + '/food.csv', encoding='utf8')):
        if only is None or r['fdc_id'] in only:
            out.append((r['fdc_id'], r['description']))
    return out

sr_foods = foods(sr_dir)
fd_ids = {r['fdc_id'] for r in csv.DictReader(open(fd_dir + '/foundation_food.csv', encoding='utf8'))}
fd_foods = foods(fd_dir, fd_ids)
fd_by_desc = {}
for i, dsc in fd_foods:
    fd_by_desc.setdefault(dsc.strip(), i)

problems = []
FDP = re.compile(r" \(Includes foods for USDA's Food Distribution Program\)$")
for e in entries:
    rx = re.compile(e['sr_rx'])
    m = [(len(FDP.sub('', dsc)), i, dsc) for i, dsc in sr_foods if rx.match(FDP.sub('', dsc))]
    if not m:
        problems.append(f"SR miss {e['id']}: {e['sr_rx']}")
        e['sr'] = None
    else:
        m.sort()
        e['sr'] = (m[0][1], m[0][2])
    if e['fd_desc']:
        fid = fd_by_desc.get(e['fd_desc'])
        if not fid:
            problems.append(f"FD miss {e['id']}: {e['fd_desc']}")
        e['fd'] = (fid, e['fd_desc']) if fid else None
    else:
        e['fd'] = None

need = {e['sr'][0] for e in entries if e['sr']} | {e['fd'][0] for e in entries if e['fd']}

def nutrients(d):
    vals = {}
    with open(d + '/food_nutrient.csv', encoding='utf8') as fh:
        for r in csv.DictReader(fh):
            if r['fdc_id'] in need and r['nutrient_id'] in WANT and r['amount'] != '':
                vals.setdefault(r['fdc_id'], {})[r['nutrient_id']] = float(r['amount'])
    return vals

nut = nutrients(sr_dir)
nut.update(nutrients(fd_dir))

def portions(d):
    units = {r['id']: r['name'] for r in csv.DictReader(open(d + '/measure_unit.csv', encoding='utf8'))}
    out = {}
    with open(d + '/food_portion.csv', encoding='utf8') as fh:
        for r in csv.DictReader(fh):
            if r['fdc_id'] not in need:
                continue
            unit = units.get(r['measure_unit_id'], '')
            unit = '' if unit == 'undetermined' else unit
            label = ' '.join(x for x in [r['amount'], unit, r['modifier'], r['portion_description']] if x).strip()
            try:
                amt = float(r['amount'] or 1)
                g = float(r['gram_weight'])
            except ValueError:
                continue
            if g <= 0 or amt <= 0:
                continue
            out.setdefault(r['fdc_id'], []).append({'label': re.sub(r'\s+', ' ', label), 'amount': amt, 'unit': unit, 'modifier': (r['modifier'] or r['portion_description']).strip(), 'g': g, 'fdc': int(r['fdc_id'])})
    return out

por = portions(sr_dir)
for k, v in portions(fd_dir).items():
    por.setdefault('fd:' + k, v)

def profile(fid):
    n = nut.get(fid, {})
    kcal_src = '1008' if '1008' in n else '2048' if '2048' in n else '2047' if '2047' in n else None
    sug = '2000' if '2000' in n else '1063' if '1063' in n else None
    p = {
        'kcal': n.get(kcal_src) if kcal_src else None, 'protein_g': n.get('1003'), 'fat_g': n.get('1004'),
        'sat_fat_g': n.get('1258'), 'carbs_g': n.get('1005'), 'fiber_g': n.get('1079'),
        'sugars_g': n.get(sug) if sug else None, 'sodium_mg': n.get('1093'),
    }
    return p, kcal_src

out = []
for e in entries:
    if not e['sr'] and not e['fd']:
        continue
    pick = None
    if e['fd']:
        p, ks = profile(e['fd'][0])
        if all(v is not None for v in p.values()):
            pick = ('foundation', e['fd'], p, ks)
    if not pick and e['sr'] and not e['sr_portion_only']:
        p, ks = profile(e['sr'][0])
        missing = [k for k, v in p.items() if v is None]
        # SR Legacy reports some foods without fiber or sugars analysed; a few (water, salt, oils) are true zeros
        # but SR leaves them blank. Keep the blanks as null and say so in the result.
        pick = ('sr_legacy', e['sr'], p, ks)
    if not pick:
        problems.append(f"DROP {e['id']}: Foundation row incomplete and SR row is only a portion proxy")
        continue
    src, (fid, dsc), p, ks = pick
    ports = list(por.get(e['sr'][0], [])) if e['sr'] else []
    if e['fd']:
        ports += por.get('fd:' + e['fd'][0], [])
    ports = [{'label': x['label'], 'g': round(x['g'] / x['amount'], 2), 'unit': x['unit'], 'modifier': x['modifier'], 'fdc': x['fdc']} for x in ports]
    seen, uniq = set(), []
    for x in ports:
        key = (x['unit'] or x['modifier'].split(',')[0].split(' ')[0], x['modifier'] if not x['unit'] else x['modifier'].strip())
        if key in seen:
            continue
        seen.add(key)
        uniq.append(x)
    row = {
        'id': e['id'], 'name': e['name'], 'aliases': e['aliases'],
        'dataset': src, 'fdc_id': int(fid), 'description': dsc,
        'energy_nutrient': ks,
        'per_100g': {k: (round(v, 3) if v is not None else None) for k, v in p.items()},
        'portions': [[x['modifier'], x['unit'], x['g'], x['fdc']] for x in uniq[:16]],
        'portion_fdc_ids': sorted({int(x) for x in ([e['sr'][0]] if e['sr'] and por.get(e['sr'][0]) else []) + ([e['fd'][0]] if e['fd'] and por.get('fd:' + e['fd'][0]) else [])}),
    }
    out.append(row)

json.dump({'fetched': FETCHED, 'sr_url': SR_URL, 'fd_url': FD_URL, 'foods': out}, open(out_path, 'w', encoding='utf8'), ensure_ascii=False, indent=0)
print(f'{len(out)} foods ({sum(1 for r in out if r["dataset"] == "foundation")} Foundation, {sum(1 for r in out if r["dataset"] == "sr_legacy")} SR Legacy)')
print('null nutrients:', sum(1 for r in out for v in r['per_100g'].values() if v is None))
for p in problems:
    print(p)
