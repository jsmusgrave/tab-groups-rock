const ILLEGAL_CHARS = /[#|^\[\]\\/:*?"<>]/g;

export function sanitizeFileName(name: string): string {
	return name
		.replace(ILLEGAL_CHARS, '-')
		.replace(/\s+/g, ' ')
		.trim()
		.slice(0, 200) || 'Untitled';
}
