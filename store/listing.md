# Chrome Web Store listing

Copy for the developer dashboard. Each block is pasted as-is. The store shows the detailed description as plain text: line breaks are kept, Markdown is not rendered.

## Store listing tab

**Name** comes from the manifest: Tab Groups Rock.

**Short description** (114 of 132 characters; comes from the manifest's `extensionDescription` message, so change it there too if you change it here):

```
Archive tab groups as Markdown notes in Obsidian, with a link to every tab, then close them and clear the clutter.
```

**Category:** Workflow & Planning (alternative: Tools).

**Language:** English.

**Detailed description:**

```
Too many tab groups? Tab Groups Rock archives them to Obsidian.

Pick one or more tab groups, click Add to Obsidian, and each group becomes a Markdown note in your vault: the group's name and color in the note's properties, and a link to every tab. Then close the tabs and get your browser back.

HOW IT WORKS
• Click the toolbar button or press Cmd+Shift+G (Ctrl+Shift+G on Windows and Linux).
• Tick the groups you want to archive. Loose tabs that aren't in a group can be archived too.
• Optionally tick "Close group after saving". You're always asked before any tab is closed.
• Or right-click any page and choose "Save this tab's group to Obsidian".

The note is handed to Obsidian the same way the official Obsidian Web Clipper does it: the note goes on your clipboard and Obsidian opens to create it. No Obsidian plugin, no server, no account. Requires the Obsidian desktop app, version 1.7.2 or later.

BOOKMARK FOLDERS, TOO
Each archived group is also saved as a Chrome bookmark folder under Other bookmarks › Archived groups, sorted by month. To bring a group back, right-click its folder and choose "Open all in new tab group". You can turn this off in settings.

NO OBSIDIAN? NO PROBLEM
The menu next to the main button can download each group as a Markdown file or copy it to the clipboard instead.

GOOD TO KNOW
• Chrome keeps its own list of saved groups under the Chrome menu › Tab groups. Extensions can't remove entries from it, so after archiving, use Delete group there if you want the entry gone.
• Pinned tabs can be skipped, and browser-internal pages (like chrome:// pages) are listed under "Not archived" in the note. Both are settings.

PRIVACY
Tab Groups Rock collects nothing and sends nothing anywhere. It reads only the titles and addresses of the tabs in the groups you choose, never page content. Chrome describes the tabs permission as "Read your browsing history" because it's the permission that lets an extension see tab addresses. That's the only reason it's requested.
Privacy policy: https://mugsy.io/tab-groups-rock/privacy

Free and open source (MIT): https://github.com/jsmusgrave/tab-groups-rock

Obsidian is a trademark of Dynalist Inc. Tab Groups Rock is not affiliated with or endorsed by Obsidian.
```

If a tip link is added later, put it on its own line after the open-source line, for example `Enjoying it? Buy me a coffee: <link>`.

**Graphic assets:**

- Store icon: `icons/icon128.png`
- Small promo tile: `store/promo-tile-440x280.png`
- Marquee promo tile (optional, used only if the store features the extension): `store/marquee-tile-1400x560.png`
- Screenshots (1280×800, upload in this order): `docs/screenshots/1-popup.png`, `2-save-page.png`, `3-obsidian-note.png`, `4-bookmarks.png`

**Additional fields:**

- Official URL: none (it requires a verified site in Google Search Console; leave blank).
- Homepage URL: `https://github.com/jsmusgrave/tab-groups-rock`
- Support URL: `https://github.com/jsmusgrave/tab-groups-rock/issues`

## Privacy practices tab

**Single purpose:**

```
Tab Groups Rock archives the browser's tab groups: it saves a chosen group's tab titles and links as a Markdown note in the user's Obsidian vault and, optionally, as a Chrome bookmark folder, then offers to close the tabs.
```

**Permission justifications:**

`tabs`

```
Reads the titles and URLs of the tabs in the groups the user chooses, so they can be written into the archive note, and closes those tabs when the user confirms. Page content is never read.
```

`tabGroups`

```
Lists the window's tab groups with their names and colors so the user can choose which to archive, and records the name and color in the note.
```

`storage`

```
Stores the user's settings (vault name, default folder, options) in sync storage, a first-run flag in local storage, and the note being sent in session storage while the save page hands it to Obsidian.
```

`clipboardWrite`

```
Places the note on the clipboard so Obsidian can create it through its obsidian://new link with the clipboard parameter, the same hand-off the official Obsidian Web Clipper uses. Also used by the Copy to clipboard action. The clipboard is never read.
```

`contextMenus`

```
Adds a "Save this tab's group to Obsidian" item to the page's right-click menu.
```

`bookmarks`

```
Writes each archived group as a bookmark folder under Other bookmarks / Archived groups, so the user can reopen it later with Chrome's "Open all in new tab group". Existing folder names are read only to avoid duplicates. Can be turned off in settings.
```

**Remote code:** No, I am not using remote code. All code is bundled in the package.

**Data usage:** tick none of the data categories. The extension handles tab titles and URLs only on the user's device and never transmits them, so nothing is "collected" in the store's sense. Then tick all three certifications:

- I do not sell or transfer user data to third parties, outside of the approved use cases.
- I do not use or transfer user data for purposes that are unrelated to my item's single purpose.
- I do not use or transfer user data to determine creditworthiness or for lending purposes.

**Privacy policy URL:** `https://mugsy.io/tab-groups-rock/privacy`

## Distribution tab

- Visibility: Public.
- Regions: All regions.
- Trader status: non-trader, as decided in `LAUNCH.md`.
