export type PropertyType = 'text' | 'multitext' | 'number' | 'checkbox' | 'date' | 'datetime';

export interface PropertyValue {
	key: string;
	type: PropertyType;
	value: string | number | boolean | string[];
}

// Words YAML would read as something other than a string.
const RESERVED = /^(true|false|yes|no|on|off|y|n|null|~)$/i;

function yamlScalar(value: string): string {
	if (value === '') return '""';
	// Unquoted only when it starts with a letter and cannot be mistaken for a
	// number, boolean, null, or date. Everything else is JSON-quoted, which is
	// valid YAML.
	if (/^[a-zA-Z][a-zA-Z0-9 _.\-]*$/.test(value) && !RESERVED.test(value.trim())) return value;
	return JSON.stringify(value);
}

function renderValue(prop: PropertyValue): string {
	switch (prop.type) {
		case 'multitext': {
			const items = Array.isArray(prop.value) ? prop.value : [String(prop.value)];
			if (items.length === 0) return '[]';
			return `\n${items.map((item) => `  - ${yamlScalar(String(item))}`).join('\n')}`;
		}
		case 'number':
			return String(Number(prop.value));
		case 'checkbox':
			return prop.value ? 'true' : 'false';
		case 'date':
		case 'datetime':
		case 'text':
		default:
			return yamlScalar(String(prop.value));
	}
}

export function generateFrontmatter(properties: PropertyValue[]): string {
	const lines = properties.map((prop) => `${prop.key}: ${renderValue(prop)}`);
	return `---\n${lines.join('\n')}\n---\n`;
}
