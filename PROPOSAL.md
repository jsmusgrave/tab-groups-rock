# Tab Groups Rock — Proposal and Working Plan

*Last revised 2026-09-22. A first build exists in `src/` and single-group saving works end to end in Chrome. §0 is the decision record, §11 is what to do next, §12 is the open issues list, §13 is the history. The rest is design and rationale, written to match the current build.*

## 0. Decisions

| Date | Decision |
|---|---|
| 2026-09-11 | Chrome Web Store first. Firefox and Edge deferred. |
| 2026-09-11 | Delivery uses Obsidian's own mechanism only: `obsidian://new` with the note body passed via clipboard, URI fallback. No REST plugin in v1. |
| 2026-09-11 | Localize from the start with `_locales`, ship English only. *(Not yet implemented, see §12.)* |
| 2026-09-11 | Name: **Tab Groups Rock** (§10). |
| 2026-09-20 | Free, MIT, public repo. A closed-source paid fork later is permitted (§8). |
| 2026-09-20 | One note per save is the default. Default folder `Tab Groups/`, configurable. |
| 2026-09-20 | Close group after saving: off by default, remembered. Always asks before closing (2026-09-22). |
| 2026-09-20 | Skip pinned tabs and list restricted pages under "Not archived", both as settings. |
| 2026-09-20 | Keyboard shortcut `Cmd+Shift+G` / `Ctrl+Shift+G`. No favicons. Local stats and history (not yet built). |
| 2026-09-20 | Group selection is explicit: the popup lists every group, the user checks any set, one note per checked row. |
| 2026-09-22 | Ungrouped tabs can be saved as a virtual group row. Pre-checked only when the window has no real groups. |
| 2026-09-22 | Delivery runs in a dedicated extension tab (`save.html`), not the popup or service worker (§4). |
| 2026-09-22 | Several notes are sent one per **Send next** click, not on a timer. |
| 2026-09-22 | Restore-data JSON callout stays in the default template. |
| 2026-09-22 | **Clipboard courtesy removed** along with the `clipboardRead` permission. The install warning it caused outweighed the convenience. Could return via `optional_permissions` (§9). |
| 2026-09-22 | Build with esbuild, no polyfill, no webpack. Chrome-only makes the Clipper's multi-browser toolchain unnecessary. |

Deferred until publishing: developer identity and trader declaration (§8), icon.

## 1. Goal

A browser extension that archives a **tab group** as a **note in an Obsidian vault**: one link per tab, plus metadata, so the group can be closed without losing it. Built as a public product in the mold of the official Obsidian Web Clipper, so that Obsidian users find it familiar and reviewers find it trustworthy.

Non-goals for v1: clipping page content, continuous sync, Safari, Firefox.

## 2. The Obsidian Web Clipper as reference

Source studied: `obsidianmd/obsidian-clipper` at commit `a9d33ce` (2026-09-03), v1.7.1, MIT. ~23k lines of TypeScript; the bulk is content extraction, highlighting, reader view, and an LLM "interpreter". The part we care about, delivering a note to Obsidian, is about 100 lines.

### 2.1 How it gets a note into Obsidian

No file writing, no REST. The Clipper builds an `obsidian://new` URI and navigates the current tab to it from the background script. The OS protocol handler launches or focuses Obsidian.

Content delivery is two-channel to dodge URI length limits:

1. Write the full markdown to the **clipboard**.
2. Send `obsidian://new?file=<path>&vault=<name>&clipboard&content=<error message>`. The `clipboard` flag tells Obsidian to read the note body from the clipboard; `content` is shown only if clipboard access fails.
3. If the clipboard write fails, fall back to `&content=<full markdown>` in the URI.
4. A **Legacy mode** setting forces the URI-only path.

Other URI parameters: `append=true`, `prepend=true`, `overwrite=true`, `silent=true`, and `obsidian://daily?` for daily-note behaviors. The main button can be switched to **Save file** (download) or **Copy to clipboard**.

### 2.2 Vault handling

Vault discovery is impossible from a browser, so the user **types vault names** in settings. The popup shows a vault dropdown only when more than one is configured and remembers the last selection.

### 2.3 Templates

Templates are JSON objects `{name, behavior, noteNameFormat, path, noteContentFormat, properties[], vault?}` stored in `browser.storage.sync`, with import/export as `.json`. Rendering uses **knap** (`obsidianmd/knap`, MIT), Obsidian's own template engine: `{{var|filter}}`, `{% if %}`, `{% for x in list %}`, `{% set %}`. It is an AST interpreter with no `eval`, so it runs under the extension CSP. We use knap so a user's templates read like their Clipper templates.

