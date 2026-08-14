/**
 * Post-build step: teach the service worker which hashed assets to precache.
 *
 * The JS/CSS bundles are requested during the first navigation, before the
 * worker controls the page, so they never pass through its fetch handler and
 * would be missing the first time the user goes offline. Their names carry a
 * content hash and are only known once vite has run, hence this rewrite.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const dist = resolve(process.cwd(), 'dist')
const swPath = resolve(dist, 'lh-sw.js')
const shellPath = resolve(dist, 'lugdunhome.html')

if (!existsSync(swPath) || !existsSync(shellPath)) {
  console.log('[sw] rien à injecter (build partiel)')
  process.exit(0)
}

const shell = readFileSync(shellPath, 'utf8')
const assets = [
  ...shell.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g),
].map((m) => m[1])

const buildId = Date.now().toString(36)

let sw = readFileSync(swPath, 'utf8')
sw = sw
  .replace('__BUILD_ID__', buildId)
  .replace("['__LH_ASSETS__']", JSON.stringify(assets))

writeFileSync(swPath, sw)
console.log(`[sw] build ${buildId}, ${assets.length} assets précachés`)
