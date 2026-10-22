import { writeGroupBookmarks } from './bookmarks';
import { renderNote } from './render';
import type { GroupSnapshot, JobNote, SaveJob, Settings } from './types';

const JOB_KEY_PREFIX = 'saveJob:';

// Renders the notes and opens the save page to deliver them. Everything after
// this runs in the save page, so the caller (the popup, which closes as soon
// as focus moves) doesn't have to stay alive.
export async function startSaveJob(
	groups: GroupSnapshot[],
	settings: Settings,
	windowId: number,
	originTabId?: number
): Promise<void> {
	const rendered = await Promise.all(groups.map((group) => renderNote(group, settings)));
	// Bookmarks are written one group at a time: writeGroupBookmarks looks up
	// or creates the shared "Archived groups" and month folders, and two
	// concurrent calls would both create them.
	const notes: JobNote[] = [];
	for (const [i, group] of groups.entries()) {
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
		notes.push({ groupTitle: group.title, note: rendered[i], tabIds: group.allTabIds, bookmarkPath });
	}
	const job: SaveJob = {
		vaultName: settings.vaultName,
		closeAfterSaving: settings.closeGroupAfterSaving,
		closeSavePage: settings.closeSavePage,
		originTabId,
		notes
	};
	const jobId = crypto.randomUUID();
	await chrome.storage.session.set({ [JOB_KEY_PREFIX + jobId]: job });
	// Open the save page right after the origin tab rather than at the end of
	// the strip, so closing it doesn't land on an unrelated tab. It is not
	// marked as opened by the origin tab: Chrome adds tabs opened from a
	// grouped tab to that group. The save page leaves any group it lands in.
	const index =
		originTabId === undefined
			? undefined
			: await chrome.tabs
					.get(originTabId)
					.then((tab) => tab.index + 1)
					.catch(() => undefined);
	await chrome.tabs.create({ url: chrome.runtime.getURL(`save.html?job=${jobId}`), windowId, active: true, index });
}

export async function takeSaveJob(jobId: string): Promise<SaveJob | null> {
	const key = JOB_KEY_PREFIX + jobId;
	const stored = await chrome.storage.session.get(key);
	await chrome.storage.session.remove(key);
	return (stored[key] as SaveJob | undefined) ?? null;
}
