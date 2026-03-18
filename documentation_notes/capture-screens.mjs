/**
 * Capture screenshots of each app screen using Playwright.
 * Run: node documentation_notes/capture-screens.mjs
 */
import { chromium } from 'playwright'
import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ARTIFACTS = join(__dirname, 'records/2026-03-17/artifacts')
const BASE = 'http://localhost:8081'

const SCREENS = [
  { name: '012_home-screen-app-v1', path: '/', waitFor: 2000 },
  { name: '013_match-setup-app-v1', path: '/lobby', waitFor: 1500 },
  { name: '014_game-screen-app-v1', path: '/game/local?mode=SUDDEN_DEATH&clock=30', waitFor: 2500 },
  { name: '015_assets-screen-app-v1', path: '/assets', waitFor: 2000 },
]

async function run() {
  const browser = await chromium.launch()
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const page = await context.newPage()

  for (const screen of SCREENS) {
    console.log(`Capturing ${screen.name}…`)
    await page.goto(`${BASE}${screen.path}`)
    await page.waitForTimeout(screen.waitFor)

    const filename = `${screen.name}_app-screenshot.jpg`
    const outPath = join(ARTIFACTS, filename)
    await page.screenshot({ path: outPath, type: 'jpeg', quality: 92 })
    console.log(`  ✓ ${filename}`)
  }

  await browser.close()
  console.log('\nAll screenshots saved to', ARTIFACTS)
}

run().catch((err) => { console.error(err); process.exit(1) })
