import raw from '../data/news.json'

export type NewsItem = {
  id: string
  title: string
  summary: string
  url: string
  source: string
  author: string | null
  image: string
  topic: string
  publishedAt: string | null
}

type NewsFile = {
  updatedAt: string
  sources: string[]
  items: NewsItem[]
}

const file = raw as NewsFile

export const news: NewsItem[] = file.items
export const newsSources: string[] = file.sources
export const newsUpdatedAt: string = file.updatedAt

/** Rubriques présentes dans le flux, la plus fournie en premier. */
export function topics(items: NewsItem[]): { name: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const item of items) counts.set(item.topic, (counts.get(item.topic) ?? 0) + 1)
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
}

const TOPIC_STYLE: Record<string, { icon: string; tone: 'red' | 'gold' | 'green' | 'neutral' }> = {
  Mercato: { icon: '🔁', tone: 'gold' },
  Match: { icon: '⚽', tone: 'red' },
  Effectif: { icon: '🩺', tone: 'neutral' },
  Club: { icon: '🏟️', tone: 'neutral' },
  Féminines: { icon: '🦊', tone: 'green' },
  Actu: { icon: '📰', tone: 'neutral' },
}

export function topicStyle(topic: string) {
  return TOPIC_STYLE[topic] ?? TOPIC_STYLE.Actu
}

/** « il y a 2 h », « hier », « 3 août » — la date brute est peu lisible dans un fil. */
export function relativeTime(iso: string | null): string {
  if (!iso) return ''
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const minutes = Math.round((Date.now() - then) / 60000)
  if (minutes < 2) return "à l'instant"
  if (minutes < 60) return `il y a ${minutes} min`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `il y a ${hours} h`
  const days = Math.round(hours / 24)
  if (days === 1) return 'hier'
  if (days < 7) return `il y a ${days} jours`
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
}

/** Nom de domaine de la source, affiché sous le résumé pour que la
 * provenance reste visible même quand le lien n'est pas cliqué. */
export function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}
