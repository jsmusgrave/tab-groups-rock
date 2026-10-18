import { describe, expect, it } from 'vitest';
import { generateFrontmatter } from '../frontmatter';

describe('generateFrontmatter', () => {
	it('leaves plain text unquoted and quotes YAML look-alikes', () => {
		const out = generateFrontmatter([
			{ key: 'plain', type: 'text', value: 'Plain title' },
			{ key: 'yes', type: 'text', value: 'yes' },
			{ key: 'num', type: 'text', value: '2024' },
			{ key: 'nul', type: 'text', value: 'null' },
			{ key: 'on', type: 'text', value: 'On' },
			{ key: 'colon', type: 'text', value: 'Research: sync' },
			{ key: 'empty', type: 'text', value: '' }
		]);
		expect(out).toBe(
			['---', 'plain: Plain title', 'yes: "yes"', 'num: "2024"', 'nul: "null"', 'on: "On"', 'colon: "Research: sync"', 'empty: ""', '---', ''].join('\n')
		);
	});
	it('renders typed values', () => {
		const out = generateFrontmatter([
			{ key: 'count', type: 'number', value: 3 },
			{ key: 'flag', type: 'checkbox', value: true },
			{ key: 'when', type: 'datetime', value: '2026-09-22T04:00:00.000Z' },
			{ key: 'tags', type: 'multitext', value: ['tab-group', 'no'] },
			{ key: 'none', type: 'multitext', value: [] }
		]);
		expect(out).toContain('count: 3\n');
		expect(out).toContain('flag: true\n');
		expect(out).toContain('when: "2026-09-22T04:00:00.000Z"\n');
		expect(out).toContain('tags: \n  - tab-group\n  - "no"\n');
		expect(out).toContain('none: []\n');
	});
});
