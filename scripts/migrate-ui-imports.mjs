import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const srcDir = path.join(root, 'src');
const from = /from\s+['"]@blinkdotnew\/ui['"]/g;
const to = "from '@/lib/ui'";

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walk(fullPath));
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

const files = await walk(srcDir);
let changed = 0;

for (const file of files) {
  const original = await readFile(file, 'utf8');
  const next = original.replace(from, to);
  if (next !== original) {
    await writeFile(file, next, 'utf8');
    changed += 1;
    console.log(`Migrated ${path.relative(root, file)}`);
  }
}

console.log(`\nUI import migration complete. Files changed: ${changed}`);
