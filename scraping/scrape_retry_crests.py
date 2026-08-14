#!/usr/bin/env python3
import sys
sys.path.insert(0, 'scraping')
from common import wikipedia_pageimage, download
import json, re, time

RETRY = {
    'Arsenal': 'Arsenal Football Club', 'SC Bastia': 'Sporting Club de Bastia',
    'Stade de Reims': 'Stade de Reims', 'Stade Brestois': 'Stade brestois 29',
    'Werder Brême': 'Werder Brême', 'Tottenham': 'Tottenham Hotspur Football Club',
    'West Ham Utd.': 'West Ham United Football Club', 'PSV': 'PSV Eindhoven',
    'Grasshoppers': 'Grasshopper Club Zurich', 'Go Ahead Eagles': 'Go Ahead Eagles',
    'Dynamo Kyiv': 'FK Dynamo Kiev', 'AZ Alkmaar': 'AZ Alkmaar',
    'Heerenveen': 'SC Heerenveen', 'BSC Young Boys': 'BSC Young Boys',
    'Bröndby IF': 'Broendby IF', 'Rosenborg BK': 'Rosenborg Ballklub',
}

MANIFEST_PATH = 'src/data/crest-manifest.ts'


def load():
    text = open(MANIFEST_PATH).read()
    return json.loads(text.split('=', 1)[1].strip())


def save(crests):
    with open(MANIFEST_PATH, 'w') as f:
        f.write('// Auto-generated: clubs_logos.csv + alias map + extra passes\n')
        f.write('export const CREST_MANIFEST: Record<string, string> = ')
        f.write(json.dumps(crests, ensure_ascii=False, indent=2))
        f.write('\n')


def main():
    crests = load()
    crests['Stade de Reims'] = '/images/clubs/extra2-stade-de-reims.png'
    save(crests)
    found = 0
    for opp, query in RETRY.items():
        if opp in crests:
            continue
        img, title = wikipedia_pageimage(query, 'fr')
        if img:
            slug = re.sub(r'[^a-z0-9]+', '-', opp.lower()).strip('-')
            path = f'/images/clubs/extra2-{slug}.png'
            if download(img, 'public' + path, as_png=True):
                crests[opp] = path
                found += 1
                print('OK', opp, '->', title, flush=True)
                save(crests)
                time.sleep(0.3)
                continue
        print('MISS', opp, flush=True)
        time.sleep(0.3)
    print('done, found', found, 'total', len(crests))


if __name__ == '__main__':
    main()
