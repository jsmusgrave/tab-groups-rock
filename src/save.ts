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
import { t, translatePage } from './lib/i18n';

type NoteStatus = 'waiting' | 'sent' | 'sent-in-uri';

const FIRST_RUN_HINT_KEY = 'firstRunHintShown';

const headingEl = document.getElementById('heading') as HTMLHeadingElement;
const hintEl = document.getElementById('first-run-hint') as HTMLDivElement;
const hintDismissBtn = document.getElementById('hint-dismiss-btn') as HTMLButtonElement;
const noteListEl = document.getElementById('note-list') as HTMLUListElement;
const messageEl = document.getElementById('message') as HTMLParagraphElement;
const nextBtn = document.getElementById('next-btn') as HTMLButtonElement;
const closeTabsBtn = document.getElementById('close-tabs-btn') as HTMLButtonElement;
const doneBtn = document.getElementById('done-btn') as HTMLButtonElement;

let job: SaveJob;
let statuses: NoteStatus[] = [];
let nextIndex = 0;
let tabsClosed = false;

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
		const info = document.createElement('div');
		info.className = 'note-info';
		const title = document.createElement('span');
		title.textContent = item.note.fileName;
		info.appendChild(title);
		if (item.bookmarkPath) {
			const bookmark = document.createElement('span');
			bookmark.className = 'bookmark-path';
			bookmark.textContent = t('bookmarkedTo', item.bookmarkPath);
			info.appendChild(bookmark);
		}
		const status = document.createElement('span');
		status.className = `status ${statuses[i]}`;
		status.textContent =
			statuses[i] === 'waiting'
				? t('statusWaiting')
				: statuses[i] === 'sent'
					? t('statusHanded')
					: t('statusHandedInUri');
		row.append(info, status);
		noteListEl.appendChild(row);
	});

	if (tabsClosed) {
		nextBtn.hidden = true;
		closeTabsBtn.hidden = true;
		doneBtn.hidden = false;
		doneBtn.textContent = t('done');
		messageEl.textContent = t('tabsClosedMessage');
		return;
	}

	const allSent = nextIndex >= job.notes.length;
	nextBtn.hidden = allSent;
	if (!allSent) {
		nextBtn.textContent = t('sendNext', job.notes[nextIndex].groupTitle);
		messageEl.textContent = t('checkThenSendNext');
	}

	const closable = closableTabIds();
	const offerClose = allSent && job.closeAfterSaving && closable.length > 0;
	closeTabsBtn.hidden = !offerClose;
	if (offerClose) {
		closeTabsBtn.textContent = closable.length === 1 ? t('closeOneTab') : t('closeTabs', String(closable.length));
	}
	doneBtn.hidden = !allSent;
	doneBtn.textContent = offerClose ? t('keepTabs') : t('done');
	if (allSent) {
		messageEl.textContent = offerClose
			? t('confirmClose')
			: t('allSent');
		if (job.notes.some((_, i) => statuses[i] === 'sent-in-uri') && job.closeAfterSaving) {
			messageEl.textContent += ' ' + t('sentInUriStayOpen');
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
		tabsClosed = true;
		render();
	});
	doneBtn.addEventListener('click', closeSelf);
}

async function maybeShowFirstRunHint(): Promise<void> {
	const stored = await chrome.storage.local.get({ [FIRST_RUN_HINT_KEY]: false });
	if (stored[FIRST_RUN_HINT_KEY]) return;
	hintEl.hidden = false;
	hintDismissBtn.addEventListener('click', () => {
		hintEl.hidden = true;
		chrome.storage.local.set({ [FIRST_RUN_HINT_KEY]: true }).catch(() => undefined);
	});
}

async function init(): Promise<void> {
	translatePage();
	const jobId = new URLSearchParams(location.search).get('job');
	const loaded = jobId ? await takeSaveJob(jobId) : null;
	if (!loaded || loaded.notes.length === 0) {
		headingEl.textContent = t('nothingToSave');
		messageEl.textContent = t('alreadyRun');
		doneBtn.hidden = false;
		doneBtn.addEventListener('click', closeSelf);
		return;
	}
	job = loaded;
	statuses = job.notes.map(() => 'waiting');
	headingEl.textContent = job.notes.length === 1 ? t('savingTitle') : t('savingGroupsTitle', String(job.notes.length));
	maybeShowFirstRunHint().catch(() => undefined);

	await sendNext();
	if (job.notes.length === 1 && !job.closeAfterSaving) {
		messageEl.textContent = t('closesOnItsOwn');
		doneBtn.hidden = false;
		doneBtn.textContent = t('closeNow');
		doneBtn.addEventListener('click', closeSelf);
		runFireAndForget();
	} else {
		runInteractive();
	}
}

init();
