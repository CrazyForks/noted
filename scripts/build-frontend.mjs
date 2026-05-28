import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { build } from 'esbuild';

const root = process.cwd();
const srcDir = join(root, 'src');
const distDir = join(root, 'dist');

await rm(distDir, { force: true, recursive: true });
await mkdir(distDir, { recursive: true });

await build({
  bundle: true,
  entryPoints: [join(srcDir, 'main.js')],
  format: 'esm',
  logLevel: 'info',
  outfile: join(distDir, 'main.js'),
  sourcemap: false,
  target: ['chrome120']
});

const index = await readFile(join(srcDir, 'index.html'), 'utf8');
await writeFile(join(distDir, 'index.html'), index, 'utf8');

for (const file of ['styles.css', 'icon.svg']) {
  const contents = await readFile(join(srcDir, file));
  await writeFile(join(distDir, file), contents);
}
