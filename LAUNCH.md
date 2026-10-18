# Launch checklist

Tab Groups Rock ships as a free, open-source, hobbyist extension on the Chrome Web Store. Published under a personal (not LLC) Google account, declared non-trader, distributed worldwide, with an optional personal tip link. A paid fork, if it ever happens, is a separate listing under the LLC.

Tick items as they're done. Order within a section is suggested, not required. Sections 1–3 gate section 4.

## 1. Verify the current build

- [x] `TESTING.md` run to completion on a fresh `npm run build`, results table filled in and committed (2026-10-18).
- [x] Case 9 result recorded: yes, a closed group still appears under Chrome menu → Tab groups.
- [x] Any failures fixed and the failing cases re-run. (None.)

## 2. v1 features

- [ ] **Bookmark folder destination.** Each archived group also written to `Other bookmarks / Archived groups / YYYY-MM / <group title>`. On by default. Adds the `bookmarks` permission.
- [ ] **Select all** control above the group picker.
- [ ] **Save file** and **Copy to clipboard** as secondary actions on the popup, so the note is recoverable when Obsidian isn't installed or the prompt was cancelled.
- [ ] **First-run hint** on the save page: Chrome will ask to open Obsidian; tick "Always allow" to skip it next time.
- [ ] **Saved-group note** after closing tabs (case 9 confirmed it): "Chrome still lists this group under Tab groups. Use Delete group there to remove it."
- [ ] **Wording:** save page status "Sent" → "Handed to Obsidian".
- [ ] `TESTING.md` extended with cases for the new features, full pass re-run.

## 3. Code hygiene

- [ ] `_locales/en/messages.json`; manifest `name` and `description` via `__MSG_`; `default_locale: "en"`; `data-i18n` on popup, save, and options pages.
- [ ] `THIRD_PARTY_NOTICES.md` listing knap (MIT).
- [ ] Vitest with tests for `collect`, `render`, `frontmatter`, `filename`. Not a store requirement; do it if time allows.
- [ ] `npm run build` also writes `builds/tab-groups-rock-<version>.zip` from `dist/`.
- [ ] Version bumped to `1.0.0` in `manifest.chrome.json` and `package.json`.
- [ ] `.github/workflows/ci.yml`: install, typecheck, test, build, upload the zip as an artifact.
- [ ] README updated for the bookmark destination, the tip link, and the "Chrome still lists the group" caveat.

## 4. Store assets

- [ ] **Icon:** final design, no Obsidian gem, no purple. 128×128 PNG for the store plus 16/48 in the manifest. Replace `icons/generate_icons.py` output.
- [ ] **Screenshots:** 1280×800 PNG. At least: the popup with groups checked; the save page after sending; the resulting note in Obsidian; the bookmark folder in Chrome. Use the test vault, not a real one.
- [ ] **Promo tile:** 440×280, optional but improves placement.
- [ ] **Privacy policy** page on GitHub Pages from the repo (`docs/privacy.md` or similar). Says: reads titles and URLs of tabs in the groups you choose; writes them to Obsidian and, if enabled, Chrome bookmarks on your device; nothing is transmitted anywhere; no analytics, no accounts; settings stored in Chrome sync storage.
- [ ] **Short description** (≤132 chars): "Archive a Chrome tab group as a Markdown note in Obsidian, with a link to every tab." or similar.
- [ ] **Detailed description:** what it does, how it works (Obsidian URI + clipboard), the bookmark folder, why the `tabs` permission shows a "read your browsing history" warning, the saved-group caveat, link to the repo, tip link.
- [ ] **Single-purpose statement:** "Archives Chrome tab groups as Markdown notes in Obsidian and as bookmark folders."
- [ ] **Permission justifications**, one sentence each: `tabs`, `tabGroups`, `storage`, `clipboardWrite`, `contextMenus`, `bookmarks`.

## 5. Accounts

- [ ] Dedicated personal Google account for publishing (the developer email can't be changed later).
- [ ] Chrome Web Store developer registration, one-time $5 fee.
- [ ] Support email set on the account (can be the same account).
- [ ] GitHub repo public, with LICENSE, README, PROPOSAL, TESTING, LAUNCH, and the privacy page.
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
