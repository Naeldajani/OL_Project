import { seedSeasons } from './seed-seasons'

export interface Coach {
  id: string
  name: string
  seasons: string[]
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

const byName = new Map<string, Coach>()
for (const s of seedSeasons) {
  if (!s.manager) continue
  // A season note can list more than one manager separated by " then "/" puis ".
  const names = s.manager.split(/,| then | puis /i).map((n) => n.trim()).filter(Boolean)
  for (const name of names) {
    const id = slugify(name)
    if (!byName.has(id)) byName.set(id, { id, name, seasons: [] })
    byName.get(id)!.seasons.push(s.season)
  }
}

export const coaches: Coach[] = [...byName.values()].sort((a, b) => a.name.localeCompare(b.name))
