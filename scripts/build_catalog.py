#!/usr/bin/env python3
"""Compile the two checked-in CSV snapshots; no network or external packages."""
import csv
import hashlib
import json
import re
from collections import Counter, defaultdict
from pathlib import Path
from translation_store import load_translations, translation_for

ROOT = Path(__file__).resolve().parents[1]

# One axis: what the scene is about. Other dimensions stay in facets.
TOPICS = {
    '人物与角色': ('以人物身份、表演和日常生活为主体。', {
        '儿童萌娃': ('宝宝、儿童的日常、游戏与亲情。', r'\b(baby|babies|toddler|child|children|kid|kids)\b|宝宝|萌娃|儿童|小孩'),
        '女性人物': ('女性肖像、生活记录与表演。', r'\b(woman|women|girl|girls|female|lady)\b|女性|女子|女孩'),
        '男性人物': ('男性肖像、生活记录与表演。', r'\b(man|men|boy|boys|male)\b|男性|男子|男孩'),
        '职业角色': ('以职业、身份或工作过程为主题。', r'\b(doctor|chef|firefighter|police|teacher|engineer|astronaut|business|professional)\b|医生|厨师|职业'),
        '群像与表演': ('多人表演、音乐舞蹈和人群。', r'\b(dance|dancing|singer|concert|band|crowd|music video|performance)\b|舞蹈|演唱|群像'),
    }),
    '剧情与动作': ('人物发生冲突、追逐、相遇或情节变化。', {
        '动作对决': ('打斗、武术、战斗与对抗。', r'\b(fight|battle|duel|combat|warrior|sword|gun|shooting)\b|打斗|对决|战斗'),
        '追逐逃亡': ('追赶、逃跑、追车与救援。', r'\b(chase|chasing|escape|pursuit|rescue)\b|追逐|逃亡|追车'),
        '悬疑恐怖': ('悬念、恐惧和危险的逐步揭示。', r'\b(horror|suspense|haunted|ghost|terrifying|creepy)\b|悬疑|恐怖|惊悚'),
        '情感故事': ('亲情、友情、爱情、重逢与离别。', r'\b(reunion|romance|romantic|emotional|farewell|hug|family)\b|亲情|重逢|离别|拥抱'),
        '喜剧反转': ('误会、笑点、恶作剧与反转。', r'\b(comedy|funny|prank|revenge|twist|humor)\b|搞笑|喜剧|反转'),
    }),
    '产品与广告': ('商品、品牌、使用体验或广告表达。', {
        '美妆护肤': ('护肤、彩妆、香水与美容产品。', r'\b(skincare|serum|makeup|cosmetic|lipstick|perfume)\b|护肤|美妆|香水'),
        '食品饮料': ('食物、饮品、烹饪与餐饮展示。', r'\b(food|coffee|drink|beverage|burger|pizza|cooking|recipe|chocolate)\b|美食|饮料|烹饪|咖啡'),
        '数码家电': ('电子设备、汽车、家电与工业产品。', r'\b(product|phone|smartphone|headphone|gadget|car commercial|automotive)\b|数码|家电|手机|产品'),
        '服饰穿搭': ('服装、鞋履、首饰与时尚展示。', r'\b(fashion|sneaker|jewelry|handbag|outfit|clothing|runway)\b|穿搭|服饰|时装'),
        '电商带货': ('UGC 广告、开箱、演示和销售口播。', r'\b(ugc|unboxing|advertisement|marketing|testimonial|commercial|ad)\b|带货|广告|开箱'),
    }),
    '动物与奇幻生物': ('真实动物或虚构生物是主体。', {
        '宠物': ('猫狗及陪伴动物的行为与故事。', r'\b(cat|cats|kitten|dog|dogs|puppy|pet)\b|猫|狗|宠物'),
        '野生动物': ('野外动物、生态与自然行为。', r'\b(lion|tiger|elephant|deer|wolf|bear|wildlife|monkey)\b|狮子|老虎|野生动物'),
        '飞鸟水族': ('鸟类、鱼类与水中生物。', r'\b(bird|eagle|owl|fish|whale|dolphin|shark|penguin)\b|鸟|鲸|海豚|鱼'),
        '奇幻生物': ('龙、怪兽、精灵及虚构生命。', r'\b(dragon|monster|creature|fairy|demon|alien)\b|龙|怪兽|精灵'),
    }),
    '场景与风光': ('环境、建筑或空间变化是主体。', {
        '自然风光': ('森林、山海、洞穴与自然地貌。', r'\b(forest|mountain|ocean|waterfall|landscape|desert|cave|tree hollow)\b|森林|山川|海洋|树洞|自然风光'),
        '室内空间': ('居住空间、餐厅与室内环境。', r'\b(interior|living room|kitchen|bedroom|restaurant|diner)\b|室内|厨房|客厅|餐厅'),
        '城市建筑': ('城市街道、建筑设计和交通空间。', r'\b(city|street|architecture|building|urban|subway|skyline)\b|城市|建筑|街道|地铁'),
        '未来科幻': ('太空、未来城市和科幻环境。', r'\b(space|spaceship|cyberpunk|futuristic|sci-fi|mars|planet)\b|太空|科幻|赛博|未来'),
        '旅行纪实': ('旅途、地域文化与日常纪实。', r'\b(travel|journey|documentary|vlog|tour|vacation)\b|旅行|纪实|旅游'),
    }),
    '特效与转场': ('画面变化或视觉效果本身是主题。', {
        '变形特效': ('形态变化、变身、融化与碎裂。', r'\b(transform|transformation|morph|melting|shatter|metamorphosis)\b|变形|变身|融化|碎裂'),
        '转场衔接': ('不同场景之间的可见转场。', r'\b(transition|match cut|seamless cut|portal)\b|转场|衔接'),
        '时间变化': ('倒放、冻结、延时与时间跳跃。', r'\b(time.?lapse|rewind|reverse time|frozen time|time freeze|bullet time)\b|倒放|时间冻结|延时'),
        '超现实': ('梦境、不可能空间和反常物理。', r'\b(surreal|dreamlike|impossible|levitating|defy gravity)\b|超现实|梦境|反重力'),
    }),
    '实验与抽象': ('概念、抽象形式、教学演示与技术实验。', {
        '抽象艺术': ('几何、色彩、图形和抽象视觉。', r'\b(abstract|geometric|geometry|fractal|particle|kaleidoscope)\b|抽象|几何|粒子'),
        '循环动画': ('可以重复播放的连续循环。', r'\b(loop|looping|repeatable|seamless loop)\b|循环'),
        '科学演示': ('物理、生物、科学或教学可视化。', r'\b(science|educational|molecule|anatomy|physics|diagram|explainer)\b|科学|教学|分子'),
        '媒介实验': ('绘画、微缩、定格及媒介转换。', r'\b(stop.motion|claymation|miniature|paper cut|watercolor|ink painting)\b|定格|微缩|水墨|剪纸'),
    }),
    '其他': ('题材尚不明确的参考；保留原文供人工判断。', {
        '待定题材': ('当前规则不足以判断主体题材。', r'(?!)'),
        '参考驱动': ('主要描述参考图或一致性要求。', r'\b(reference image|reference-driven|identity consistency)\b|参考图|一致性'),
        '制作约束': ('主要规定生成过程或技术限制。', r'\b(production control|negative prompt|no subtitles|aspect ratio)\b|制作控制|负向提示'),
        '综合案例': ('多个主题权重接近的综合场景。', r'\b(montage|multi.scene|multiple scenes)\b|综合|蒙太奇'),
    }),
}

