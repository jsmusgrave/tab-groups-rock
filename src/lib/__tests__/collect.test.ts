import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Settings } from '../types';

const settings: Settings = {
	vaultName: 'v',
	folder: 'Tab Groups/',
	skipPinnedTabs: true,
	skipRestrictedUrls: true,
	closeGroupAfterSaving: false,
	writeBookmarks: false,
	closeSavePage: true,
	primaryAction: 'addToObsidian'
};

const NONE = -1;

function tab(id: number, index: number, url: string, groupId: number, extra: Partial<chrome.tabs.Tab> = {}): chrome.tabs.Tab {
	return { id, index, url, title: `Tab ${id}`, groupId, pinned: false, active: false, windowId: 1, highlighted: false, incognito: false, selected: false, discarded: false, autoDiscardable: true, ...extra } as chrome.tabs.Tab;
}

const groups = [{ id: 5, title: 'Alpha', color: 'blue', collapsed: false, windowId: 1 }];
const tabs = [
	tab(1, 0, 'https://pinned.example/', NONE, { pinned: true }),
	tab(2, 1, 'https://a.example/', 5, { active: true }),
	tab(3, 2, 'chrome://settings', 5),
	tab(4, 3, 'https://b.example/', 5, { pinned: true }),
	tab(5, 4, 'https://loose.example/', NONE)
];

beforeEach(() => {
	vi.stubGlobal('chrome', {
		tabGroups: { TAB_GROUP_ID_NONE: NONE, query: vi.fn(async () => groups) },
		tabs: { query: vi.fn(async () => tabs) }
	});
});

describe('collectGroups', () => {
	it('splits kept, skipped, and dropped tabs and only offers kept+skipped for closing', async () => {
		const { collectGroups } = await import('../collect');
		const [alpha, ungrouped] = await collectGroups(1, settings);

		expect(alpha.title).toBe('Alpha');
		expect(alpha.tabs.map((t) => t.url)).toEqual(['https://a.example/']);
		expect(alpha.skipped.map((t) => t.url)).toEqual(['chrome://settings']);
		// Pinned tab 4 was dropped by skipPinnedTabs, so it must not be closable.
		expect(alpha.allTabIds).toEqual([2, 3]);

		expect(ungrouped.isUngrouped).toBe(true);
		expect(ungrouped.title).toBe('Tab 2'); // active tab's title stands in for the window title
		expect(ungrouped.tabs.map((t) => t.url)).toEqual(['https://loose.example/']);
		expect(ungrouped.allTabIds).toEqual([5]);
	});

	it('keeps pinned tabs when the setting is off', async () => {
		const { collectGroups } = await import('../collect');
		const [alpha, ungrouped] = await collectGroups(1, { ...settings, skipPinnedTabs: false });
		expect(alpha.tabs.map((t) => t.url)).toEqual(['https://a.example/', 'https://b.example/']);
		expect(alpha.allTabIds).toEqual([2, 3, 4]);
		expect(ungrouped.allTabIds).toEqual([1, 5]);
	});
});
