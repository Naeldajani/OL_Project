import { useMemo, useState } from 'react'
import { Card, Pill, SectionTitle } from '../components/ui'
import { allCredits, creditsByLicence } from '../lib/credits'
import { newsSources } from '../lib/news'

export default function LegalPage() {
  const [query, setQuery] = useState('')
  const licences = useMemo(() => creditsByLicence(), [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return allCredits
    return allCredits.filter(
      (c) => c.name.toLowerCase().includes(q) || c.author.toLowerCase().includes(q),
    )
  }, [query])

  return (
    <div className="flex flex-col gap-5">
      <SectionTitle eyebrow="Mentions légales" title="Sources, droits et données" />

      <Card className="p-4">
        <h3 className="lh-display mb-2 text-lg">Ce qu'est Lugdun'Home</h3>
        <p className="text-sm leading-relaxed text-lh-muted">
          Une plateforme communautaire <strong className="text-lh-text">non officielle</strong>,
          faite par des supporters, sans lien avec l'Olympique Lyonnais, la Ligue de Football
          Professionnel ni aucun ayant droit. Aucune exploitation commerciale.
        </p>
      </Card>

      <Card className="p-4">
        <h3 className="lh-display mb-2 text-lg">Résultats et compositions</h3>
        <p className="text-sm leading-relaxed text-lh-muted">
          Scores, buteurs, dates et compositions sont des{' '}
          <strong className="text-lh-text">faits sportifs</strong> : ils ne sont protégés par aucun
          droit d'auteur et sont librement reproductibles. Ils ont été compilés depuis Wikipédia et
          Wikidata.
        </p>
      </Card>

      <Card className="p-4">
        <h3 className="lh-display mb-2 text-lg">Blasons des clubs</h3>
        <p className="text-sm leading-relaxed text-lh-muted">
          Aucun logo officiel n'est diffusé. Les écussons affichés sont{' '}
          <strong className="text-lh-text">dessinés par l'application</strong> à partir des couleurs
          du club et de ses initiales — ni l'une ni l'autre ne sont protégeables. Un audit a montré
          que 267 des 273 logos disponibles sur Wikipédia étaient des imports sous exception au
          droit d'auteur, donc inutilisables ici.
        </p>
      </Card>

      <Card className="p-4">
        <h3 className="lh-display mb-2 text-lg">Fil Inf'OL</h3>
        <p className="text-sm leading-relaxed text-lh-muted">
          Chaque brève est un résumé court renvoyant vers l'article d'origine, dont le média reste
          seul détenteur. Sources agrégées :
        </p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {newsSources.map((s) => (
            <Pill key={s}>{s}</Pill>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="lh-display mb-2 text-lg">Données personnelles</h3>
        <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm leading-relaxed text-lh-muted">
          <li>
            Un compte stocke uniquement une <strong className="text-lh-text">adresse e-mail</strong>{' '}
            et un <strong className="text-lh-text">pseudo</strong>.
          </li>
          <li>Les notes, votes et pronostics sont conservés pour établir les classements.</li>
          <li>Aucun traceur publicitaire, aucune revente, aucun partage à des tiers.</li>
          <li>
            Suppression du compte et de toutes ses données à la demande, depuis la page Profil.
          </li>
          <li>Sans compte, tout reste sur l'appareil et ne quitte jamais le navigateur.</li>
        </ul>
      </Card>

      <Card className="p-4">
        <h3 className="lh-display mb-1 text-lg">Crédits photo</h3>
        <p className="mb-3 text-sm leading-relaxed text-lh-muted">
          Les {allCredits.length} portraits proviennent de Wikimedia Commons et sont tous sous
          licence libre. Les licences CC BY et CC BY-SA imposent de créditer l'auteur : la liste
          complète est ci-dessous, et chaque portrait porte son attribution en infobulle.
        </p>
        <div className="mb-3 flex flex-wrap gap-2">
          {licences.map((l) => (
            <Pill key={l.licence} tone="gold">
              {l.licence} · {l.count}
            </Pill>
          ))}
        </div>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="🔍 Chercher un joueur ou un auteur"
          className="mb-3 w-full rounded-xl border border-lh-line bg-lh-void px-3.5 py-2.5 text-sm outline-none placeholder:text-lh-muted focus:border-lh-gold/50"
        />

        <div className="lh-rail max-h-96 overflow-y-auto rounded-xl border border-lh-line">
          <table className="w-full text-left text-[12.5px]">
            <thead className="sticky top-0 bg-lh-raised text-[10.5px] uppercase tracking-wider text-lh-muted">
              <tr>
                <th className="px-3 py-2 font-bold">Sujet</th>
                <th className="px-3 py-2 font-bold">Auteur</th>
                <th className="px-3 py-2 font-bold">Licence</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.name} className="border-t border-lh-line/60">
                  <td className="px-3 py-2 font-semibold">
                    <a
                      href={c.page}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-lh-redSoft hover:underline"
                    >
                      {c.name}
                    </a>
                  </td>
                  <td className="px-3 py-2 text-lh-muted">{c.author || '—'}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-lh-muted">{c.licence}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-lh-muted">Aucun résultat.</p>
          )}
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="lh-display mb-2 text-lg">Signaler un contenu</h3>
        <p className="text-sm leading-relaxed text-lh-muted">
          Un ayant droit qui estime qu'un contenu porte atteinte à ses droits peut demander son
          retrait en ouvrant un ticket sur le dépôt du projet. Le retrait est immédiat, sans
          discussion préalable.
        </p>
      </Card>
    </div>
  )
}
