import esbuild from 'esbuild';
import { cpSync, mkdirSync, copyFileSync, readFileSync, writeFileSync, existsSync } from 'fs';

const watch = process.argv.includes('--watch');
const outdir = 'dist';

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
	if (existsSync('icons')) cpSync('icons', `${outdir}/icons`, { recursive: true });
}

copyStaticFiles();

if (watch) {
	const ctx = await esbuild.context(buildOptions);
	await ctx.watch();
	console.log('Watching for changes...');
} else {
	await esbuild.build(buildOptions);
	console.log('Build complete.');
}
