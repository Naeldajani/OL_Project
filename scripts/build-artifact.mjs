/**
 * Build « artefact » : un fichier HTML unique et autoportant.
 *
 * Un artefact est servi sous une CSP qui interdit toute requête externe, et
 * il n'a pas de serveur : tout — JS, CSS, images — doit tenir dans la page.
 * D'où la build à entrée unique (le découpage en modules casse dès que le
 * code est inliné) et la substitution des manifestes d'images par leurs
 * versions data-URI, générées par scripts/inline-images.py.
 *
 * Usage:  python3 scripts/inline-images.py && node scripts/build-artifact.mjs
 */
import { build } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'

const root = process.cwd()
const outDir = resolve(root, 'dist-artifact')

// Les modules lourds en images ont un jumeau `.inline` : même API, mais les
// chemins /images/... sont remplacés par des data-URI.
// La clé est le nom de fichier importé, sans extension : les appelants y
// arrivent par des chemins relatifs différents selon leur profondeur.
const SWAPS = [
  ['photo-manifest', 'src/data/photo-manifest.inline.ts'],
  ['news.json', 'src/lugdunhome/data/news.inline.json'],
]

const missing = SWAPS.filter(([, file]) => !existsSync(resolve(root, file)))
if (missing.length) {
  console.error("Manque les manifestes inlinés. Lance d'abord :")
  console.error('  python3 scripts/inline-images.py')
  process.exit(1)
}

/** Redirige les imports vers leur jumeau inliné, quel que soit le chemin
 *  relatif utilisé par l'appelant. */
function swapManifests() {
  return {
    name: 'swap-inline-manifests',
    enforce: 'pre',
    async resolveId(source) {
      // le jumeau se résout lui-même : sans ce garde-fou, boucle infinie
      if (/\.inline\.(ts|json)$/.test(source)) return null
      for (const [needle, file] of SWAPS) {
        if (source.endsWith(`/${needle}`)) return resolve(root, file)
      }
      return null
    },
  }
}

await build({
  root,
  configFile: false,
  plugins: [react(), swapManifests()],
  base: './',
  // les images voyagent en data-URI : inutile de recopier les 63 Mo de public/
  publicDir: false,
  define: { 'process.env.NODE_ENV': '"production"' },
  build: {
    outDir,
    emptyOutDir: true,
    cssCodeSplit: false,
    assetsInlineLimit: Number.MAX_SAFE_INTEGER,
    modulePreload: { polyfill: false },
    rollupOptions: {
      input: resolve(root, 'lugdunhome.html'),
      output: { inlineDynamicImports: true },
    },
  },
})

// vite laisse le JS et le CSS à côté du HTML : on les replie dedans.
const htmlPath = resolve(outDir, 'lugdunhome.html')
let html = readFileSync(htmlPath, 'utf8')

html = html.replace(
  /<script type="module"[^>]*src="([^"]+)"[^>]*><\/script>/g,
  (_, src) => `<script type="module">\n${readFileSync(resolve(outDir, src.replace(/^\.?\//, '')), 'utf8')}\n</script>`,
)
html = html.replace(
  /<link rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g,
  (_, href) => `<style>\n${readFileSync(resolve(outDir, href.replace(/^\.?\//, '')), 'utf8')}\n</style>`,
)
// le manifeste PWA et le service worker n'ont aucun sens hors serveur
html = html.replace(/<link rel="manifest"[^>]*>/g, '')

const out = resolve(root, 'dist-artifact/lugdunhome-artifact.html')
writeFileSync(out, html)
rmSync(resolve(outDir, 'assets'), { recursive: true, force: true })

const mb = (readFileSync(out).length / 1e6).toFixed(1)
console.log(`\n→ ${out} (${mb} Mo)`)
if (Number(mb) > 15.5) console.warn('⚠️  proche de la limite de 16 Mo des artefacts')