FACETS = {
    '视角': {
        '微距/微观': r'\b(macro|microscopic|extreme close.up)\b|微距|微观',
        '俯视': r'\b(overhead|top.down|bird.s.eye|aerial)\b|俯视|鸟瞰',
        '仰视': r'\b(low.angle|worm.s.eye)\b|仰视',
        '主观/POV': r'\b(pov|first.person|subjective)\b|主观视角',
        '窥视/树洞': r'\b(tree hollow|inside.*(?:hole|cave)|through.*(?:hole|keyhole))\b|树洞|窥视|洞内向外',
        '平视': r'\b(eye.level|straight.on)\b|平视',
    },
    '镜头运动': {
        '推拉': r'\b(dolly|zoom|push.in|pull.back)\b|推镜|拉镜',
        '环绕': r'\b(orbit|360.degree|circling)\b|环绕',
        '跟随': r'\b(tracking|follow shot|follow.*camera)\b|跟拍',
        '摇移': r'\b(pan|panning|tilt|crane)\b|摇镜|移镜',
        '手持': r'\b(handheld|hand.held)\b|手持',
        '固定': r'\b(static|locked.off|tripod)\b|固定镜头',
    },
    '风格': {
        '写实': r'\b(realistic|photoreal|live.action|realism)\b|写实|真实',
        '电影感': r'\b(cinematic|film grain|anamorphic)\b|电影感|电影级',
        '动画': r'\b(anime|animation|cartoon|animated|3d)\b|动画|卡通',
        '复古': r'\b(retro|vintage|1950|1980|1990)\b|复古',
        '广告': r'\b(commercial|advertisement|ugc)\b|广告',
        '纪实': r'\b(documentary|vlog|home.video)\b|纪实|纪录',
    },
}


