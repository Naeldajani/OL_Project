import time
import re
import unicodedata
import requests

UA = "GonesAnalyticsResearchBot/1.0 (personal fan project; contact: dajaninael@gmail.com)"
S = requests.Session()
S.headers.update({"User-Agent": UA})


def slugify(name: str) -> str:
    n = unicodedata.normalize("NFD", name)
    n = "".join(c for c in n if unicodedata.category(c) != "Mn")
    n = re.sub(r"[^a-zA-Z0-9]+", "-", n).strip("-").lower()
    return n


def get(url, **kw):
    for attempt in range(3):
        try:
            r = S.get(url, timeout=20, **kw)
            if r.status_code == 200:
                return r
            if r.status_code == 429:
                time.sleep(5 * (attempt + 1))
                continue
            return r
        except requests.RequestException:
            time.sleep(2 * (attempt + 1))
    return None


def wikipedia_pageimage(title, lang="fr"):
    """Return (image_url, page_title) of the lead image for a Wikipedia page via search+pageimages."""
    api = f"https://{lang}.wikipedia.org/w/api.php"
    r = get(api, params={
        "action": "query", "format": "json", "generator": "search",
        "gsrsearch": title, "gsrlimit": 1,
        "prop": "pageimages", "piprop": "original",
    })
    if not r:
        return None, None
    js = r.json()
    pages = js.get("query", {}).get("pages", {})
    for _, page in pages.items():
        orig = page.get("original")
        if orig:
            return orig["source"], page.get("title")
        return None, page.get("title")
    return None, None


def resolve_redirect(url):
    """Follow redirects (e.g. Special:FilePath) to get the canonical
    upload.wikimedia.org URL, without downloading the (rate-limited) body."""
    try:
        r = S.head(url, timeout=15, allow_redirects=True, stream=True)
        r.close()
        return r.url
    except requests.RequestException:
        return url


def proxied(url, as_png=False):
    """Route Wikimedia Commons image fetches through images.weserv.nl:
    upload.wikimedia.org / commons.wikimedia.org FilePath is rate-limited (429)
    for this shared egress IP. weserv also rasterizes SVG -> PNG on the fly."""
    if "wikimedia.org" in url:
        if "Special:FilePath" in url or "Special:Redirect" in url:
            url = resolve_redirect(url)
        bare = url.split("://", 1)[1].split("?")[0]
        proxied_url = "https://images.weserv.nl/?url=" + bare
        if as_png:
            proxied_url += "&output=png"
        return proxied_url
    return url


def download(url, path, as_png=False):
    r = get(proxied(url, as_png=as_png))
    if not r or not r.content or len(r.content) < 200:
        return False
    with open(path, "wb") as f:
        f.write(r.content)
    return True


def wikidata_sparql(query):
    r = get("https://query.wikidata.org/sparql", params={"query": query, "format": "json"})
    if not r:
        return []
    return r.json()["results"]["bindings"]


def wikidata_team_members(team_qid):
    """People with 'member of sports team' (P54) = team_qid. Returns {name: image_url}."""
    query = f"""
    SELECT ?personLabel ?image WHERE {{
      ?person wdt:P54 wd:{team_qid} .
      OPTIONAL {{ ?person wdt:P18 ?image }}
      SERVICE wikibase:label {{ bd:serviceParam wikibase:language "fr,en". }}
    }}
    """
    rows = wikidata_sparql(query)
    out = {}
    for row in rows:
        name = row["personLabel"]["value"]
        img = row.get("image", {}).get("value")
        if img and name not in out:
            out[name] = img
    return out
