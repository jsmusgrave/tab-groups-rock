# Manual test plan

Run this against a fresh `npm run build` whenever the save flow, the popup, or `collect.ts` changes. Record results in the table at the bottom and commit it with the change, so the next person knows what was last verified.

Builds under test (commit IDs as of the 2026-10-22 history rewrite):

- Cases 1–10: `c2ecee1` (source unchanged through `b522cf9`) · Chrome 155.0.8059.84 · 2026-10-18
- Case 11: `ae7f7d8` (save-page auto-close setting) · 2026-10-22
- Cases 1, 2, 6, 12 onward: the build that returns to the origin tab · 2026-10-22

## Setup

1. `npm run build`, then in `chrome://extensions` click the reload icon on the Tab Groups Rock card (or Load unpacked → `dist/` the first time).
2. Obsidian is open with the test vault loaded. Do not use a real vault.
3. Extension settings: vault name set to the test vault's exact name, folder `Tab Groups/`, **Skip pinned tabs off**, **List restricted pages on**, **bookmark folder on**, **Close the save page automatically on**, main button action **Add to Obsidian**. The first-run hint has already been dismissed with **Got it** (case 11 is the exception). In the popup, **Close group after saving unticked** (it is remembered between runs).
4. One Chrome window containing:
   - Group **Alpha**, any color, 3 tabs
   - Group **Beta**, any color, 2 tabs
   - 2 ungrouped tabs
   - 1 pinned, ungrouped tab
5. Clear `Tab Groups/` in the test vault so new notes are easy to spot, and delete `Other bookmarks → Archived groups` in `chrome://bookmarks` if it exists from an earlier run.

## Current retest (2026-10-22)

After the save-page auto-close change. Work top to bottom: case 11 needs a fresh install, so it goes first. Tick each box as you go and record the result in the table at the bottom.

- [x] **11.** First-run hint
- [x] **1.** Single group (retest: depends on the save tab closing on its own; now also returns to the tab you started from)
- [ ] **2.** Cancelled prompt (retest: depends on the save tab closing on its own)
- [ ] **6.** Context menu (retest: depends on the save tab closing on its own)
- [ ] **12.** Status wording
- [ ] **13.** Bookmark folder created
- [ ] **14.** Two groups, one archive folder
- [ ] **15.** Duplicate title does not merge
- [ ] **16.** Reopen via Chrome
- [ ] **17.** Bookmark folder off
- [ ] **18.** Close tabs, then Done
- [ ] **19.** Select all
- [ ] **20.** Save file
- [ ] **21.** Copy without a vault
- [ ] **22.** Main button action setting
- [ ] **23.** Keep the save page open
- [ ] **24.** Save from the middle of a group

## Cases

Each case starts from the setup state unless it says otherwise. "Note arrived" means a new file in `Tab Groups/` whose body lists the expected tabs as Markdown links.

