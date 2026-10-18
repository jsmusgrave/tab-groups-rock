export interface TabInfo {
	title: string;
	url: string;
	domain: string;
	pinned: boolean;
	index: number;
}

export interface GroupSnapshot {
	id: number;
	title: string;
	color: string;
	colorHex: string;
	collapsed: boolean;
	isUngrouped: boolean;
	windowTitle: string;
	tabs: TabInfo[];
	skipped: TabInfo[];
	allTabIds: number[];
}

export interface Settings {
	vaultName: string;
	folder: string;
	skipPinnedTabs: boolean;
	skipRestrictedUrls: boolean;
	closeGroupAfterSaving: boolean;
	// Also write each archived group as a Chrome bookmark folder, which Chrome
	// can reopen as a group via "Open all in new tab group".
	writeBookmarks: boolean;
	// Which main-button action the popup uses.
	primaryAction: 'addToObsidian' | 'saveFile' | 'copyToClipboard';
}

export interface RenderedNote {
	fileName: string;
	folder: string;
	content: string;
}

export interface JobNote {
	groupTitle: string;
	note: RenderedNote;
	tabIds: number[];
	// Set when the group was also written as a bookmark folder, e.g.
	// "Archived groups/2026-10/Alpha". Shown on the save page.
	bookmarkPath?: string;
}

// A batch of rendered notes handed from the popup or context menu to the save
// page, which does the clipboard + obsidian:// hand-off (see save.ts).
export interface SaveJob {
	vaultName: string;
	closeAfterSaving: boolean;
	notes: JobNote[];
}
