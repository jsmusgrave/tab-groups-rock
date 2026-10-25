# Tab Groups Rock

[![CI](https://github.com/jsmusgrave/tab-groups-rock/actions/workflows/ci.yml/badge.svg)](https://github.com/jsmusgrave/tab-groups-rock/actions/workflows/ci.yml)

Save a Chrome tab group as a Markdown note in [Obsidian](https://obsidian.md), with a link to every tab.

Chrome tab groups are great for organizing work, but there is no way to archive one. This extension turns a group (or a window's ungrouped tabs) into a note in your vault, then offers to close the tabs. Each note has typed frontmatter, one Markdown link per tab, and a collapsed JSON block so a future version can reopen the group.

**Install:** [Chrome Web Store](https://chromewebstore.google.com/detail/tab-groups-rock/geblmpmngeddhbpiicggajafocffkdch) (extension ID `geblmpmngeddhbpiicggajafocffkdch`). More at [mugsy.io/tab-groups-rock](https://mugsy.io/tab-groups-rock/).

See [PROPOSAL.md](PROPOSAL.md) for the design and decisions, [TESTING.md](TESTING.md) for the manual test plan, and [LAUNCH.md](LAUNCH.md) for the launch checklist.

## How it works

The extension uses the same mechanism as the official Obsidian Web Clipper: the note is copied to the clipboard and Obsidian is opened with an `obsidian://new` link that tells it to read the note body from the clipboard. No plugins, no servers, no accounts. Obsidian must be installed; nothing else is required.

Permissions: `tabs` and `tabGroups` to read the titles and URLs of the tabs you choose, `storage` for settings, `clipboardWrite` for the hand-off, `contextMenus` for the right-click item, and `bookmarks` to also save each group as a bookmark folder. There are no host permissions and no content scripts. The extension never reads page content and never sends anything anywhere except to Obsidian on your own machine. Full details are in the [privacy policy](https://mugsy.io/tab-groups-rock/privacy).

## Install from source

```
npm install
npm run build
```

Then in Chrome open `chrome://extensions`, turn on **Developer mode**, click **Load unpacked**, and choose the `dist/` folder. Open the extension's settings and enter your vault name exactly as Obsidian shows it.

`npm run watch` rebuilds on change; reload the extension in `chrome://extensions` to pick up the new build. `npm test` runs the unit tests and `npm run typecheck` runs the compiler. A production `npm run build` also writes the store upload to `builds/tab-groups-rock-<version>.zip`.

User-facing strings live in `src/_locales/en/messages.json`. Translations are welcome: copy the folder to `src/_locales/<lang>/` and translate the `message` values.

## Usage

Click the toolbar icon (or press `Cmd+Shift+G` / `Ctrl+Shift+G`). Check the groups you want to save, optionally tick **Close group after saving**, and click **Add to Obsidian**. Chrome will ask permission to open Obsidian the first time. When saving several groups, each note after the first is sent with a **Send next** click so you can confirm the previous one arrived. If you asked to close tabs, you are asked to confirm after the last note is sent.

A single save with nothing to close hands the note to Obsidian and the save tab closes on its own. Turn off **Close the save page automatically** in settings to keep it open until you click Done.

Right-clicking a page and choosing **Save this tab's group to Obsidian** saves that tab's group without opening the popup.

The ▾ button next to the main button offers **Save file** (downloads one Markdown file per selected group) and **Copy to clipboard**. Neither needs Obsidian or a vault name. Settings lets you choose which of the three actions the main button performs.

When **Also save each group as a bookmark folder** is on in settings (the default), each archived group is also written as a Chrome bookmark folder under **Other bookmarks → Archived groups → *YYYY-MM* → *group title***. To reopen it as a tab group later, right-click that folder in the bookmarks bar or bookmark manager and choose **Open all in new tab group**.

Chrome keeps its own entry for every group under the Chrome menu's Tab groups, and no extension can remove it. After archiving, use Delete group there if you want it gone.

## Support

Bug reports and ideas are welcome in [GitHub Issues](https://github.com/jsmusgrave/tab-groups-rock/issues).

<!-- Tip link goes here once the account exists, e.g. "If it saves you some clutter, you can [buy me a coffee](<link>)." -->

## Acknowledgements

The delivery mechanism and general shape follow the [Obsidian Web Clipper](https://github.com/obsidianmd/obsidian-clipper) (MIT). Templates are rendered with [knap](https://github.com/obsidianmd/knap), Obsidian's template engine. Obsidian is a trademark of Dynalist Inc.; this project is not affiliated with or endorsed by Obsidian.

## License

[MIT](LICENSE)
