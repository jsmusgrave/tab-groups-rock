import type { Settings } from './types';

const DEFAULTS: Settings = {
	vaultName: '',
	folder: 'Tab Groups/',
	skipPinnedTabs: false,
	skipRestrictedUrls: true,
	closeGroupAfterSaving: false,
	writeBookmarks: true,
	primaryAction: 'addToObsidian'
};

export async function getSettings(): Promise<Settings> {
	const stored = await chrome.storage.sync.get(DEFAULTS);
	return stored as Settings;
}

export async function setSettings(partial: Partial<Settings>): Promise<void> {
	await chrome.storage.sync.set(partial);
}
