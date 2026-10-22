import { beforeEach, describe, expect, it, vi } from 'vitest';
import { startSaveJob } from '../job';
import type { GroupSnapshot, SaveJob, Settings } from '../types';

const settings: Settings = {
	vaultName: 'v',
	folder: 'Tab Groups/',
	skipPinnedTabs: false,
	skipRestrictedUrls: true,
	closeGroupAfterSaving: false,
	writeBookmarks: false,
	closeSavePage: true,
	primaryAction: 'addToObsidian'
};

const group: GroupSnapshot = {
	id: 5,
	title: 'Alpha',
	color: 'blue',
	colorHex: '#1a73e8',
	collapsed: false,
	isUngrouped: false,
	windowTitle: 'Window',
	tabs: [{ title: 'First', url: 'https://a.example/', domain: 'a.example', pinned: false, index: 3 }],
	skipped: [],
	allTabIds: [12]
};

let stored: Record<string, unknown>;
let create: ReturnType<typeof vi.fn>;
let get: ReturnType<typeof vi.fn>;

beforeEach(() => {
	stored = {};
	create = vi.fn(async () => ({}));
	get = vi.fn(async (id: number) => ({ id, index: 3 }));
	vi.stubGlobal('chrome', {
		runtime: { getURL: (path: string) => `chrome-extension://id/${path}` },
		storage: { session: { set: vi.fn(async (items: Record<string, unknown>) => Object.assign(stored, items)) } },
		tabs: { get, create }
	});
});

function storedJob(): SaveJob {
	return Object.values(stored)[0] as SaveJob;
}

describe('startSaveJob', () => {
	it('opens the save page right after the origin tab, not as its child, and records the origin', async () => {
		await startSaveJob([group], settings, 1, 12);
		expect(create).toHaveBeenCalledTimes(1);
		const props = create.mock.calls[0][0];
		expect(props).toMatchObject({ windowId: 1, active: true, index: 4 });
		expect(props).not.toHaveProperty('openerTabId');
		expect(storedJob().originTabId).toBe(12);
	});

	it('falls back to Chrome placement when there is no origin tab or it has gone', async () => {
		await startSaveJob([group], settings, 1);
		expect(create.mock.calls[0][0].index).toBeUndefined();

		get.mockRejectedValueOnce(new Error('No tab with id: 12'));
		await startSaveJob([group], settings, 1, 12);
		expect(create.mock.calls[1][0].index).toBeUndefined();
	});
});