| # | Case | Steps | Expected |
|---|---|---|---|
| 1 | Single group | From a tab in Alpha, open the popup. Click **Add to Obsidian**. Allow Chrome's "Open Obsidian?" prompt. | Alpha was pre-checked. A save tab opened. Note arrived with Alpha's 3 tabs. Save tab opened right next to the Alpha tab, and closed on its own once Obsidian took focus. Back in Chrome, the Alpha tab you started from is the active tab, not the last tab in the strip. |
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
| 11 | First-run hint | Remove the extension in `chrome://extensions` and load `dist/` again (this clears its stored data). Save Alpha. | A hint box below the heading explains Chrome's "Open Obsidian?" prompt and "Always allow". The note still sends automatically, and the save tab **stays open** with a **Done** button instead of closing on its own. Chrome's prompt itself appears only if "Always allow" was never ticked for this extension: Chrome remembers that choice across remove and reload, so only a fresh profile shows it again. Click **Got it**: the hint disappears. Click Done. Save Alpha again: no hint, and the save tab closes on its own. |
| 12 | Status wording | Save any group. | The note's row reads **Handed to Obsidian**, not "Sent". |
| 13 | Bookmark folder created | Save Alpha. | Note arrives. In `chrome://bookmarks`, **Other bookmarks → Archived groups → *YYYY-MM*** contains a folder **Alpha** with Alpha's 3 tabs as bookmarks in tab-strip order. The save page row shows a muted "Bookmarked to Archived groups/*YYYY-MM*/Alpha" line. |
| 14 | Two groups, one archive folder | Check Alpha and Beta, save, send both. | Exactly one **Archived groups** folder and one month folder exist (no duplicates), containing both **Alpha** and **Beta**. |
| 15 | Duplicate title does not merge | Save Alpha again in the same month. | A second folder **Alpha (2)** appears next to **Alpha**; the original is untouched. |
| 16 | Reopen via Chrome | In `chrome://bookmarks` right-click the **Alpha** folder → **Open all in new tab group**. | Chrome opens a new group containing Alpha's 3 tabs. |
| 17 | Bookmark folder off | Settings: turn the bookmark folder option off. Save any group. | Note arrives. No new folder appears under Archived groups, and the save page shows no "Bookmarked to" line. Turn it back on. |
| 18 | Close tabs, then Done | Open the popup from Alpha, tick close, save, allow, click **Close 3 tabs**. | Alpha's tabs close. The save tab stays open with "Tabs closed. Chrome still lists this group under the Chrome menu → Tab groups; use Delete group there if you want it gone." and a **Done** button. Done closes the save tab. |
| 19 | Select all | With 3+ rows, click **Select all**. | All rows check; the control shows checked. Click again: all uncheck. Check two of three rows by hand: the control shows the indeterminate (dash) state. |
| 20 | Save file | Check Alpha and Beta. Click ▾, choose **Save file**. | The menu lists Save file and Copy to clipboard only. Two `.md` downloads arrive (Chrome may ask to allow multiple downloads), no save tab opens, no tabs close, popup says "Saved 2 file(s)." Settings' main button action is unchanged. |
| 21 | Copy without a vault | Clear the vault name. Check one group, ▾ → **Copy to clipboard**. | No vault error. Popup says "Copied 1 note(s)." Pasting into a text editor gives that group's note. Restore the vault name. |
| 22 | Main button action setting | Settings → Popup → set main button to **Save file**. Reopen the popup. | The main button reads **Save file**; the ▾ menu offers Add to Obsidian and Copy to clipboard. Set it back to Add to Obsidian. |
| 23 | Keep the save page open | Settings → Behavior: turn **Close the save page automatically** off. Save Alpha (close unticked). | Note arrives. The save tab stays open with a **Done** button, and Alpha's tabs are untouched. Done closes the save tab. Turn the setting back on. |
| 24 | Save from the middle of a group | Click Alpha's **second** tab, open the popup, and save Alpha with **Close the save page automatically** off. | The save tab appears just after Alpha's tabs, outside the group (if Chrome briefly puts it in the group, it leaves at once). Alpha's group never shows the save tab once the page has loaded. Click **Done**: Alpha's second tab is active again. |

## Things to note while testing

- Does Chrome prompt "Open Obsidian?" on every send, or only until you tick "Always allow"? Either is fine; record which.
- How long after allowing the prompt does the note appear when Obsidian was already open? When it had to launch?
- Anything in the save page or popup that was confusing, even if it worked.

## Results

| # | Result | Notes |
|---|---|---|
| 1 | pass | Retested 2026-10-22: returns to the tab the save started from. |
| 2 | pass |  |
| 3 | pass |  |
| 4a | pass |  |
| 4b | pass |  |
| 5 | pass |  |
| 6 | pass |  |
| 7 | pass |  |
| 8 | pass |  |
| 9 | pass | Yes: after Close, the group is still listed under Chrome menu → Tab groups. The extension cannot remove it; the user must use Delete group there. |
| 10 | pass |  |
| 11 | pass | Validated on the build with the save-page auto-close setting. |
| 12 | | |
| 13 | | |
| 14 | | |
| 15 | | |
| 16 | | |
| 17 | | |
| 18 | | |
| 19 | | |
| 20 | | |
| 21 | | |
| 22 | | |
| 23 | | |
| 24 | | |

Result values: **pass**, **fail**, **skip**. Put what you actually saw in Notes for anything other than pass.
