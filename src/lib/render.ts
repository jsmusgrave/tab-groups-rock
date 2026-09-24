import { createEngine, standardFilters } from 'knap';
import type { GroupSnapshot, RenderedNote, Settings } from './types';
import { generateFrontmatter, type PropertyValue } from './frontmatter';
import { sanitizeFileName } from './filename';

const engine = createEngine({ filters: standardFilters });

const NOTE_NAME_TEMPLATE = '{{ group.title }} - {{ date | date:"YYYY-MM-DD HHmm" }}';

const BODY_TEMPLATE = `Saved {{ date | date:"MMMM D, YYYY h:mm A" }} from a {{ group.color }} group with {{ tabs | length }} tabs.

{% for tab in tabs %}
- [{{ tab.title }}]({{ tab.url }}) — {{ tab.domain }}
{% endfor %}
{% if skipped %}

## Not archived
{% for tab in skipped %}
- \`{{ tab.url }}\`
{% endfor %}
{% endif %}

> [!info]- Restore data
> \`\`\`json
> {{ restoreJson }}
> \`\`\`
`;

// Square brackets and backslashes in a title would break "[title](url)".
function escapeLinkText(text: string): string {
	return text.replace(/[\\\[\]]/g, '\\$&');
}

function forTemplate(tabs: GroupSnapshot['tabs']) {
	return tabs.map((tab) => ({ ...tab, title: escapeLinkText(tab.title) }));
}

function buildRestoreJson(group: GroupSnapshot): string {
	const payload = {
		v: 1,
		title: group.title,
		color: group.color,
		tabs: group.tabs.map((tab) => ({ url: tab.url, title: tab.title }))
	};
	// Every line needs a leading "> " so the JSON stays inside the Obsidian callout.
	return JSON.stringify(payload, null, 2).split('\n').join('\n> ');
}

export async function renderNote(group: GroupSnapshot, settings: Settings): Promise<RenderedNote> {
	const now = new Date();
	const variables = {
		group: {
			title: group.title,
			color: group.color,
			colorHex: group.colorHex,
			collapsed: group.collapsed,
			isUngrouped: group.isUngrouped
		},
		window: { title: group.windowTitle },
		tabs: forTemplate(group.tabs),
		skipped: forTemplate(group.skipped),
		date: now.toISOString(),
		time: now.toISOString(),
		browser: 'chrome',
		restoreJson: buildRestoreJson(group)
	};

	const [fileNameRaw, bodyRaw] = await Promise.all([
		engine.renderOrThrow(NOTE_NAME_TEMPLATE, { variables }),
		engine.renderOrThrow(BODY_TEMPLATE, { variables })
	]);

	const properties: PropertyValue[] = [
		{ key: 'title', type: 'text', value: group.title },
		{ key: 'type', type: 'text', value: 'tab-group' },
		{ key: 'color', type: 'text', value: group.color },
		{ key: 'tab-count', type: 'number', value: group.tabs.length },
		{ key: 'saved', type: 'datetime', value: now.toISOString() },
		{ key: 'tags', type: 'multitext', value: ['tab-group'] }
	];

	const frontmatter = generateFrontmatter(properties);
	const content = `${frontmatter}\n${bodyRaw.trim()}\n`;

	return {
		fileName: sanitizeFileName(fileNameRaw.trim()),
		folder: settings.folder,
		content
	};
}
