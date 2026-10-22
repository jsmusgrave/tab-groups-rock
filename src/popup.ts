import { collectGroups } from './lib/collect';
import { startSaveJob } from './lib/job';
import { renderNote } from './lib/render';
import { getSettings, setSettings } from './lib/storage';
import type { GroupSnapshot, Settings } from './lib/types';
import { t, translatePage } from './lib/i18n';

type Action = Settings['primaryAction'];

const ACTION_LABELS: Record<Action, string> = {
	addToObsidian: t('actionAddToObsidian'),
	saveFile: t('actionSaveFile'),
	copyToClipboard: t('actionCopyToClipboard')
};

const ACTION_ORDER: Action[] = ['addToObsidian', 'saveFile', 'copyToClipboard'];

let groups: GroupSnapshot[] = [];
let settings: Settings;
let windowId: number | undefined;
let originTabId: number | undefined;

const groupListEl = document.getElementById('group-list') as HTMLDivElement;
const selectAllRow = document.getElementById('select-all-row') as HTMLLabelElement;
const selectAllCheckbox = document.getElementById('select-all-checkbox') as HTMLInputElement;
const folderInput = document.getElementById('folder-input') as HTMLInputElement;
const closeAfterSaveCheckbox = document.getElementById('close-after-save') as HTMLInputElement;
const primaryBtn = document.getElementById('primary-btn') as HTMLButtonElement;
const moreBtn = document.getElementById('more-btn') as HTMLButtonElement;
const moreMenu = document.getElementById('more-menu') as HTMLDivElement;
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
	translatePage();
	settings = await getSettings();
	noVaultNotice.hidden = Boolean(settings.vaultName);
	folderInput.value = settings.folder;
	closeAfterSaveCheckbox.checked = settings.closeGroupAfterSaving;
	primaryBtn.textContent = ACTION_LABELS[settings.primaryAction];
	renderMoreMenu();

	const currentWindow = await chrome.windows.getCurrent();
	windowId = currentWindow.id;
	if (windowId === undefined) return;

	const [activeTab] = await chrome.tabs.query({ active: true, windowId });
	originTabId = activeTab?.id;
	groups = await collectGroups(windowId, settings);
	// Pre-check the active tab's group. An ungrouped active tab only pre-checks
	// the Ungrouped row when the window has no real groups, since it is usually
	// just the page the popup was opened from (e.g. chrome://extensions).
	const activeGroupId = activeTab?.groupId ?? chrome.tabGroups.TAB_GROUP_ID_NONE;
	const hasRealGroups = groups.some((group) => !group.isUngrouped);
	const preselect =
		activeGroupId !== chrome.tabGroups.TAB_GROUP_ID_NONE ? activeGroupId : hasRealGroups ? null : -1;
	renderGroupList(preselect);
	syncSelectAllState();
}

function renderMoreMenu(): void {
	moreMenu.innerHTML = '';
	for (const action of ACTION_ORDER) {
		if (action === settings.primaryAction) continue;
		const item = document.createElement('button');
		item.type = 'button';
		item.textContent = ACTION_LABELS[action];
		item.addEventListener('click', () => {
			closeMoreMenu();
			performAction(action);
		});
		moreMenu.appendChild(item);
	}
}

function openMoreMenu(): void {
	moreMenu.hidden = false;
	moreBtn.setAttribute('aria-expanded', 'true');
}

function closeMoreMenu(): void {
	moreMenu.hidden = true;
	moreBtn.setAttribute('aria-expanded', 'false');
}

moreBtn.addEventListener('click', (event) => {
	event.stopPropagation();
	if (moreMenu.hidden) openMoreMenu();
	else closeMoreMenu();
});

document.addEventListener('click', (event) => {
	if (!moreMenu.hidden && !moreMenu.contains(event.target as Node) && event.target !== moreBtn) {
		closeMoreMenu();
	}
});

document.addEventListener('keydown', (event) => {
	if (event.key === 'Escape') closeMoreMenu();
});

function renderGroupList(preselectGroupId: number | null): void {
	groupListEl.innerHTML = '';
	if (groups.length === 0) {
		const empty = document.createElement('div');
		empty.className = 'empty-state';
		empty.textContent = t('emptyWindow');
		groupListEl.appendChild(empty);
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
		title.textContent = group.isUngrouped ? t('ungroupedTabs') : group.title;

		const count = document.createElement('span');
		count.className = 'count';
		count.textContent = String(group.tabs.length + group.skipped.length);

		row.append(checkbox, swatch, title, count);
		groupListEl.appendChild(row);
	}
}

function rowCheckboxes(): HTMLInputElement[] {
	return Array.from(groupListEl.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'));
}

function syncSelectAllState(): void {
	const boxes = rowCheckboxes();
	if (boxes.length <= 1) {
		selectAllRow.hidden = true;
		return;
	}
	selectAllRow.hidden = false;
	const checkedCount = boxes.filter((box) => box.checked).length;
	selectAllCheckbox.checked = checkedCount === boxes.length;
	selectAllCheckbox.indeterminate = checkedCount > 0 && checkedCount < boxes.length;
}

// Delegated: fires for every individual row checkbox toggle.
groupListEl.addEventListener('change', (event) => {
	if ((event.target as HTMLElement)?.matches('input[type="checkbox"]')) {
		syncSelectAllState();
	}
});

selectAllCheckbox.addEventListener('change', () => {
	const checked = selectAllCheckbox.checked;
	for (const box of rowCheckboxes()) box.checked = checked;
	syncSelectAllState();
});

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

async function saveFiles(chosen: GroupSnapshot[], activeSettings: Settings): Promise<void> {
	for (const group of chosen) {
		const note = await renderNote(group, activeSettings);
		const blob = new Blob([note.content], { type: 'text/markdown' });
		const url = URL.createObjectURL(blob);
		try {
			const link = document.createElement('a');
			link.href = url;
			link.download = `${note.fileName}.md`;
			document.body.appendChild(link);
			link.click();
			link.remove();
		} finally {
			URL.revokeObjectURL(url);
		}
	}
	logStatus(t('savedFiles', String(chosen.length)));
}

async function copyToClipboard(chosen: GroupSnapshot[], activeSettings: Settings): Promise<void> {
	const notes = await Promise.all(chosen.map((group) => renderNote(group, activeSettings)));
	const text = notes.map((note) => note.content).join('\n\n---\n\n');
	await navigator.clipboard.writeText(text);
	logStatus(t('copiedNotes', String(chosen.length)));
}

async function performAction(action: Action): Promise<void> {
	statusEl.innerHTML = '';
	const chosen = selectedGroups();
	if (chosen.length === 0) {
		logStatus(t('pickOneGroup'), 'err');
		return;
	}
	// Only the Obsidian hand-off needs a vault; Save file and Copy work without one.
	if (action === 'addToObsidian' && !settings.vaultName) {
		logStatus(t('addVaultFirst'), 'err');
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

	primaryBtn.disabled = true;
	moreBtn.disabled = true;
	try {
		if (action === 'addToObsidian') {
			// The save page takes it from here; opening it closes this popup.
			await startSaveJob(chosen, activeSettings, windowId!, originTabId);
		} else if (action === 'saveFile') {
			await saveFiles(chosen, activeSettings);
		} else {
			await copyToClipboard(chosen, activeSettings);
		}
	} catch (err) {
		logStatus(t('failed', String(err)), 'err');
	} finally {
		primaryBtn.disabled = false;
		moreBtn.disabled = false;
	}
}

primaryBtn.addEventListener('click', () => performAction(settings.primaryAction));

init();
