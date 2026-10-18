// Thin wrapper over chrome.i18n. Strings live in src/_locales/<lang>/messages.json.
// HTML elements opt in with data-i18n (textContent), data-i18n-title (title
// attribute) or data-i18n-placeholder; TS code calls t().

export function t(key: string, substitutions?: string | string[]): string {
	const message = chrome.i18n.getMessage(key, substitutions);
	return message || key;
}

export function translatePage(): void {
	document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
		el.textContent = t(el.dataset.i18n as string);
	});
	document.querySelectorAll<HTMLElement>('[data-i18n-title]').forEach((el) => {
		el.title = t(el.dataset.i18nTitle as string);
	});
	document.querySelectorAll<HTMLInputElement>('[data-i18n-placeholder]').forEach((el) => {
		el.placeholder = t(el.dataset.i18nPlaceholder as string);
	});
}
