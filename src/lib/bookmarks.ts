import type { GroupSnapshot } from './types';

const ARCHIVE_ROOT_TITLE = 'Archived groups';

// Writes a group as a Chrome bookmark folder under
// "Other bookmarks / Archived groups / YYYY-MM / <title>", one bookmark per
// kept tab, in order. Returns the path relative to "Other bookmarks", e.g.
// "Archived groups/2026-10/Alpha".
export async function writeGroupBookmarks(group: GroupSnapshot): Promise<string> {
	const otherBookmarks = await findOtherBookmarksFolder();
	const archiveRoot = await getOrCreateFolder(otherBookmarks.id, ARCHIVE_ROOT_TITLE);
	const monthTitle = monthFolderTitle(new Date());
	const monthFolder = await getOrCreateFolder(archiveRoot.id, monthTitle);

	const baseTitle = group.isUngrouped ? `Ungrouped - ${group.title}` : group.title;
	const folderTitle = await uniqueFolderTitle(monthFolder.id, baseTitle);
	const groupFolder = await chrome.bookmarks.create({ parentId: monthFolder.id, title: folderTitle });

	for (const tab of group.tabs) {
		await chrome.bookmarks.create({ parentId: groupFolder.id, title: tab.title, url: tab.url });
	}

	return `${ARCHIVE_ROOT_TITLE}/${monthTitle}/${folderTitle}`;
}

// "Other bookmarks" is conventionally the root's second child, but we walk
// the tree instead of assuming its id, and fall back to the first non-root
// folder if the shape is ever different.
async function findOtherBookmarksFolder(): Promise<chrome.bookmarks.BookmarkTreeNode> {
	const tree = await chrome.bookmarks.getTree();
	const topLevel = tree[0]?.children ?? [];
	const second = topLevel[1];
	if (second && second.url === undefined) return second;
	const firstFolder = topLevel.find((node) => node.url === undefined);
	if (firstFolder) return firstFolder;
	throw new Error('Tab Groups Rock: no bookmarks folder found to archive into.');
}

async function getOrCreateFolder(parentId: string, title: string): Promise<chrome.bookmarks.BookmarkTreeNode> {
	const children = await chrome.bookmarks.getChildren(parentId);
	const existing = children.find((node) => node.url === undefined && node.title === title);
	if (existing) return existing;
	return chrome.bookmarks.create({ parentId, title });
}

// Never merges into an existing group folder: appends " (2)", " (3)", etc.
// until the title is free in the month folder.
async function uniqueFolderTitle(parentId: string, title: string): Promise<string> {
	const children = await chrome.bookmarks.getChildren(parentId);
	const taken = new Set(children.filter((node) => node.url === undefined).map((node) => node.title));
	if (!taken.has(title)) return title;
	let suffix = 2;
	while (taken.has(`${title} (${suffix})`)) suffix++;
	return `${title} (${suffix})`;
}

function monthFolderTitle(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	return `${year}-${month}`;
}
