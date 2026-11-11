#!/usr/bin/env python3
"""Local-only translation registry. No network or model service is called.

Codex-authored translations live in translations/manual/*.json. A record must
match the original prompt hash; missing translations stay visibly pending.
"""
import hashlib
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]

def sha256(text):
    return hashlib.sha256(text.encode()).hexdigest()

def source_is_chinese(text):
    han = len(re.findall(r'[\u3400-\u9fff]', text))
    latin = len(re.findall(r'[A-Za-z]', text))
    foreign = re.search(r'[\u3040-\u30ff\uac00-\ud7af\u0400-\u04ff]', text)
    return han > 10 and latin < han * .10 and not foreign and not re.search(r'[A-Za-z]{3,}(?:[ ,]+[A-Za-z]{3,}){3,}', text)

def load_translations():
    result = {}
    for path in sorted((ROOT / 'translations/manual').glob('*.json')):
        for entry in json.loads(path.read_text()):
            if entry['id'] in result: raise ValueError('Duplicate translation: ' + entry['id'])
            if not entry.get('prompt_zh') or not re.search(r'[\u3400-\u9fff]', entry['prompt_zh']):
                raise ValueError('Missing Chinese translation: ' + entry['id'])
            result[entry['id']] = entry
    return result

def translation_for(row, translations):
    translated = translations.get(row['id'])
    if translated:
        if translated['source_sha256'] != sha256(row['prompt']):
            raise ValueError('Stale translation: ' + row['id'])
        return translated['prompt_zh'], 'codex-translated', translated.get('title_zh', '')
    if source_is_chinese(row['prompt']): return row['prompt'], 'source-chinese', ''
    return '', 'pending', ''
