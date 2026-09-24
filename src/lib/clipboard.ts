// navigator.clipboard needs a focused document, which the save page stops
// being once Obsidian takes over. execCommand works in extension pages without
// focus, given the clipboardWrite permission.

export async function writeClipboard(text: string): Promise<boolean> {
	try {
		await navigator.clipboard.writeText(text);
		return true;
	} catch {
		const textarea = document.createElement('textarea');
		textarea.value = text;
		document.body.appendChild(textarea);
		textarea.select();
		const ok = document.execCommand('copy');
		textarea.remove();
		return ok;
	}
}