Frontmatter is generated from a typed `properties[]` list (text, multitext, number, checkbox, date, datetime) so the YAML is correct.

### 2.4 What we took and what we didn't

Taken: the delivery mechanism, typed vault names, knap, typed frontmatter, the popup shape (picker, folder field, primary button), a full-tab settings page, MIT.

Not taken: webpack and per-browser manifests (Chrome-only), `webextension-polyfill`, content scripts, `<all_urls>` host permissions, `scripting`, `declarativeNetRequest`, `activeTab`, Defuddle, DOMPurify, side panel, Safari Xcode wrapper. Our extension reads tab metadata only, so the permission set is small.

## 3. Browser support

`tabGroups` API availability (MDN browser-compat-data, checked 2026-09-11): Chromium browsers since Chrome 89; Firefox desktop since 139; not on Firefox for Android or any Safari. v1 targets Chromium. Firefox later needs MV3 `background.scripts` instead of `service_worker`, a `browser_specific_settings.gecko` block, and the AMO `data_collection_permissions` declaration.

## 4. Delivery design

### 4.1 The save page

The hand-off to Obsidian runs in a dedicated extension tab, `save.html`, not in the popup and not in the service worker. Reasons, each learned the hard way (§13):

- The popup dies as soon as Obsidian takes focus, so anything that must happen after the first launch (a second note, closing tabs) cannot live there.
- The service worker has no clipboard access and can be suspended mid-timer.
- Chrome does not launch an external protocol from a background tab, and closing the launching tab on a timer kills Chrome's "Open Obsidian?" prompt if the user has not answered yet.

Flow: the popup (or context menu) collects the groups, renders the notes, stores them as a job in `chrome.storage.session`, and opens `save.html?job=<id>` as the active tab. The save page takes the job, writes the first note to the clipboard, and sets `location.href` to the `obsidian://new` URI. The page stays alive.

### 4.2 One note or several

- **Single note, no closing requested:** fire-and-forget. The page closes itself when Chrome loses focus (Obsidian took over). There is no timeout, since one could dismiss Chrome's prompt while the user is still reading it; a "Close now" button covers the cancelled-prompt case.
- **Otherwise:** the page stays open and lists every note with its status. Each note after the first is sent on a **Send next** click. This is deliberate even if Chrome would allow automatic launches: the clipboard must hold one note until Obsidian has read it, and a click is the only signal we have that the user saw it arrive.
- **After the last note**, if closing was requested: **Close N tabs** / **Keep tabs**. Nothing closes on a cancelled prompt or a timeout. Groups sent through the `content=` fallback are never offered for closing, because the note may have been cut short.

### 4.3 Writers

The URI writer is the only one built. It copies the Clipper's logic: clipboard first, `content` fallback. Legacy mode, `silent`, and the `append`/`prepend`/`overwrite` behaviors are not yet exposed. **Save file** and **Copy to clipboard** are planned as secondary actions (§11).

The Local REST API writer stays deferred to v1.1. It is the only way to confirm a note was actually written, which would make close-after-save safe without a prompt.

### 4.4 Known limits of the mechanism

- The note-arrived signal is a guess. Focus loss means Obsidian opened, not that it wrote the file.
- The user's clipboard is overwritten. This is the Clipper's behavior too. Restoring it needs `clipboardRead`, which adds "Read data you copy and paste" to the install warning, so it was removed.
- Chrome prompts "Open Obsidian?" the first time, and each time until the user ticks "Always allow". Onboarding should say so.

## 5. Note design

Default template (knap syntax). Templates are hard-coded in `src/lib/render.ts` for now; user-editable templates are on the list (§11).

**Note name:** `{{ group.title }} - {{ date | date:"YYYY-MM-DD HHmm" }}`
**Folder:** `Tab Groups/`
**Properties:** `title` (text), `type: tab-group`, `color`, `tab-count` (number), `saved` (datetime), `tags: [tab-group]`

**Body:**
```twig
Saved {{ date | date:"MMMM D, YYYY h:mm A" }} from a {{ group.color }} group with {{ tabs | length }} tabs.

{% for tab in tabs %}
- [{{ tab.title }}]({{ tab.url }}) — {{ tab.domain }}
{% endfor %}
{% if skipped %}

## Not archived
{% for tab in skipped %}
- `{{ tab.url }}`
{% endfor %}
{% endif %}

> [!info]- Restore data
> ```json
> {{ restoreJson }}
> ```
```

