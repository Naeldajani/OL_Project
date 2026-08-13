import { useEffect, useState } from 'react'
import PlayerAvatar from './PlayerAvatar'
import { getPersonPhoto } from '../lib/wikiPhoto'

interface Props {
  name: string
  size?: number
  className?: string
}

export default function PersonPhoto({ name, size = 64, className = '' }: Props) {
  const [src, setSrc] = useState<string | null | 'loading'>('loading')

  useEffect(() => {
    let cancelled = false
    setSrc('loading')
    getPersonPhoto(name).then((url) => {
      if (!cancelled) setSrc(url)
    })
    return () => {
      cancelled = true
    }
  }, [name])

  if (!src || src === 'loading') {
    return (
      <div className={`relative ${className}`} style={{ width: size, height: size }}>
        <PlayerAvatar name={name} size={size} />
        {src === 'loading' && (
          <div
            className="absolute inset-0 rounded-full animate-pulse bg-white/5"
            aria-hidden
          />
        )}
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={name}
      width={size}
      height={size}
      className={`rounded-full object-cover ring-2 ring-white/10 shrink-0 ${className}`}
      style={{ width: size, height: size }}
      onError={() => setSrc(null)}
    />
  )
}
