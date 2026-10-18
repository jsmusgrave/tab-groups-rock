# Manual test plan

Run this against a fresh `npm run build` whenever the save flow, the popup, or `collect.ts` changes. Record results in the table at the bottom and commit it with the change, so the next person knows what was last verified.

Build under test: `a898186` (source unchanged through `36474bc`) · Chrome: 155.0.8059.84 · Date: 2026-10-18

## Setup

1. `npm run build`, then in `chrome://extensions` click the reload icon on the Tab Groups Rock card (or Load unpacked → `dist/` the first time).
2. Obsidian is open with the test vault loaded. Do not use a real vault.
3. Extension settings: vault name set to the test vault's exact name, folder `Tab Groups/`, **Skip pinned tabs off**, **List restricted pages on**.
4. One Chrome window containing:
   - Group **Alpha**, any color, 3 tabs
   - Group **Beta**, any color, 2 tabs
   - 2 ungrouped tabs
   - 1 pinned, ungrouped tab
5. Clear `Tab Groups/` in the test vault so new notes are easy to spot.

## Cases

Each case starts from the setup state unless it says otherwise. "Note arrived" means a new file in `Tab Groups/` whose body lists the expected tabs as Markdown links.

| # | Case | Steps | Expected |
|---|---|---|---|
| 1 | Single group | From a tab in Alpha, open the popup. Click **Add to Obsidian**. Allow Chrome's "Open Obsidian?" prompt. | Alpha was pre-checked. A save tab opened. Note arrived with Alpha's 3 tabs. Save tab closed on its own once Obsidian took focus. |
| 2 | Cancelled prompt | As 1, but cancel the prompt. | Save tab stays open showing **Close now**. No note. Nothing closed. Close now closes the save tab. |
| 3 | Two groups | Open the popup from Alpha. Check Alpha and Beta. Add to Obsidian, allow the prompt. | Alpha's note arrives. Save page lists both notes, Alpha marked Sent, and shows **Send next: Beta**. Click it; allow the prompt if shown. Beta's note arrives. Page shows **Done**. |
| 4a | Close after saving, keep | Open the popup from Alpha. Tick **Close group after saving**. Save, allow the prompt. | After sending, page shows **Close 3 tabs** and **Keep tabs**. Click Keep. Save tab closes; Alpha's tabs are still open. |
| 4b | Close after saving, close | As 4a, click **Close 3 tabs**. | Alpha's tabs close. Save tab closes. Beta and the loose tabs are untouched. |
| 5 | Ungrouped with pinned tab | Settings: turn **Skip pinned tabs on**. From a loose (unpinned) tab, open the popup. | Nothing is pre-checked (window has real groups). Check **Ungrouped tabs**, tick close, save, allow, click Close. Note lists the 2 loose tabs only. The pinned tab is still open. Turn skip-pinned back off. |
| 6 | Context menu | Right-click the page in a Beta tab → **Save this tab's group to Obsidian**. | Save page opens directly, no popup. Beta's note arrives. |
| 7 | Restricted page | Open `chrome://settings` and drag it into Alpha. Save Alpha. | Note has the 3 normal tabs as links and a **Not archived** section listing the `chrome://settings` URL. |
| 8 | Awkward title | Rename Alpha to `yes`. Open a GitHub issue page (title contains `]`) in Alpha. Save Alpha. | Frontmatter shows `title: "yes"` with quotes. The GitHub link renders as a clickable link in Obsidian reading view, with the brackets visible in the text. |
| 9 | Saved group leftover | Recent Chrome saves every group automatically (the group bubble shows **Close group** and **Delete group**, no Save toggle). Archive Beta with close ticked, click Close. | Tabs close. Then open the Chrome menu (⋮) → **Tab groups**: is Beta still listed? Record yes or no in Notes; either answer is useful. |
| 10 | No vault configured | Clear the vault name in settings. Open the popup. | A notice with a settings link is shown. Add to Obsidian reports an error instead of opening the save page. Restore the vault name afterwards. |

## Things to note while testing

- Does Chrome prompt "Open Obsidian?" on every send, or only until you tick "Always allow"? Either is fine; record which.
- How long after allowing the prompt does the note appear when Obsidian was already open? When it had to launch?
- Anything in the save page or popup that was confusing, even if it worked.

## Results

| # | Result | Notes |
|---|---|---|
| 1 | pass |  |
| 2 | pass |  |
| 3 | pass |  |
| 4a | pass |  |
| 4b | pass |  |
| 5 | pass |  |
| 6 | pass |  |
| 7 | pass |  |
| 8 | pass |  |
| 9 | pass | Leftover entry under Chrome menu → Tab groups: _not recorded_ |
| 10 | pass |  |

Result values: **pass**, **fail**, **skip**. Put what you actually saw in Notes for anything other than pass.
