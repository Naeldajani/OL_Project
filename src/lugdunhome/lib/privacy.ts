/**
 * Coordonnées du responsable de traitement.
 *
 * Le RGPD impose de publier une identité et un moyen de contact : une
 * politique de confidentialité anonyme ne vaut rien, puisque personne ne
 * peut y exercer ses droits. Renseigne ces deux champs avant toute mise en
 * ligne publique — le reste de la page s'adapte.
 *
 * Pour un particulier, le nom et une adresse e-mail suffisent ; l'adresse
 * postale n'est pas obligatoire tant que le site n'est pas commercial.
 */
export const CONTROLLER = {
  /** Nom du responsable, ou pseudonyme s'il est joignable par ce nom. */
  name: 'Naeldajani',
  /** Adresse à laquelle les demandes RGPD sont reçues. */
  email: 'dajaninael@gmail.com',
  /** Voie de secours publique, utile si l'e-mail change. */
  repo: 'https://github.com/Naeldajani/OL_Project/issues',
}

/** Date de dernière révision, affichée en tête de la politique. */
export const PRIVACY_UPDATED = '2026-08-15'

export interface StoredItem {
  key: string
  label: string
  purpose: string
  /** où la donnée vit réellement */
  where: 'appareil' | 'serveur' | 'les deux'
}

/**
 * Inventaire exhaustif de ce que l'application enregistre. Il est tenu à
 * jour avec le code : chaque clé correspond à un localStorage réel ou à une
 * table du schéma Supabase, pas à une intention.
 */
export const STORED: StoredItem[] = [
  {
    key: 'Adresse e-mail',
    label: 'E-mail du compte',
    purpose: "Identifier le compte, permettre la connexion et la réinitialisation du mot de passe",
    where: 'serveur',
  },
  {
    key: 'Mot de passe',
    label: 'Mot de passe',
    purpose:
      "Jamais stocké en clair : seul un condensat chiffré est conservé par l'hébergeur d'authentification",
    where: 'serveur',
  },
  {
    key: 'Pseudo et avatar',
    label: 'Identité publique',
    purpose: 'Apparaître dans les classements et à côté de ses votes',
    where: 'les deux',
  },
  {
    key: 'lh:session',
    label: 'Jeton de session',
    purpose: 'Rester connecté entre deux visites sans ressaisir son mot de passe',
    where: 'appareil',
  },
  {
    key: 'lh:device-id / lh:local-account',
    label: 'Identifiant technique',
    purpose:
      "Rattacher les votes à un même visiteur quand aucun compte n'est créé ; aucun lien avec une identité",
    where: 'appareil',
  },
  {
    key: 'player_ratings',
    label: 'Notes attribuées aux joueurs',
    purpose: 'Calculer la moyenne communautaire de chaque joueur',
    where: 'les deux',
  },
  {
    key: 'motm_votes',
    label: 'Votes Homme du Match',
    purpose: 'Établir le résultat du vote collectif',
    where: 'les deux',
  },
  {
    key: 'debate_votes',
    label: 'Votes aux débats',
    purpose: "Afficher la répartition des avis de la communauté",
    where: 'les deux',
  },
  {
    key: 'predictions',
    label: 'Pronostics et points',
    purpose: 'Calculer le score, le niveau et le classement',
    where: 'les deux',
  },
  {
    key: 'lh:demo-window',
    label: 'Fenêtre de vote simulée',
    purpose: "Rejouer la fenêtre de 24 h à des fins de démonstration ; aucune donnée personnelle",
    where: 'appareil',
  },
]

export interface Right {
  title: string
  body: string
}

export const RIGHTS: Right[] = [
  {
    title: 'Accès',
    body: "Obtenir une copie de toutes les données te concernant. Le bouton « Exporter mes données » de la page Profil la produit immédiatement, sans avoir à écrire.",
  },
  {
    title: 'Rectification',
    body: 'Corriger une donnée inexacte. Le pseudo et l’avatar se modifient directement depuis la page Profil.',
  },
  {
    title: 'Effacement',
    body: "Faire supprimer ton compte et tout ce qui y est rattaché. Le bouton « Supprimer mon compte » efface tes données de cet appareil sur-le-champ ; la suppression côté serveur est traitée sous 30 jours.",
  },
  {
    title: 'Portabilité',
    body: "Récupérer tes données dans un format lisible par une machine — l'export est un fichier JSON standard.",
  },
  {
    title: 'Opposition et limitation',
    body: "T'opposer à un traitement ou en demander le gel, le temps qu'une contestation soit examinée.",
  },
  {
    title: 'Retrait du consentement',
    body: 'Retirable à tout moment, sans justification. Le retrait ne remet pas en cause ce qui a été fait avant.',
  },
  {
    title: 'Réclamation',
    body: "Saisir la CNIL (cnil.fr) si tu estimes que tes droits ne sont pas respectés. C'est un droit qui s'exerce sans passer par nous.",
  },
]
