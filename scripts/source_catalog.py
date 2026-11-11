"""Declared local CSV inputs, including separately preserved weekly additions."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def source_catalog():
    sources = json.loads((ROOT / 'inputs/sources.json').read_text())
    files = set()
    for source in sources:
        name = source['file']
        if Path(name).name != name or not name.endswith('.csv'):
            raise ValueError('Invalid local CSV filename: ' + name)
        if name in files:
            raise ValueError('Duplicate input: ' + name)
        if source['family'] not in ['Seedance', 'Wan3']:
            raise ValueError('Unknown model family: ' + source['family'])
        if not (ROOT / 'inputs' / name).is_file():
            raise ValueError('Missing declared input: ' + name)
        files.add(name)
    undeclared = {p.name for p in (ROOT / 'inputs').glob('*.csv')} - files
    if undeclared:
        raise ValueError('CSV inputs missing from sources.json: ' + ', '.join(sorted(undeclared)))
    return sources
