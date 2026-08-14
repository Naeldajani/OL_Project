import { CREDITS, type Credit } from '../../data/credits-manifest'

/** Les orthographes divergent entre compositions et fiches joueurs
 *  (« Duje Caleta-Car » / « Duje Ćaleta-Car ») : sans index insensible aux
 *  accents, un crédit obligatoire passerait à la trappe. */
const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()

const BY_NORM: Record<string, Credit> = {}
for (const [name, credit] of Object.entries(CREDITS)) {
  BY_NORM[normalize(name)] = credit
}

export function creditFor(name: string): Credit | undefined {
  return CREDITS[name] ?? BY_NORM[normalize(name)]
}

/** Ligne d'attribution courte, telle que l'exigent CC BY et CC BY-SA. */
export function creditLine(name: string): string | undefined {
  const c = creditFor(name)
  if (!c) return undefined
  return c.author ? `© ${c.author} — ${c.licence}` : c.licence
}

export const allCredits = Object.entries(CREDITS)
  .map(([name, credit]) => ({ name, ...credit }))
  .sort((a, b) => a.name.localeCompare(b.name, 'fr'))

/** Récapitulatif par licence, pour la page mentions légales. */
export function creditsByLicence(): { licence: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const c of allCredits) counts.set(c.licence, (counts.get(c.licence) ?? 0) + 1)
  return [...counts.entries()]
    .map(([licence, count]) => ({ licence, count }))
    .sort((a, b) => b.count - a.count)
}
