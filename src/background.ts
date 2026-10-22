import { collectGroups } from './lib/collect';
import { startSaveJob } from './lib/job';
import { getSettings } from './lib/storage';
import { t } from './lib/i18n';

chrome.runtime.onInstalled.addListener(() => {
	chrome.contextMenus.create({
		id: 'save-tab-group',
		title: t('contextMenuSave'),
		contexts: ['page']
	});
});

// Saves the clicked tab's group, or the window's ungrouped tabs if it isn't in
// one. The save page does the clipboard + obsidian:// hand-off, which the
// service worker can't.
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
	if (info.menuItemId !== 'save-tab-group' || tab?.windowId === undefined) return;
	const settings = await getSettings();
	if (!settings.vaultName) {
		chrome.runtime.openOptionsPage();
		return;
	}
	const groups = await collectGroups(tab.windowId, settings);
	// The ungrouped snapshot's id (-1) matches TAB_GROUP_ID_NONE.
	const group = groups.find((snapshot) => snapshot.id === tab.groupId);
	if (group) await startSaveJob([group], settings, tab.windowId, tab.id);
});
