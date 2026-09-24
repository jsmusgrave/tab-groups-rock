import type { RenderedNote } from '../types';

function buildPath(note: RenderedNote): string {
	const folder = note.folder.replace(/^\/+/, '').replace(/\/+$/, '');
	const name = `${note.fileName}.md`;
	return folder ? `${folder}/${name}` : name;
}

// With useClipboard, Obsidian reads the note body from the clipboard, which
// avoids URI length limits; otherwise the body goes in the URI itself.
export function buildObsidianUri(note: RenderedNote, vaultName: string, useClipboard: boolean): string {
	const params = useClipboard ? 'clipboard' : `content=${encodeURIComponent(note.content)}`;
	return (
		`obsidian://new?file=${encodeURIComponent(buildPath(note))}` +
		`&vault=${encodeURIComponent(vaultName)}` +
		`&${params}`
	);
}