Verified in knap 0.6.0: the `date` filter formats in local time, values are not HTML-escaped, and an empty list is falsy in `{% if %}` (the earlier draft's `skipped | length > 0` is not valid knap syntax).

Variables: `group.title`, `group.color`, `group.colorHex`, `group.collapsed`, `group.isUngrouped`, `window.title`, `tabs[]` (`title`, `url`, `domain`, `pinned`, `index`), `skipped[]`, `date`, `time`, `browser`, `restoreJson`.

Definitions: `tabs` is the group's tabs minus exclusions, with `[`, `]`, and `\` escaped in `title` so link text cannot break the Markdown link (the raw title is in `restoreJson`). `skipped` holds tabs with restricted URLs (`chrome://`, `chrome-extension://`, `edge://`, `about:`, `file://`, the Web Store) when that setting is on. Pinned tabs, when that setting is on, are dropped silently. `restoreJson` is `{"v":1,"title","color","tabs":[{"url","title"}]}`, pretty-printed with every line prefixed for the callout. For the ungrouped virtual group, `group.title` is the active tab's title (Chrome has no window title), `group.color` is empty, and `group.isUngrouped` is true.

## 6. User experience

**Popup:**

1. Header with settings gear. A notice with a settings link when no vault is configured.
2. Group picker: every group in the current window as a checkbox row with color swatch, title, and tab count, plus an **Ungrouped tabs** row when the window has any. The active tab's group is pre-checked. An ungrouped active tab pre-checks the Ungrouped row only when the window has no real groups; otherwise nothing is pre-checked, since the active tab is usually just the page the popup was opened from.
3. Folder field and **Close group after saving** checkbox, both remembered.
4. **Add to Obsidian**. The popup renders the notes, opens the save page, and closes.

Planned, not built: template dropdown, editable note name and properties when exactly one row is checked (read-only preview when several), vault dropdown when more than one vault, a "more" menu with Save file and Copy to clipboard.

**Save page:** note list with per-note status, **Send next**, **Close N tabs** / **Keep tabs** or **Done**, and **Close now** in the fire-and-forget case.

**Context menu:** "Save this tab's group to Obsidian". Collects and renders in the service worker, then opens the save page. On an ungrouped tab it saves the ungrouped set. With no vault configured it opens settings.

**Keyboard:** `Cmd+Shift+G` / `Ctrl+Shift+G` opens the popup. There is no silent quick-save; the service worker cannot reach the clipboard, and the save page needs to be visible anyway.

**Settings page:** vault name, default folder, skip pinned tabs, skip restricted URLs. Auto-saves. Planned: templates with import/export, property types, stats and history, about page.

## 7. Architecture

```
build.mjs                       esbuild: bundles background/popup/options/save, copies html/css/icons to dist/
manifest.chrome.json
icons/                          icon.svg source plus 16/32/48/128 PNGs
src/
  background.ts                 context menu only: collect + render, then start a save job
  popup.html / popup.ts / popup.css   group picker; starts a save job, then closes
  save.html / save.ts           delivers a save job: clipboard, obsidian:// launch, Send next, close confirmation
  options.html / options.ts     settings
  lib/
    types.ts                    TabInfo, GroupSnapshot, Settings, RenderedNote, SaveJob
    collect.ts                  tabGroups + tabs → GroupSnapshot[] (pure given the Chrome API results)
    render.ts                   knap engine + templates → RenderedNote
    frontmatter.ts              typed YAML frontmatter
    filename.ts                 sanitizeFileName
    storage.ts                  typed settings in storage.sync
    job.ts                      startSaveJob / takeSaveJob via chrome.storage.session
    clipboard.ts                writeClipboard with execCommand fallback
    writers/uri.ts              buildObsidianUri
```

Permissions: `tabs`, `tabGroups`, `storage`, `clipboardWrite`, `contextMenus`. No host permissions, no content scripts.

Added 2026-10-18: `src/_locales/en/messages.json` with `src/lib/i18n.ts`, Vitest tests under `src/lib/__tests__/`, `THIRD_PARTY_NOTICES.md`, and zip output from the build. Not yet present: CI, `docs/`.

## 8. Publishing and product considerations

- **Chrome Web Store:** one-time $5 developer fee. Needs a hosted privacy policy, the Privacy tab data disclosures, and a single-purpose description. Policies enforced from 2026-08-01 require prominent disclosure of any data collection; ours is "reads titles and URLs of tabs in the groups you choose, sends them only to Obsidian on your device, no analytics". The `tabs` permission shows a "Read your browsing history" warning at install; the listing should explain why.
- **Publishing identity:** the store shows a free-text publisher name independent of GitHub. The registering Google account is permanent (developer email cannot change), so use a dedicated or LLC-domain account if a paid fork under the same account is the plan. The EU Digital Services Act requires a trader / non-trader declaration; trader status means public contact details in the EU, where an LLC address helps. Support email and privacy policy URL are required; GitHub Pages on the repo hosts the policy for free.
- **Trademark:** the Obsidian name, logo, and app icon are trademarks; the Clipper's MIT license excludes them. The product name contains no "Obsidian"; mention it only in descriptions. Original icon, no gem.
- **Licensing:** MIT. A closed-source paid fork later is permitted; MIT does not bind the copyright holder, and outside contributions can be included in proprietary builds as long as their notices stay. The public version stays forkable forever, so the name is the lever. Dependencies: knap (MIT). A THIRD_PARTY_NOTICES file is needed only if Clipper code is ported verbatim; the current `frontmatter.ts` and `filename.ts` are original.
- **Privacy story:** no servers, no accounts, no host permissions, no content scripts, no clipboard reading. Say so on the listing.

## 9. Roadmap after v1

1. **Bookmark folder destination.** Write each archived group as a bookmark folder under `Archived groups / YYYY-MM`. Chrome's own "Open all in new tab group" on a folder restores it natively, so this is a complete archive-and-restore loop that works without Obsidian. Decided 2026-09-28 to make it first-class, since Chrome's saved groups never leave the working set and the user had forty of them. Costs the `bookmarks` permission ("Read and change your bookmarks"). About thirty lines.
2. **Paste-to-restore.** A field in the popup that accepts the note's JSON block and rebuilds the group. No permissions, no hosting.
3. **Restore link in the note.** An https link to a static page (GitHub Pages) with the group JSON in the URL fragment; the page talks to the extension via `externally_connectable` and the extension rebuilds the group. Without the extension the page shows plain links. Verified 2026-09-28: Chrome opens `chrome-extension://` pages from outside, but macOS has no handler for that scheme, so a link in Obsidian must be https. Needs the stable Web Store extension ID.
4. **Local REST API writer.** Confirms writes, enables append-to-heading, makes close-after-save safe without a prompt, and lets the popup list archived groups for restore.
5. **Clipboard courtesy** behind `optional_permissions`, restoring on focus return rather than a timer.
6. **Save a window as one note.**
7. **Auto-offer on group removal** using a shadow copy of groups in `storage.session`.
8. **Firefox** (139+) and **Edge** listings.
9. **Template directory** of community templates.

Known limit (confirmed 2026-10-18 on Chrome 155): there is no extension API to delete one of Chrome's saved groups, and recent Chrome saves every group automatically. Closing a group's tabs through the extension leaves its entry under the Chrome menu's Tab groups; the user removes it with Delete group there. The save page tells them so after closing.

## 10. Naming

Constraints: no "Obsidian" in the product name (trademark, and the Clipper's license excludes it); the Chrome Web Store has removed "X for Brand" names with no distinctive branding; taken names on the store include TabVault, TabGroup Vault, Tab Shelf, Tab Archive, Tab Group Archiver, Tab Group Saver, Keep Tabs.

Decision: **Tab Groups Rock**. It names the subject rather than the action, so save, restore, and later features all fit; it keeps "tab groups" in the name for store search; the Obsidian-is-a-rock pun is free and can be spent lightly in the UI. Short description: "Save a Chrome tab group as a Markdown note in Obsidian, with a link to every tab." Runners-up: Groupnote, Petrify. Do a USPTO search before the listing goes live.

## 11. What to do next

Order chosen so each step is testable on its own.

1. Test the current build in Chrome: single group, several groups with Send next, context menu, close confirmation, cancelled prompt (§12 item 1).
2. `_locales/en/messages.json`, `default_locale`, `__MSG_` in the manifest, `data-i18n` in the three HTML pages. Decided from the start; cheapest now.
3. Tests with Vitest for `collect` (given fake tab arrays), `render`, `frontmatter`, `filename`. The knap checks in §5 are the first cases.
4. Secondary actions: **Save file** (download) and **Copy to clipboard**, plus a setting for which is primary.
5. Multiple vaults with a popup dropdown, and editable note name when one row is checked.
6. User-editable templates with import/export and property types. The largest remaining surface.
7. Stats and history, about page.
8. Store assets: real icon, screenshots, privacy policy on GitHub Pages, listing copy, a GitHub Action that builds and zips `dist/`.

## 12. Things to address

From the 2026-09-22 code review. Items 1–6 were fixed the same day (§13); what remains:

1. ~~Not yet tested in Chrome.~~ Full `TESTING.md` pass on 2026-10-18, Chrome 155, all cases pass. The saved-group leftover is confirmed (§9).
2. **Unverified assumptions** carried from the debugging session: Chrome blocks external-protocol launches from inactive tabs; `execCommand('copy')` works in an unfocused extension page with `clipboardWrite`; focus loss reliably means Obsidian took over. None blocks shipping, but the second is the fallback path when `navigator.clipboard` is unavailable and has not been exercised.
3. **`{% if skipped %}` is correct as written.** The original draft's `skipped | length > 0` is not valid knap; noted so nobody "fixes" it back.
4. **Rendering in the service worker.** The context-menu path bundles knap into `background.js` (~100 KB minified). Acceptable; revisit only if worker start-up becomes noticeable.

Fixed 2026-09-22, verified by bundling the pure modules and running them in Node:

- Close-after-save now closes only tabs that appear in the note (kept or listed as skipped); pinned tabs dropped by the skip-pinned setting are never closed.
- The fire-and-forget timeout is gone; the save tab closes on focus loss or via "Close now".
- `[`, `]`, and `\` are escaped in tab titles before they reach the link template.
- The popup's ungrouped row is labelled "Ungrouped tabs".
- Frontmatter quotes any text value that YAML would read as a boolean, null, number, or date.
- Production builds are minified; bundles went from ~200 KB to ~100 KB each.

## 13. History

The design moved during the first build. Kept so later sessions can see why.

**Original plan (2026-09-11):** URI + clipboard hand-off from the popup or background, like the Clipper; a `NoteWriter` interface with URI, file, clipboard, and REST implementations; webpack + polyfill toolchain; clipboard courtesy on a timer; Firefox and Edge at launch.

**Debugging session (2026-09-22)** picked up the first build, which had stopped working. Bugs found and fixed, in order:

1. No note created. The URI was opened with `tabs.create({active: false})` and the tab removed on a 1.5 s timer. Chrome does not launch an external protocol from a background tab.
2. The "Open Obsidian?" prompt vanished unless clicked quickly, because the tab was still removed on a timer.
3. Cancelling the prompt left the tab open; a service-worker fallback timer was cut short by worker suspension.
4. The Ungrouped row was always pre-checked, because the virtual id (-1) equals `TAB_GROUP_ID_NONE` and the test page (`chrome://extensions`) is ungrouped.
5. Close-after-save did nothing, because the popup that owned the close was gone, and when it ran it could close the tab hosting the prompt.
6. Multi-group save, clipboard restore, and the context menu were fragile for the same root cause as 5: work that must outlive the popup ran in the popup.

Fixes 1–5 were verified in Chrome as interim changes (commit `80ca528`, close confirmation in `db1597d`). Fix 6 became the save page (`1b09e89`), which replaced an interim self-closing launcher page and has not yet been tested as a whole.

**Code review (2026-09-22)** found the issues in §12, removed clipboard courtesy and the `clipboardRead` permission, and fixed the six code-level findings the same day.

## Sources

- Obsidian Web Clipper source: https://github.com/obsidianmd/obsidian-clipper
- Web Clipper docs: https://help.obsidian.md/web-clipper
- knap template engine: https://github.com/obsidianmd/knap
- Obsidian URI reference: https://obsidian.md/help/Extending+Obsidian/Obsidian+URI
- Chrome `tabGroups` API: https://developer.chrome.com/docs/extensions/reference/api/tabGroups
- Chrome `tabs` API: https://developer.chrome.com/docs/extensions/reference/api/tabs
- Firefox tab groups WebExtensions support: https://blog.mozilla.org/addons/2025/04/30/webextensions-support-for-tab-groups/
- MDN browser-compat-data: https://github.com/mdn/browser-compat-data/tree/main/webextensions/api
- Chrome Web Store 2026 policy updates: https://developer.chrome.com/blog/cws-policy-updates-2026
- Obsidian Local REST API: https://github.com/coddingtonbear/obsidian-local-rest-api
- Prior art: https://github.com/cgranier/tabSidian, https://github.com/DivisionSt/tabs2markdown
