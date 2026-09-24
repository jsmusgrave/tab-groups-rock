import { renderNote } from './render';
import type { GroupSnapshot, SaveJob, Settings } from './types';

const JOB_KEY_PREFIX = 'saveJob:';

// Renders the notes and opens the save page to deliver them. Everything after
// this runs in the save page, so the caller (the popup, which closes as soon
// as focus moves) doesn't have to stay alive.
export async function startSaveJob(groups: GroupSnapshot[], settings: Settings, windowId: number): Promise<void> {
	const notes = await Promise.all(
		groups.map(async (group) => ({
			groupTitle: group.title,
			note: await renderNote(group, settings),
			tabIds: group.allTabIds
		}))
	);
	const job: SaveJob = {
		vaultName: settings.vaultName,
		closeAfterSaving: settings.closeGroupAfterSaving,
		notes
	};
	const jobId = crypto.randomUUID();
	await chrome.storage.session.set({ [JOB_KEY_PREFIX + jobId]: job });
	await chrome.tabs.create({ url: chrome.runtime.getURL(`save.html?job=${jobId}`), windowId, active: true });
}

export async function takeSaveJob(jobId: string): Promise<SaveJob | null> {
	const key = JOB_KEY_PREFIX + jobId;
	const stored = await chrome.storage.session.get(key);
	await chrome.storage.session.remove(key);
	return (stored[key] as SaveJob | undefined) ?? null;
}