def dump(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')


def classify(row):
    title = ' '.join(row.get(k, '') for k in ['title_en', 'title_zh', 'category'])
    prompt = row['prompt']
    scored = []
    for l1, (_, leaves) in TOPICS.items():
        for l2, (_, pattern) in leaves.items():
            score = len(re.findall(pattern, title, re.I)) * 12
            score += min(8, len(re.findall(pattern, prompt[:1500], re.I)))
            if l1 == '其他': score *= .25
            scored.append((score, l1, l2))
    score, l1, l2 = max(scored, key=lambda x: x[0])
    return (l1, l2) if score else ('其他', '待定题材')


def main():
    rows, exclusions, inputs, input_counts = [], [], {}, {}
    translations = load_translations()
    titles = json.loads((ROOT / 'translations/titles.json').read_text())
    from source_catalog import source_catalog
    sources = source_catalog()
    for source in sources:
        file, family = source['file'], source['family']
        path = ROOT / 'inputs' / file
        inputs[file] = hashlib.sha256(path.read_bytes()).hexdigest()
        with path.open(encoding='utf-8-sig', newline='') as stream:
            for line, row in enumerate(csv.DictReader(stream), 2):
                input_counts[file] = input_counts.get(file, 0) + 1
                if not row['prompt'].strip(): raise ValueError(f'Empty prompt at {file}:{line}')
                model = ('Seedance 2.5' if re.search(r'seedance\s*2\.5', row['model'], re.I) else
                         'Seedance 2.0' if re.search(r'seedance\s*2\.0', row['model'], re.I) else
                         'Seedance（未标版本）') if family == 'Seedance' else 'Wan 3.0'
                prompt_zh, translation_status, translated_title = translation_for(row, translations)
                l1, l2 = classify(row)
                facets = {dim: [name for name, pattern in values.items() if re.search(pattern, row['prompt'], re.I)] for dim, values in FACETS.items()}
                existing_zh = re.search(r'[（(]([^()（）]*[\u3400-\u9fff][^()（）]*)[)）]', row['title_en'])
                title = translated_title or titles.get(row['id']) or row['title_zh'] or (existing_zh[1] if existing_zh else '') or row['title_en'] or row['id']
                summary = title + '。' + ('镜头参考：' + '、'.join(facets['镜头运动']) + '。' if facets['镜头运动'] else '')
                date = re.search(r'\d{4}-\d{2}-\d{2}', row['posted'])
                rows.append({
                    'id': row['id'], 'model': model, 'model_family': family, 'source_model': row['model'],
                    'media_type': 'image' if row['category'] == 'image' else 'video', 'l1': l1, 'l2': l2,
                    'title': title, 'title_en': row['title_en'], 'summary': summary,
                    'summary_kind': 'source-title-and-camera-tags', 'prompt': row['prompt'], 'prompt_zh': prompt_zh,
                    'translation_status': translation_status,
                    'source_note': translations.get(row['id'], {}).get('source_note', '') or (json.loads(row['params']).get('source_note', '') if source.get('kind') == 'weekly-browser-selection' else ''),
                    'facets': facets, 'date': date[0] if date else '', 'author': row['credit'],
                    'source_url': row['source_url'], 'source': row['source_name'], 'likes': row['likes'],
                    'source_file': file, 'source_row': line,
                    'prompt_sha256': hashlib.sha256(row['prompt'].encode()).hexdigest(),
                    **({k: source[k] for k in ['license', 'license_url', 'upstream_repository']} if source.get('license') else {}),
                })
    assert len({r['id'] for r in rows}) == len(rows), 'Duplicate IDs require explicit source disambiguation'
    rows.sort(key=lambda r: r['id'])
    tree = {l1: {l2: [] for l2 in leaves} for l1, (_, leaves) in TOPICS.items()}
    visual = {dim: {name: [] for name in values} for dim, values in FACETS.items()}
    by_model, by_date, by_family = defaultdict(list), defaultdict(list), defaultdict(list)
    for row in rows:
        tree[row['l1']][row['l2']].append(row['id'])
        by_model[row['model']].append(row['id'])
        by_family[row['model_family']].append(row['id'])
        by_date[row['date']].append(row['id'])
        for dim, values in row['facets'].items():
            for value in values: visual[dim][value].append(row['id'])
    (ROOT / 'data/entries.jsonl').write_text(''.join(json.dumps(r, ensure_ascii=False) + '\n' for r in rows))
    dump(ROOT / 'catalog/tree.json', {'count': len(rows), 'tree': tree})
    dump(ROOT / 'catalog/descriptions.json', {l1: {'desc': desc, 'children': {l2: info[0] for l2, info in leaves.items()}} for l1, (desc, leaves) in TOPICS.items()})
    dump(ROOT / 'catalog/facets.json', {'visual': visual, 'by_model': by_model, 'by_family': by_family, 'by_date': by_date})
    metadata = {'count': len(rows), 'models': dict(Counter(r['model'] for r in rows)), 'inputs': inputs, 'exclusions': exclusions,
                'input_counts': input_counts, 'families': dict(Counter(r['model_family'] for r in rows)),
                'media': dict(Counter(r['media_type'] for r in rows)), 'classification': 'deterministic-topic-rules',
                'translation': dict(Counter(r['translation_status'] for r in rows)), 'datasets': sources}
    if all(s.get('license') for s in sources):
        metadata['distribution'] = 'licensed-public'
    dump(ROOT / 'catalog/build.json', metadata)
    root_lines = ['# 视频提示词库', '', f'共 {len(rows)} 条。先选题材，再选细分，最后读 3–5 条原文。', '']
    lookup = {r['id']: r for r in rows}
    for l1, leaves in tree.items():
        lines = [f'# {l1}', '', TOPICS[l1][0], '']
        root_lines.append(f'- [{l1}]({l1}.md)：{sum(map(len, leaves.values()))} 条。{TOPICS[l1][0]}')
        for l2, ids in leaves.items():
            lines += [f'## {l2}（{len(ids)} 条）', '', TOPICS[l1][1][l2][0], '']
            for id in ids:
                r = lookup[id]
                lines.append(f'- `{id}`：{r["title"]} · {r["model"]} · {r["date"] or "未标日期"}')
            lines.append('')
        (ROOT / 'wiki' / f'{l1}.md').write_text('\n'.join(lines) + '\n')
    (ROOT / 'wiki/README.md').write_text('\n'.join(root_lines) + '\n')
    print(json.dumps(metadata, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
