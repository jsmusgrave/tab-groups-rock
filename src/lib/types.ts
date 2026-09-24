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
}

// A batch of rendered notes handed from the popup or context menu to the save
// page, which does the clipboard + obsidian:// hand-off (see save.ts).
export interface SaveJob {
	vaultName: string;
	closeAfterSaving: boolean;
	notes: JobNote[];
}
