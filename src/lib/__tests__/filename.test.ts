import { describe, expect, it } from 'vitest';
import { sanitizeFileName } from '../filename';

describe('sanitizeFileName', () => {
	it('replaces characters Obsidian and filesystems reject', () => {
		expect(sanitizeFileName('a/b:c*d?e"f<g>h|i#j^k[l]m\\n')).toBe('a-b-c-d-e-f-g-h-i-j-k-l-m-n');
	});
	it('collapses whitespace and trims', () => {
		expect(sanitizeFileName('  Research   notes  ')).toBe('Research notes');
	});
	it('falls back to Untitled', () => {
		expect(sanitizeFileName('')).toBe('Untitled');
		expect(sanitizeFileName('   ')).toBe('Untitled');
	});
	it('caps length at 200', () => {
		expect(sanitizeFileName('x'.repeat(300))).toHaveLength(200);
	});
});
