# Tab Groups Rock

Save a Chrome tab group as a Markdown note in [Obsidian](https://obsidian.md), with a link to every tab.

Chrome tab groups are great for organizing work, but there is no way to archive one. This extension turns a group (or a window's ungrouped tabs) into a note in your vault, then offers to close the tabs. Each note has typed frontmatter, one Markdown link per tab, and a collapsed JSON block so a future version can reopen the group.

**Status:** early development. Not yet on the Chrome Web Store. See [PROPOSAL.md](PROPOSAL.md) for the design, decisions, and what is still to do.

## How it works

The extension uses the same mechanism as the official Obsidian Web Clipper: the note is copied to the clipboard and Obsidian is opened with an `obsidian://new` link that tells it to read the note body from the clipboard. No plugins, no servers, no accounts. Obsidian must be installed; nothing else is required.

Permissions: `tabs` and `tabGroups` to read the titles and URLs of the tabs you choose, `storage` for settings, `clipboardWrite` for the hand-off, and `contextMenus` for the right-click item. There are no host permissions and no content scripts. The extension never reads page content and never sends anything anywhere except to Obsidian on your own machine.

## Install from source

```
npm install
npm run build
```

Then in Chrome open `chrome://extensions`, turn on **Developer mode**, click **Load unpacked**, and choose the `dist/` folder. Open the extension's settings and enter your vault name exactly as Obsidian shows it.

`npm run watch` rebuilds on change; reload the extension in `chrome://extensions` to pick up the new build.

## Usage

Click the toolbar icon (or press `Cmd+Shift+G` / `Ctrl+Shift+G`). Check the groups you want to save, optionally tick **Close group after saving**, and click **Add to Obsidian**. Chrome will ask permission to open Obsidian the first time. When saving several groups, each note after the first is sent with a **Send next** click so you can confirm the previous one arrived. If you asked to close tabs, you are asked to confirm after the last note is sent.

Right-clicking a page and choosing **Save this tab's group to Obsidian** saves that tab's group without opening the popup.

## Acknowledgements

The delivery mechanism and general shape follow the [Obsidian Web Clipper](https://github.com/obsidianmd/obsidian-clipper) (MIT). Templates are rendered with [knap](https://github.com/obsidianmd/knap), Obsidian's template engine. Obsidian is a trademark of Dynalist Inc.; this project is not affiliated with or endorsed by Obsidian.

## License

[MIT](LICENSE)
