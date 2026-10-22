import esbuild from 'esbuild';
import { cpSync, mkdirSync, copyFileSync, readFileSync, existsSync, rmSync } from 'fs';
import { execSync } from 'child_process';

const watch = process.argv.includes('--watch');
const outdir = 'dist';

// Production builds start from an empty dist/ so nothing stale reaches the store zip.
if (!watch) rmSync(outdir, { recursive: true, force: true });
mkdirSync(outdir, { recursive: true });

const entryPoints = ['src/background.ts', 'src/popup.ts', 'src/options.ts', 'src/save.ts'];

const buildOptions = {
	entryPoints,
	bundle: true,
	outdir,
	format: 'esm',
	target: 'chrome120',
	sourcemap: true,
	minify: !watch,
	logLevel: 'info'
};

function copyStaticFiles() {
	copyFileSync('manifest.chrome.json', `${outdir}/manifest.json`);
	copyFileSync('src/popup.html', `${outdir}/popup.html`);
	copyFileSync('src/popup.css', `${outdir}/popup.css`);
	copyFileSync('src/options.html', `${outdir}/options.html`);
	copyFileSync('src/save.html', `${outdir}/save.html`);
	if (existsSync('icons')) cpSync('icons', `${outdir}/icons`, { recursive: true, filter: (src) => !src.endsWith('.svg') });
	cpSync('src/_locales', `${outdir}/_locales`, { recursive: true });
}

// Production builds also produce the store upload: builds/<name>-<version>.zip,
// containing dist/ without source maps. Needs the `zip` CLI; skipped if absent.
function zipDist() {
	const { name, version } = JSON.parse(readFileSync('package.json', 'utf8'));
	mkdirSync('builds', { recursive: true });
	const zipPath = `builds/${name}-${version}.zip`;
	try {
		execSync(`rm -f ../${zipPath} && zip -qr ../${zipPath} . -x '*.map'`, { cwd: outdir, stdio: 'inherit' });
		console.log(`Wrote ${zipPath}`);
	} catch (err) {
		console.warn('Skipping zip (is the zip CLI installed?):', err.message);
	}
}

copyStaticFiles();

if (watch) {
	const ctx = await esbuild.context(buildOptions);
	await ctx.watch();
	console.log('Watching for changes...');
} else {
	await esbuild.build(buildOptions);
	console.log('Build complete.');
	zipDist();
}
