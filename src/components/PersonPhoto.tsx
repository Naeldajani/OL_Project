import { useState } from 'react'
import PlayerAvatar from './PlayerAvatar'
import { PHOTO_MANIFEST } from '../data/photo-manifest'

interface Props {
  name: string
  size?: number
  className?: string
}

export default function PersonPhoto({ name, size = 64, className = '' }: Props) {
  const path = PHOTO_MANIFEST[name]
  const [failedFor, setFailedFor] = useState<string | null>(null)

  if (!path || failedFor === name) {
    return <PlayerAvatar name={name} size={size} className={className} />
  }

  return (
    <img
      src={path}
      alt={name}
      width={size}
      height={size}
      loading="lazy"
      className={`rounded-full object-cover ring-2 ring-white/10 shrink-0 ${className}`}
      style={{ width: size, height: size }}
      onError={() => setFailedFor(name)}
    />
  )
}
