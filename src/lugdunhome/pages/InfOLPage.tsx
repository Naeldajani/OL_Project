import { useMemo, useState } from 'react'
import { Card, EmptyState, Pill, SectionTitle } from '../components/ui'
import {
  domainOf,
  news,
  newsSources,
  newsUpdatedAt,
  relativeTime,
  topicStyle,
  topics,
  type NewsItem,
} from '../lib/news'

function Cover({ item, tall = false }: { item: NewsItem; tall?: boolean }) {
  const [broken, setBroken] = useState(false)
  const style = topicStyle(item.topic)

  if (!item.image || broken) {
    return (
      <div
        className={`grid w-full shrink-0 place-items-center bg-gradient-to-br from-lh-raised to-lh-surface ${
          tall ? 'h-48 sm:h-64' : 'h-full'
        }`}
      >
        <span className="text-3xl opacity-40">{style.icon}</span>
      </div>
    )
  }
  return (
    <img
      src={item.image}
      alt=""
      loading="lazy"
      onError={() => setBroken(true)}
      className={`w-full shrink-0 object-cover ${tall ? 'h-48 sm:h-64' : 'h-full'}`}
    />
  )
}

function Meta({ item }: { item: NewsItem }) {
  return (
    <div className="flex min-w-0 items-center gap-1.5 text-[11px] text-lh-muted">
      <span className="shrink-0 font-bold text-lh-text">{item.source}</span>
      {item.author && <span className="hidden truncate sm:inline">· {item.author}</span>}
      {item.publishedAt && <span className="shrink-0">· {relativeTime(item.publishedAt)}</span>}
    </div>
  )
}

/** L'article à la une : image pleine largeur, résumé plus long. */
function Headline({ item }: { item: NewsItem }) {
  const style = topicStyle(item.topic)
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="lh-card-raised group block overflow-hidden transition-transform active:scale-[0.995]"
    >
      <Cover item={item} tall />
      <div className="flex flex-col gap-2.5 p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <Pill tone={style.tone}>
            {style.icon} {item.topic}
          </Pill>
          <Pill tone="red">À la une</Pill>
        </div>
        <h3 className="lh-display text-xl leading-tight sm:text-2xl">{item.title}</h3>
        {item.summary && <p className="text-sm leading-relaxed text-lh-muted">{item.summary}</p>}
        <div className="mt-1 flex flex-col gap-1.5 border-t border-lh-line/70 pt-3 sm:flex-row sm:items-center sm:justify-between">
          <Meta item={item} />
          <span className="truncate text-[11px] font-bold text-lh-redSoft group-hover:underline">
            Lire sur {domainOf(item.url)} ↗
          </span>
        </div>
      </div>
    </a>
  )
}

function Article({ item }: { item: NewsItem }) {
  const style = topicStyle(item.topic)
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="lh-card group flex gap-3 overflow-hidden p-0 transition-transform active:scale-[0.995]"
    >
      <div className="w-24 shrink-0 sm:w-36">
        <Cover item={item} />
      </div>
      <div className="flex min-w-0 flex-col gap-1.5 py-3 pr-3 sm:py-4 sm:pr-4">
        <div className="flex items-center gap-2">
          <span className="text-[10.5px] font-bold uppercase tracking-wide text-lh-muted">
            {style.icon} {item.topic}
          </span>
        </div>
        <h3 className="text-sm font-bold leading-snug sm:text-base">{item.title}</h3>
        {item.summary && (
          <p className="line-clamp-3 text-[12.5px] leading-relaxed text-lh-muted">{item.summary}</p>
        )}
        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <Meta item={item} />
          <span className="hidden shrink-0 text-[11px] font-bold text-lh-redSoft group-hover:underline sm:inline">
            Lire ↗
          </span>
        </div>
      </div>
    </a>
  )
}

export default function InfOLPage() {
  const [topic, setTopic] = useState<string>('Tout')
  const available = useMemo(() => topics(news), [])

  const filtered = useMemo(
    () => (topic === 'Tout' ? news : news.filter((n) => n.topic === topic)),
    [topic],
  )

  const [headline, ...rest] = filtered

  return (
    <div className="flex flex-col gap-5">
      <SectionTitle
        eyebrow="📰 Inf'OL"
        title="Tout ce qui se dit sur l'OL"
        action={
          <span className="hidden text-right text-[11px] leading-tight text-lh-muted sm:block">
            Mis à jour
            <br />
            <span className="font-bold text-lh-text">{relativeTime(newsUpdatedAt)}</span>
          </span>
        }
      />

      <p className="-mt-2 text-sm text-lh-muted">
        Le fil est agrégé automatiquement depuis {newsSources.length} médias et sites de supporters.
        Chaque info est résumée en quelques lignes — la source est citée et l'article original reste
        à un clic.
      </p>

      {/* filtres rubriques */}
      <div className="lh-rail -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {[{ name: 'Tout', count: news.length }, ...available].map((t) => {
          const active = topic === t.name
          const style = t.name === 'Tout' ? { icon: '🔥' } : topicStyle(t.name)
          return (
            <button
              key={t.name}
              onClick={() => setTopic(t.name)}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-bold transition-colors ${
                active
                  ? 'border-lh-red bg-lh-red/15 text-lh-redSoft'
                  : 'border-lh-line bg-lh-raised text-lh-muted hover:text-lh-text'
              }`}
            >
              {style.icon} {t.name}
              <span className="ml-1.5 opacity-60">{t.count}</span>
            </button>
          )
        })}
      </div>

      {!headline ? (
        <EmptyState
          icon="📰"
          title="Aucune actu dans cette rubrique"
          hint="Le fil se recharge automatiquement plusieurs fois par jour."
        />
      ) : (
        <>
          <Headline item={headline} />
          <div className="flex flex-col gap-3">
            {rest.map((item) => (
              <Article key={item.id} item={item} />
            ))}
          </div>
        </>
      )}

      <Card className="p-4">
        <div className="lh-eyebrow mb-2">Sources du fil</div>
        <div className="flex flex-wrap gap-2">
          {newsSources.map((s) => (
            <Pill key={s}>{s}</Pill>
          ))}
        </div>
        <p className="mt-3 text-xs leading-relaxed text-lh-muted">
          Lugdun'Home n'héberge aucun article : chaque brève est un résumé de quelques lignes qui
          renvoie vers le média d'origine, seul détenteur du contenu complet. Les visuels restent
          hébergés par les sources.
        </p>
      </Card>
    </div>
  )
}
