import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Card, Pill, SectionTitle } from '../components/ui'
import { CONTROLLER, PRIVACY_UPDATED, RIGHTS, STORED } from '../lib/privacy'
import { isShared } from '../lib/backend'

export default function PrivacyPage() {
  const updated = new Date(PRIVACY_UPDATED).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="flex flex-col gap-5">
      <SectionTitle eyebrow="🔒 Confidentialité" title="Politique de protection des données" />

      <p className="-mt-2 text-xs text-lh-muted">
        Dernière mise à jour : {updated} · Conforme au règlement (UE) 2016/679 (RGPD) et à la loi
        Informatique et Libertés.
      </p>

      <Card className="border-lh-gold/30 bg-lh-gold/[0.05] p-4">
        <p className="text-sm leading-relaxed">
          <strong>En une phrase :</strong> Lugdun'Home enregistre ton e-mail, ton pseudo et tes
          votes — rien d'autre. Aucun traceur publicitaire, aucune revente, aucun profilage. Sans
          compte, rien ne quitte ton téléphone.
        </p>
      </Card>

      <Article n="1" title="Qui traite tes données">
        <p>
          Le responsable de traitement est <strong className="text-lh-text">{CONTROLLER.name}</strong>,
          qui édite Lugdun'Home à titre personnel et non commercial. Toute demande relative à tes
          données se fait à{' '}
          <a
            href={`mailto:${CONTROLLER.email}`}
            className="font-semibold text-lh-redSoft underline underline-offset-2"
          >
            {CONTROLLER.email}
          </a>
          , ou à défaut via{' '}
          <a
            href={CONTROLLER.repo}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-lh-redSoft underline underline-offset-2"
          >
            le dépôt du projet
          </a>
          .
        </p>
        <p>
          Le site n'a aucun lien avec l'Olympique Lyonnais, la Ligue de Football Professionnel ni
          aucun ayant droit.
        </p>
      </Article>

      <Article n="2" title="Ce qui est enregistré, et pourquoi">
        <p>
          La liste ci-dessous est exhaustive et tenue à jour avec le code : chaque ligne correspond
          à une donnée réellement écrite, pas à une intention.
        </p>
        <div className="lh-rail mt-3 overflow-x-auto rounded-xl border border-lh-line">
          <table className="w-full min-w-[34rem] text-left text-[12.5px]">
            <thead className="bg-lh-raised text-[10.5px] uppercase tracking-wider text-lh-muted">
              <tr>
                <th className="px-3 py-2 font-bold">Donnée</th>
                <th className="px-3 py-2 font-bold">Finalité</th>
                <th className="px-3 py-2 font-bold">Où</th>
              </tr>
            </thead>
            <tbody>
              {STORED.map((item) => (
                <tr key={item.key} className="border-t border-lh-line/60 align-top">
                  <td className="px-3 py-2">
                    <div className="font-bold">{item.label}</div>
                    <div className="font-mono text-[10.5px] text-lh-muted">{item.key}</div>
                  </td>
                  <td className="px-3 py-2 leading-relaxed text-lh-muted">{item.purpose}</td>
                  <td className="whitespace-nowrap px-3 py-2">
                    <Pill
                      tone={item.where === 'appareil' ? 'green' : 'neutral'}
                      className="!px-2 !py-0.5 !text-[10px]"
                    >
                      {item.where}
                    </Pill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3">
          <strong className="text-lh-text">Ne sont jamais collectés :</strong> nom réel, date de
          naissance, adresse postale, numéro de téléphone, coordonnées bancaires, position
          géographique, carnet de contacts, historique de navigation hors du site.
        </p>
      </Article>

      <Article n="3" title="Sur quelle base légale">
        <ul className="flex list-disc flex-col gap-1.5 pl-5">
          <li>
            <strong className="text-lh-text">Ton consentement</strong> (art. 6.1.a) pour la création
            du compte et l'enregistrement de tes votes. Tu le donnes en créant un compte et le
            retires en le supprimant.
          </li>
          <li>
            <strong className="text-lh-text">L'intérêt légitime</strong> (art. 6.1.f) pour agréger
            les votes en moyennes et classements — c'est l'objet même du service, et l'agrégat ne
            permet pas de te réidentifier.
          </li>
        </ul>
        <p>
          Aucun traitement ne repose sur une obligation contractuelle : le service est gratuit et
          sans contrepartie.
        </p>
      </Article>

      <Article n="4" title="Qui peut y accéder">
        <p>
          Tes données ne sont ni vendues, ni louées, ni transmises à des annonceurs. Deux catégories
          de tiers seulement interviennent :
        </p>
        <ul className="flex list-disc flex-col gap-1.5 pl-5">
          <li>
            <strong className="text-lh-text">L'hébergeur de la base</strong> (Supabase), en qualité
            de sous-traitant au sens de l'article 28. Il héberge les comptes et les votes ; il n'en
            fait aucun usage propre.
          </li>
          <li>
            <strong className="text-lh-text">L'hébergeur du site</strong> (GitHub Pages), qui sert
            les fichiers de l'application. Il ne reçoit aucune donnée de compte.
          </li>
        </ul>
        <p>
          Sont publics, parce que c'est le principe d'une plateforme communautaire :{' '}
          <strong className="text-lh-text">ton pseudo, ton avatar, tes points et ton rang</strong>.
          Ton e-mail ne l'est jamais, et tes votes individuels ne sont montrés qu'agrégés.
        </p>
      </Article>

      <Article n="5" title="Hors de l'Union européenne">
        <p>
          L'hébergement de la base peut être situé hors de l'Union européenne selon la région
          choisie. Dans ce cas, le transfert est encadré par les clauses contractuelles types de la
          Commission européenne. Les données concernées se limitent à l'e-mail, au pseudo et aux
          votes.
        </p>
      </Article>

      <Article n="6" title="Combien de temps">
        <ul className="flex list-disc flex-col gap-1.5 pl-5">
          <li>
            <strong className="text-lh-text">Compte actif :</strong> tant que tu l'utilises.
          </li>
          <li>
            <strong className="text-lh-text">Compte inactif :</strong> supprimé après 3 ans sans
            connexion, après un avertissement par e-mail.
          </li>
          <li>
            <strong className="text-lh-text">Après suppression :</strong> effacement sous 30 jours.
            Les votes sont conservés sous forme anonyme dans les moyennes déjà calculées — les en
            retirer fausserait l'historique, et ils ne te désignent plus.
          </li>
          <li>
            <strong className="text-lh-text">Données locales :</strong> effacées dès que tu vides le
            stockage de ton navigateur.
          </li>
        </ul>
      </Article>

      <Article n="7" title="Tes droits">
        <div className="mt-1 flex flex-col gap-2.5">
          {RIGHTS.map((right) => (
            <div key={right.title} className="rounded-xl border border-lh-line bg-lh-raised p-3">
              <div className="mb-0.5 text-sm font-black">{right.title}</div>
              <p className="text-[12.5px] leading-relaxed text-lh-muted">{right.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-3">
          Toute demande reçoit une réponse sous un mois. Les boutons d'export et de suppression de
          la page{' '}
          <Link to="/profil" className="font-semibold text-lh-redSoft underline underline-offset-2">
            Profil
          </Link>{' '}
          rendent l'attente inutile dans la plupart des cas.
        </p>
      </Article>

      <Article n="8" title="Cookies et traceurs">
        <p>
          <strong className="text-lh-text">Aucun cookie n'est déposé.</strong> L'application
          n'utilise que le stockage local du navigateur, uniquement pour te garder connecté et
          mémoriser tes votes. Il ne suit rien en dehors du site et n'est lisible que par lui.
        </p>
        <p>
          C'est pourquoi tu ne verras jamais de bandeau de consentement ici : le stockage
          strictement nécessaire au fonctionnement d'un service demandé par l'utilisateur en est
          dispensé. Il n'y a ni Google Analytics, ni pixel publicitaire, ni bouton de réseau social
          traçant.
        </p>
      </Article>

      <Article n="9" title="Sécurité">
        <ul className="flex list-disc flex-col gap-1.5 pl-5">
          <li>Tout transite en HTTPS.</li>
          <li>Les mots de passe sont chiffrés à sens unique — personne ne peut les lire.</li>
          <li>
            Des règles de sécurité au niveau de chaque ligne empêchent un compte d'écrire ou de
            modifier les données d'un autre, y compris en forgeant les requêtes à la main.
          </li>
          <li>
            En cas de violation présentant un risque, la CNIL est notifiée sous 72 heures et les
            personnes concernées sont prévenues.
          </li>
        </ul>
      </Article>

      <Article n="10" title="Mineurs">
        <p>
          Le service s'adresse aux plus de 15 ans, âge du consentement numérique en France.
          En dessous, l'accord d'un titulaire de l'autorité parentale est requis. Aucune donnée
          n'est sciemment collectée auprès d'un enfant de moins de 13 ans ; si tel était le cas, un
          signalement à l'adresse ci-dessus entraîne une suppression immédiate.
        </p>
      </Article>

      <Article n="11" title="Modifications">
        <p>
          Toute évolution de cette politique est publiée sur cette page, avec une nouvelle date de
          mise à jour. Un changement substantiel de finalité est annoncé dans l'application avant
          d'entrer en vigueur.
        </p>
      </Article>

      {!isShared && (
        <Card className="border-emerald-500/30 bg-emerald-500/[0.06] p-4">
          <p className="text-sm leading-relaxed">
            <strong className="text-emerald-400">État actuel de cette installation :</strong> aucun
            serveur n'est branché. Absolument rien ne sort de ton appareil, et les sections 4, 5 et
            6 ne s'appliqueront qu'une fois le mode communautaire activé.
          </p>
        </Card>
      )}

      <div className="flex flex-wrap gap-3 pt-1">
        <Link
          to="/mentions-legales"
          className="text-xs font-bold text-lh-muted hover:text-lh-text"
        >
          Mentions légales et crédits →
        </Link>
        <Link to="/profil" className="text-xs font-bold text-lh-muted hover:text-lh-text">
          Exporter ou supprimer mes données →
        </Link>
      </div>
    </div>
  )
}

function Article({ n, title, children }: { n: string; title: string; children: ReactNode }) {
  return (
    <Card className="p-4">
      <div className="mb-2 flex items-baseline gap-2.5">
        <span className="lh-display text-lg text-lh-red">{n}</span>
        <h2 className="lh-display text-lg">{title}</h2>
      </div>
      <div className="flex flex-col gap-2 text-[13px] leading-relaxed text-lh-muted">{children}</div>
    </Card>
  )
}
