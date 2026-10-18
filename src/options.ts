import { getSettings, setSettings } from './lib/storage';
import type { Settings } from './lib/types';

const vaultNameInput = document.getElementById('vault-name') as HTMLInputElement;
const folderInput = document.getElementById('folder') as HTMLInputElement;
const skipPinnedInput = document.getElementById('skip-pinned') as HTMLInputElement;
const skipRestrictedInput = document.getElementById('skip-restricted') as HTMLInputElement;
const writeBookmarksInput = document.getElementById('write-bookmarks') as HTMLInputElement;
const primaryActionSelect = document.getElementById('primary-action') as HTMLSelectElement;
const savedIndicator = document.getElementById('saved-indicator') as HTMLDivElement;

let saveTimeout: number | undefined;

function showSaved(): void {
	savedIndicator.textContent = 'Saved.';
	window.clearTimeout(saveTimeout);
	saveTimeout = window.setTimeout(() => {
		savedIndicator.textContent = '';
	}, 1200);
}

async function init(): Promise<void> {
	const settings = await getSettings();
	vaultNameInput.value = settings.vaultName;
	folderInput.value = settings.folder;
	skipPinnedInput.checked = settings.skipPinnedTabs;
	skipRestrictedInput.checked = settings.skipRestrictedUrls;
	writeBookmarksInput.checked = settings.writeBookmarks;
	primaryActionSelect.value = settings.primaryAction;
}

async function save(): Promise<void> {
	await setSettings({
		vaultName: vaultNameInput.value.trim(),
		folder: folderInput.value.trim() || 'Tab Groups/',
		skipPinnedTabs: skipPinnedInput.checked,
		skipRestrictedUrls: skipRestrictedInput.checked,
		writeBookmarks: writeBookmarksInput.checked,
		primaryAction: primaryActionSelect.value as Settings['primaryAction']
	});
	showSaved();
}

for (const el of [vaultNameInput, folderInput, skipPinnedInput, skipRestrictedInput, writeBookmarksInput, primaryActionSelect]) {
	el.addEventListener('change', save);
}
vaultNameInput.addEventListener('blur', save);
folderInput.addEventListener('blur', save);

init();
