// Delivers a SaveJob to Obsidian. Runs in its own tab, so unlike the popup it
// survives focus moving to Obsidian and can keep timers and the clipboard.
//
// Each note is written to the clipboard and handed off with obsidian://new.
// Chrome only lets a page launch an external protocol once per user gesture,
// and the clipboard must hold a note until Obsidian reads it, so the first
// note goes automatically and each later one waits for a "Send next" click.
//
// A single note with nothing to close is fire-and-forget: the tab closes once
// Chrome loses focus to Obsidian. Cancelling Chrome's "Open Obsidian?" prompt
// fires no event, so a "Close now" button covers that case; there is no timer,
// because one could dismiss the prompt while the user is still reading it.
// Otherwise the page stays until the user is done, and closes tabs only if
// they confirm.
import { writeClipboard } from './lib/clipboard';
import { takeSaveJob } from './lib/job';
import type { SaveJob } from './lib/types';
import { buildObsidianUri } from './lib/writers/uri';

type NoteStatus = 'waiting' | 'sent' | 'sent-in-uri';

const headingEl = document.getElementById('heading') as HTMLHeadingElement;
const noteListEl = document.getElementById('note-list') as HTMLUListElement;
const messageEl = document.getElementById('message') as HTMLParagraphElement;
const nextBtn = document.getElementById('next-btn') as HTMLButtonElement;
const closeTabsBtn = document.getElementById('close-tabs-btn') as HTMLButtonElement;
const doneBtn = document.getElementById('done-btn') as HTMLButtonElement;

let job: SaveJob;
let statuses: NoteStatus[] = [];
let nextIndex = 0;

function closeSelf(): void {
	chrome.tabs.getCurrent((tab) => {
		if (tab?.id !== undefined) chrome.tabs.remove(tab.id);
		else window.close();
	});
}

function closableTabIds(): number[] {
	return job.notes.flatMap((item, i) => (statuses[i] === 'sent' ? item.tabIds : []));
}

function render(): void {
	noteListEl.innerHTML = '';
	job.notes.forEach((item, i) => {
		const row = document.createElement('li');
		const title = document.createElement('span');
		title.textContent = item.note.fileName;
		const status = document.createElement('span');
		status.className = `status ${statuses[i]}`;
		status.textContent =
			statuses[i] === 'waiting' ? 'Waiting' : statuses[i] === 'sent' ? 'Sent' : 'Sent (clipboard unavailable)';
		row.append(title, status);
		noteListEl.appendChild(row);
	});

	const allSent = nextIndex >= job.notes.length;
	nextBtn.hidden = allSent;
	if (!allSent) {
		nextBtn.textContent = `Send next: ${job.notes[nextIndex].groupTitle}`;
		messageEl.textContent = 'Check that the note arrived in Obsidian, then send the next one.';
	}

	const closable = closableTabIds();
	const offerClose = allSent && job.closeAfterSaving && closable.length > 0;
	closeTabsBtn.hidden = !offerClose;
	if (offerClose) {
		closeTabsBtn.textContent = closable.length === 1 ? 'Close 1 tab' : `Close ${closable.length} tabs`;
	}
	doneBtn.hidden = !allSent;
	doneBtn.textContent = offerClose ? 'Keep tabs' : 'Done';
	if (allSent) {
		messageEl.textContent = offerClose
			? 'Once the notes show up in Obsidian, close the tabs you saved?'
			: 'All notes sent to Obsidian.';
		if (job.notes.some((_, i) => statuses[i] === 'sent-in-uri') && job.closeAfterSaving) {
			messageEl.textContent += ' Groups sent without the clipboard stay open, in case the note was cut short.';
		}
	}
}

async function sendNext(): Promise<void> {
	const i = nextIndex;
	const item = job.notes[i];
	const copied = await writeClipboard(item.note.content);
	statuses[i] = copied ? 'sent' : 'sent-in-uri';
	nextIndex = i + 1;
	render();
	location.href = buildObsidianUri(item.note, job.vaultName, copied);
}

function runFireAndForget(): void {
	chrome.windows.onFocusChanged.addListener((windowId) => {
		if (windowId === chrome.windows.WINDOW_ID_NONE) closeSelf();
	});
}

function runInteractive(): void {
	nextBtn.addEventListener('click', () => sendNext());
	closeTabsBtn.addEventListener('click', async () => {
		await chrome.tabs.remove(closableTabIds()).catch(() => undefined);
		closeSelf();
	});
	doneBtn.addEventListener('click', closeSelf);
}

async function init(): Promise<void> {
	const jobId = new URLSearchParams(location.search).get('job');
	const loaded = jobId ? await takeSaveJob(jobId) : null;
	if (!loaded || loaded.notes.length === 0) {
		headingEl.textContent = 'Nothing to save';
		messageEl.textContent = 'This save has already run. You can close this tab.';
		doneBtn.hidden = false;
		doneBtn.addEventListener('click', closeSelf);
		return;
	}
	job = loaded;
	statuses = job.notes.map(() => 'waiting');
	headingEl.textContent = job.notes.length === 1 ? 'Saving to Obsidian' : `Saving ${job.notes.length} groups to Obsidian`;

	await sendNext();
	if (job.notes.length === 1 && !job.closeAfterSaving) {
		messageEl.textContent = 'This tab closes on its own once Obsidian opens.';
		doneBtn.hidden = false;
		doneBtn.textContent = 'Close now';
		doneBtn.addEventListener('click', closeSelf);
		runFireAndForget();
	} else {
		runInteractive();
	}
}

init();
