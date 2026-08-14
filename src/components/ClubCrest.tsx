import CrestBadge from './CrestBadge'

interface Props {
  club: string
  size?: number
  className?: string
}

/** Écusson maison — voir CrestBadge pour le pourquoi du dessin plutôt que
 *  du logo officiel. */
export default function ClubCrest({ club, size = 44, className = '' }: Props) {
  return <CrestBadge club={club} size={size} className={className} />
}
