import type { GroupSnapshot, Settings, TabInfo } from './types';

const COLOR_HEX: Record<string, string> = {
	grey: '#5f6368',
	blue: '#1a73e8',
	red: '#d93025',
	yellow: '#f9ab00',
	green: '#188038',
	pink: '#d01884',
	purple: '#a142f4',
	cyan: '#12b5cb',
	orange: '#fa903e'
};

const RESTRICTED_PREFIXES = ['chrome://', 'chrome-extension://', 'edge://', 'about:', 'file://'];
const RESTRICTED_HOSTS = ['chromewebstore.google.com', 'chrome.google.com'];

export function isRestrictedUrl(url: string): boolean {
	if (RESTRICTED_PREFIXES.some((prefix) => url.startsWith(prefix))) return true;
	try {
		const host = new URL(url).hostname;
		return RESTRICTED_HOSTS.includes(host);
	} catch {
		return true;
	}
}

function domainOf(url: string): string {
	try {
		return new URL(url).hostname;
	} catch {
		return '';
	}
}

function toTabInfo(tab: chrome.tabs.Tab): TabInfo {
	return {
		title: tab.title ?? tab.url ?? 'Untitled',
		url: tab.url ?? '',
		domain: domainOf(tab.url ?? ''),
		pinned: tab.pinned ?? false,
		index: tab.index
	};
}

interface Partition {
	tabs: TabInfo[];
	skipped: TabInfo[];
	// Tabs that appear in the note (kept or listed as skipped). Only these may
	// be closed afterwards; tabs dropped by the skip-pinned setting are not.
	closableTabIds: number[];
}

function partitionTabs(tabs: chrome.tabs.Tab[], settings: Settings): Partition {
	const kept: TabInfo[] = [];
	const skipped: TabInfo[] = [];
	const closableTabIds: number[] = [];
	for (const tab of tabs) {
		if (settings.skipPinnedTabs && tab.pinned) continue;
		if (tab.id !== undefined) closableTabIds.push(tab.id);
		const url = tab.url ?? '';
		if (settings.skipRestrictedUrls && isRestrictedUrl(url)) {
			skipped.push(toTabInfo(tab));
			continue;
		}
		kept.push(toTabInfo(tab));
	}
	return { tabs: kept, skipped, closableTabIds };
}

export async function collectGroups(windowId: number, settings: Settings): Promise<GroupSnapshot[]> {
	const [groups, allTabs] = await Promise.all([
		chrome.tabGroups.query({ windowId }),
		chrome.tabs.query({ windowId })
	]);

	const windowTitle = allTabs.find((tab) => tab.active)?.title ?? `Window ${windowId}`;
	const snapshots: GroupSnapshot[] = [];

	for (const group of groups) {
		const groupTabs = allTabs.filter((tab) => tab.groupId === group.id).sort((a, b) => a.index - b.index);
		const { tabs, skipped, closableTabIds } = partitionTabs(groupTabs, settings);
		snapshots.push({
			id: group.id,
			title: group.title || '(untitled group)',
			color: group.color,
			colorHex: COLOR_HEX[group.color] ?? '#5f6368',
			collapsed: group.collapsed,
			isUngrouped: false,
			windowTitle,
			tabs,
			skipped,
			allTabIds: closableTabIds
		});
	}

	const ungroupedTabs = allTabs
		.filter((tab) => tab.groupId === chrome.tabGroups.TAB_GROUP_ID_NONE)
		.sort((a, b) => a.index - b.index);

	if (ungroupedTabs.length > 0) {
		const { tabs, skipped, closableTabIds } = partitionTabs(ungroupedTabs, settings);
		snapshots.push({
			id: -1,
			title: windowTitle,
			color: '',
			colorHex: '#9aa0a6',
			collapsed: false,
			isUngrouped: true,
			windowTitle,
			tabs,
			skipped,
			allTabIds: closableTabIds
		});
	}

	return snapshots;
}
