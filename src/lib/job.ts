import { writeGroupBookmarks } from './bookmarks';
import { renderNote } from './render';
import type { GroupSnapshot, JobNote, SaveJob, Settings } from './types';

const JOB_KEY_PREFIX = 'saveJob:';

// Renders the notes and opens the save page to deliver them. Everything after
// this runs in the save page, so the caller (the popup, which closes as soon
// as focus moves) doesn't have to stay alive.
export async function startSaveJob(groups: GroupSnapshot[], settings: Settings, windowId: number): Promise<void> {
	const notes = await Promise.all(
		groups.map(async (group): Promise<JobNote> => {
			const note = await renderNote(group, settings);
			let bookmarkPath: string | undefined;
			if (settings.writeBookmarks) {
				try {
					bookmarkPath = await writeGroupBookmarks(group);
				} catch (err) {
					// The Obsidian note is what matters; a bookmark-folder failure
					// should never block or break that flow.
					console.error('Tab Groups Rock: failed to write bookmark folder for group', group.title, err);
				}
			}
			return {
				groupTitle: group.title,
				note,
				tabIds: group.allTabIds,
				bookmarkPath
			};
		})
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
