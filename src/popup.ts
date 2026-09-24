import { collectGroups } from './lib/collect';
import { startSaveJob } from './lib/job';
import { getSettings, setSettings } from './lib/storage';
import type { GroupSnapshot, Settings } from './lib/types';

let groups: GroupSnapshot[] = [];
let settings: Settings;
let windowId: number | undefined;

const groupListEl = document.getElementById('group-list') as HTMLDivElement;
const folderInput = document.getElementById('folder-input') as HTMLInputElement;
const closeAfterSaveCheckbox = document.getElementById('close-after-save') as HTMLInputElement;
const saveBtn = document.getElementById('save-btn') as HTMLButtonElement;
const statusEl = document.getElementById('status') as HTMLDivElement;
const noVaultNotice = document.getElementById('no-vault-notice') as HTMLDivElement;
const settingsBtn = document.getElementById('settings-btn') as HTMLButtonElement;
const openSettingsLink = document.getElementById('open-settings-link') as HTMLAnchorElement;

settingsBtn.addEventListener('click', () => chrome.runtime.openOptionsPage());
openSettingsLink.addEventListener('click', (event) => {
	event.preventDefault();
	chrome.runtime.openOptionsPage();
});

async function init(): Promise<void> {
	settings = await getSettings();
	noVaultNotice.hidden = Boolean(settings.vaultName);
	folderInput.value = settings.folder;
	closeAfterSaveCheckbox.checked = settings.closeGroupAfterSaving;

	const currentWindow = await chrome.windows.getCurrent();
	windowId = currentWindow.id;
	if (windowId === undefined) return;

	const [activeTab] = await chrome.tabs.query({ active: true, windowId });
	groups = await collectGroups(windowId, settings);
	// Pre-check the active tab's group. An ungrouped active tab only pre-checks
	// the Ungrouped row when the window has no real groups, since it is usually
	// just the page the popup was opened from (e.g. chrome://extensions).
	const activeGroupId = activeTab?.groupId ?? chrome.tabGroups.TAB_GROUP_ID_NONE;
	const hasRealGroups = groups.some((group) => !group.isUngrouped);
	const preselect =
		activeGroupId !== chrome.tabGroups.TAB_GROUP_ID_NONE ? activeGroupId : hasRealGroups ? null : -1;
	renderGroupList(preselect);
}

function renderGroupList(preselectGroupId: number | null): void {
	groupListEl.innerHTML = '';
	if (groups.length === 0) {
		groupListEl.innerHTML = '<div class="empty-state">No tab groups or tabs in this window.</div>';
		return;
	}
	for (const group of groups) {
		const row = document.createElement('label');
		row.className = 'group-row';

		const checkbox = document.createElement('input');
		checkbox.type = 'checkbox';
		checkbox.dataset.groupId = String(group.id);
		checkbox.checked = group.id === preselectGroupId;

		const swatch = document.createElement('span');
		swatch.className = 'swatch';
		swatch.style.background = group.colorHex;

		const title = document.createElement('span');
		title.className = 'title';
		title.textContent = group.isUngrouped ? 'Ungrouped tabs' : group.title;

		const count = document.createElement('span');
		count.className = 'count';
		count.textContent = String(group.tabs.length + group.skipped.length);

		row.append(checkbox, swatch, title, count);
		groupListEl.appendChild(row);
	}
}

function selectedGroups(): GroupSnapshot[] {
	const checkedIds = Array.from(
		groupListEl.querySelectorAll<HTMLInputElement>('input[type="checkbox"]:checked')
	).map((el) => Number(el.dataset.groupId));
	return groups.filter((group) => checkedIds.includes(group.id));
}

function logStatus(message: string, kind: 'ok' | 'err' = 'ok'): void {
	const line = document.createElement('div');
	line.className = kind;
	line.textContent = message;
	statusEl.appendChild(line);
}

saveBtn.addEventListener('click', async () => {
	statusEl.innerHTML = '';
	const chosen = selectedGroups();
	if (chosen.length === 0) {
		logStatus('Pick at least one group.', 'err');
		return;
	}
	if (!settings.vaultName) {
		logStatus('Add a vault name in settings first.', 'err');
		return;
	}

	const activeSettings: Settings = {
		...settings,
		folder: folderInput.value || settings.folder,
		closeGroupAfterSaving: closeAfterSaveCheckbox.checked
	};
	await setSettings({
		folder: activeSettings.folder,
		closeGroupAfterSaving: activeSettings.closeGroupAfterSaving
	});

	// The save page takes it from here; opening it closes this popup.
	saveBtn.disabled = true;
	try {
		await startSaveJob(chosen, activeSettings, windowId!);
	} catch (err) {
		logStatus(`Failed to save: ${String(err)}`, 'err');
		saveBtn.disabled = false;
	}
});

init();
