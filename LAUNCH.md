# Launch checklist

Tab Groups Rock ships as a free, open-source, hobbyist extension on the Chrome Web Store. Published under a personal (not LLC) Google account, declared non-trader, distributed worldwide, with an optional personal tip link. A paid fork, if it ever happens, is a separate listing under the LLC.

Tick items as they're done. Order within a section is suggested, not required. Sections 1–3 gate section 4.

## 1. Verify the current build

- [x] `TESTING.md` run to completion on a fresh `npm run build`, results table filled in and committed (2026-10-18).
- [x] Case 9 result recorded: yes, a closed group still appears under Chrome menu → Tab groups.
- [x] Any failures fixed and the failing cases re-run. (None.)

## 2. v1 features

- [x] **Bookmark folder destination.** Each archived group also written to `Other bookmarks / Archived groups / YYYY-MM / <group title>`. On by default. Adds the `bookmarks` permission.
- [x] **Select all** control above the group picker.
- [x] **Save file** and **Copy to clipboard** as secondary actions on the popup, so the note is recoverable when Obsidian isn't installed or the prompt was cancelled.
- [x] **First-run hint** on the save page: Chrome will ask to open Obsidian; tick "Always allow" to skip it next time.
- [x] **Saved-group note** after closing tabs (case 9 confirmed it): "Chrome still lists this group under Tab groups. Use Delete group there to remove it."
- [x] **Wording:** save page status "Sent" → "Handed to Obsidian".
- [x] **Close the save page automatically** setting (on by default), and the save page stays open while the first-run hint is showing. Added 2026-10-22 after case 11 showed the hint vanishing with the tab.
- [x] `TESTING.md` extended with cases 11–24; all run and passing on 2026-10-22 (cases 1, 2, 6 retested after the save-page changes).
- [ ] Full pass of every case on the 1.0.0 build, right before upload.

## 3. Code hygiene

- [x] `_locales/en/messages.json`; manifest `name` and `description` via `__MSG_`; `default_locale: "en"`; `data-i18n` on popup, save, and options pages.
- [x] `THIRD_PARTY_NOTICES.md` listing knap (MIT).
- [x] Vitest with tests for `collect`, `render`, `frontmatter`, `filename` (`npm test`, 12 tests).
- [x] `npm run build` also writes `builds/tab-groups-rock-<version>.zip` from `dist/` (source maps excluded).
- [x] Version bumped to `1.0.0` in `manifest.chrome.json` and `package.json`.
- [x] `.github/workflows/ci.yml`: install, typecheck, test, build, upload the zip as an artifact.
- [x] README updated for the bookmark destination, the tip link (hidden placeholder until the account exists), and the "Chrome still lists the group" caveat. Also a CI badge, privacy link, and Support section.

## 4. Store assets

All listing copy (descriptions, single purpose, permission justifications, privacy-tab answers) is in `store/listing.md`, ready to paste.

- [x] **Icon:** final design in `icons/` (concept 9b: stacked tabs with a dark rock, no purple). 16/32/48/128 PNGs in the manifest, 128 for the store, `icon.svg` as source.
- [x] **Screenshots:** 1280×800 PNG. At least: the popup with groups checked; the save page after sending; the resulting note in Obsidian; the bookmark folder in Chrome. Use the test vault, not a real one.
- [x] **Promo tile:** 440×280 at `store/promo-tile-440x280.png`, regenerated from the icon by `store/promo_tile.py`.
- [x] **Privacy policy** at `docs/privacy.md`, served by GitHub Pages at `https://mugsy.io/tab-groups-rock/privacy` (section 5). Covers: reads titles and URLs only of tabs in the groups you choose; writes them to Obsidian, a downloaded file, or Chrome bookmarks; nothing transmitted; no analytics, no accounts; what's kept in sync, local, and session storage.
- [x] **Short description** (≤132 chars), 114 characters, also the manifest description: "Archive tab groups as Markdown notes in Obsidian, with a link to every tab, then close them and clear the clutter."
- [x] **Detailed description:** what it does, how it works (Obsidian URI + clipboard), the bookmark folder, why the `tabs` permission shows a "read your browsing history" warning, the saved-group caveat, link to the repo, tip link.
- [x] **Single-purpose statement:** "Archives Chrome tab groups as Markdown notes in Obsidian and as bookmark folders."
- [x] **Permission justifications**, one sentence each: `tabs`, `tabGroups`, `storage`, `clipboardWrite`, `contextMenus`, `bookmarks`.

## 5. Accounts

- [ ] Publish with your existing personal Google account (decided 2026-10-22). The extension stays tied to it; moving it later takes a transfer request to Chrome Web Store support.
- [ ] Chrome Web Store developer registration, one-time $5 fee.
- [ ] Contact email set to `tabgroups@mugsy.io` and verified in the developer account. It must receive mail, so not the GitHub no-reply address, and it may be shown to users, so not the Gmail address. The alias forwards to Gmail; replies from Gmail expose that address, so decide how to answer before replying to users.
- [x] GitHub repo public, with LICENSE, README, PROPOSAL, TESTING, LAUNCH, and the privacy page.
- [x] GitHub Pages on (2026-10-22; privacy URL verified): repo Settings → Pages → Deploy from a branch → `main`, folder `/docs`. Check the privacy URL loads before submitting.
- [ ] Tip link account (Buy Me a Coffee or similar) in your own name, if wanted.
- [ ] Optional: USPTO quick search for "Tab Groups Rock".

## 6. Submission

- [ ] Upload the zip. Fill in the listing from section 4.
- [ ] Privacy tab: data-use disclosures (none collected), certify compliance.
- [ ] Trader declaration: **non-trader**.
- [ ] Distribution: public, all regions.
- [ ] Submit for review. First reviews commonly take a few days; up to a couple of weeks is not unusual.
- [ ] Note the assigned extension ID in the README once published. The restore-link feature needs it.

## 7. After approval

- [ ] Install from the store on a clean Chrome profile and run `TESTING.md` once more against the store build.
- [ ] Tag `v1.0.0` in git; GitHub release with the zip attached.
- [ ] Tell the Obsidian forum (Share & showcase) and the r/ObsidianMD subreddit. Lead with "archive", since Chrome already owns "save group".
- [ ] Watch the store's user-feedback and support tabs for the first two weeks.

## Deliberately not in v1

Multiple vaults, editable templates, stats and history, paste-to-restore, restore link, REST writer, Firefox and Edge, window-as-one-note, auto-offer on close. See `PROPOSAL.md` §9.
