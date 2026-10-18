import { describe, expect, it } from 'vitest';
import { renderNote } from '../render';
import type { GroupSnapshot, Settings } from '../types';

const settings: Settings = {
	vaultName: 'v',
	folder: 'Tab Groups/',
	skipPinnedTabs: false,
	skipRestrictedUrls: true,
	closeGroupAfterSaving: false,
	writeBookmarks: false,
	primaryAction: 'addToObsidian'
};

function group(overrides: Partial<GroupSnapshot> = {}): GroupSnapshot {
	return {
		id: 1,
		title: 'Alpha',
		color: 'blue',
		colorHex: '#1a73e8',
		collapsed: false,
		isUngrouped: false,
		windowTitle: 'Window',
		tabs: [
			{ title: 'First', url: 'https://a.example/1', domain: 'a.example', pinned: false, index: 0 },
			{ title: 'Second', url: 'https://b.example/2?x=1&y=2', domain: 'b.example', pinned: false, index: 1 }
		],
		skipped: [],
		allTabIds: [10, 11],
		...overrides
	};
}

describe('renderNote', () => {
	it('produces frontmatter, one link per tab, and the restore callout', async () => {
		const note = await renderNote(group(), settings);
		expect(note.folder).toBe('Tab Groups/');
		expect(note.fileName).toMatch(/^Alpha - \d{4}-\d{2}-\d{2} \d{4}$/);
		expect(note.content.startsWith('---\ntitle: Alpha\ntype: tab-group\ncolor: blue\ntab-count: 2\n')).toBe(true);
		expect(note.content).toContain('- [First](https://a.example/1) — a.example\n');
		expect(note.content).toContain('- [Second](https://b.example/2?x=1&y=2) — b.example\n');
		expect(note.content).toContain('> [!info]- Restore data\n> ```json\n> {\n>   "v": 1,');
		expect(note.content).not.toContain('## Not archived');
	});

	it('escapes brackets in link text but not in the restore JSON', async () => {
		const note = await renderNote(group({ tabs: [{ title: 'A [b] \\ c', url: 'https://x.example/', domain: 'x.example', pinned: false, index: 0 }] }), settings);
		expect(note.content).toContain('- [A \\[b\\] \\\\ c](https://x.example/)');
		expect(note.content).toContain('"title": "A [b] \\\\ c"');
	});

	it('quotes a title YAML would misread and lists skipped tabs', async () => {
		const note = await renderNote(
			group({ title: 'yes', skipped: [{ title: 'Settings', url: 'chrome://settings', domain: '', pinned: false, index: 2 }] }),
			settings
		);
		expect(note.content).toContain('title: "yes"\n');
		expect(note.content).toContain('## Not archived\n- `chrome://settings`');
	});

	it('marks the ungrouped virtual group', async () => {
		const note = await renderNote(group({ title: 'Window', color: '', isUngrouped: true }), settings);
		expect(note.content).toContain('color: ""\n');
		expect(note.fileName.startsWith('Window - ')).toBe(true);
	});
});
