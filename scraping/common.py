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


def wikipedia_search_titles(query, lang="fr", limit=3):
    """Return up to `limit` candidate page titles for a search query."""
    r = get(f"https://{lang}.wikipedia.org/w/api.php", params={
        "action": "query", "format": "json", "list": "search",
        "srsearch": query, "srlimit": limit,
    })
    if not r:
        return []
    return [x["title"] for x in r.json().get("query", {}).get("search", [])]


def wikipedia_search_title(query, lang="fr"):
    """Return the best-matching page title for a search query (text only, cheap)."""
    titles = wikipedia_search_titles(query, lang, limit=1)
    return titles[0] if titles else None


def wikipedia_crest_image(title, lang="fr"):
    """Fetch a Wikipedia page by exact title and return the URL of the first
    image whose alt text says it's a logo/crest (e.g. alt="Logo du/de X").
    This is far more reliable than 'lead image' for club pages: the lead
    image on an ambiguous/city page is a landmark photo, not a crest, and
    silently produces a wrong-but-plausible-looking result."""
    r = get(f"https://{lang}.wikipedia.org/wiki/{title.replace(' ', '_')}")
    if not r or r.status_code != 200:
        return None, None
    from bs4 import BeautifulSoup
    soup = BeautifulSoup(r.text, "lxml")
    content = soup.select_one("#mw-content-text") or soup
    for img in content.select("img[alt]"):
        alt = img.get("alt", "")
        if re.search(r"^logo\b|^crest\b|^blason\b", alt.strip(), re.IGNORECASE):
            src = img.get("src", "")
            if src.startswith("//"):
                src = "https:" + src
            # strip the thumb-size prefix to get a bigger rendition
            src = re.sub(r"/thumb(/.+?)/[^/]+$", r"\1", src)
            return src, title
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
    for this shared egress IP. weserv also rasterizes SVG -> PNG on the fly.
    Returns (base_url, params) since the target URL must be passed as a
    properly url-encoded query param (it often contains literal '%' escapes
    from accented filenames, which corrupt a hand-built query string)."""
    if "wikimedia.org" in url:
        if "Special:FilePath" in url or "Special:Redirect" in url:
            url = resolve_redirect(url)
        bare = url.split("://", 1)[1].split("?")[0]
        params = {"url": bare, "w": "500", "we": ""}
        if as_png:
            params["output"] = "png"
        return "https://images.weserv.nl/", params
    return url, None


def download(url, path, as_png=False):
    target, params = proxied(url, as_png=as_png)
    for attempt in range(2):
        r = get(target, params=params)
        if r and r.content and len(r.content) >= 200 and r.headers.get("Content-Type", "").startswith("image"):
            with open(path, "wb") as f:
                f.write(r.content)
            return True
        if attempt == 0:
            time.sleep(1.5)
    return False


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
