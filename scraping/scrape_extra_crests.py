#!/usr/bin/env python3
import sys
sys.path.insert(0, 'scraping')
from common import wikipedia_pageimage, download
import json, time, re

TARGETS = {
    'Arsenal': 'Arsenal Football Club', 'SC Bastia': 'Sporting Club de Bastia',
    'Stade de Reims': 'Stade de Reims', 'Stade Brestois': 'Stade brestois 29',
    'Werder Brême': 'Werder Brême', 'Tottenham': 'Tottenham Hotspur Football Club',
    'West Ham Utd.': 'West Ham United Football Club', 'PSV': 'PSV Eindhoven',
    'FC Utrecht': 'FC Utrecht', 'AS Nancy': 'AS Nancy Lorraine',
    'Grasshoppers': 'Grasshopper Club Zurich', 'Go Ahead Eagles': 'Go Ahead Eagles',
    'Dynamo Kyiv': 'FK Dynamo Kiev', 'AZ Alkmaar': 'AZ Alkmaar',
    'Celtic Glasgow': 'Celtic Football Club', 'Club Bruges': 'Club Bruges KV',
    'Heerenveen': 'SC Heerenveen', 'BSC Young Boys': 'BSC Young Boys',
    'Bröndby IF': 'Brøndby IF', 'Rosenborg BK': 'Rosenborg BK',
    'Ludogorets': 'PFC Ludogorets Razgrad', 'Slovan Liberec': 'FC Slovan Liberec',
    'Qarabağ': 'Qarabağ FK', 'Shakhtar D.': 'Chakhtar Donetsk',
    'Red Star FC': 'Étoile rouge de Belgrade', 'PAOK Saloniki': 'PAOK Salonique',
    'Denizlispor': 'Denizlispor', 'Amiens SC': 'Amiens SC',
    'AC Arles-Avignon': 'AC Arles-Avignon', 'CS Sedan': 'CS Sedan Ardennes',
    'Grenoble': 'Grenoble Foot 38', 'APOEL Nikosia': 'APOEL Nicosie',
    'Astra Giurgiu': 'Astra Giurgiu', 'Debrecen': 'Debreceni VSC',
    'Chornomorets': 'Tchornomorets Odessa', 'Hapoel Tel Aviv': 'Hapoel Tel-Aviv FC',
    'Kiryat Shmona': 'Ironi Kiryat Shmona FC', 'Mlada Boleslav': 'FK Mladá Boleslav',
    'Viktoria Plzen': 'FC Viktoria Plzeň', 'Inter Bratislava': 'Inter Bratislava',
    'M. Tel Aviv': 'Maccabi Tel-Aviv Football Club', 'HNK Rijeka': 'HNK Rijeka',
}

MANIFEST_PATH = 'src/data/crest-manifest.ts'


def load():
    text = open(MANIFEST_PATH).read()
    return json.loads(text.split('=', 1)[1].strip())


def save(crests):
    with open(MANIFEST_PATH, 'w') as f:
        f.write('// Auto-generated: clubs_logos.csv + alias map + extra pass\n')
        f.write('export const CREST_MANIFEST: Record<string, string> = ')
        f.write(json.dumps(crests, ensure_ascii=False, indent=2))
        f.write('\n')


def main():
    crests = load()
    found = 0
    for opp, query in TARGETS.items():
        if opp in crests:
            continue
        img, title = wikipedia_pageimage(query, 'fr')
        if img:
            slug = re.sub(r'[^a-z0-9]+', '-', opp.lower()).strip('-')
            path = f'/images/clubs/extra-{slug}.png'
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
