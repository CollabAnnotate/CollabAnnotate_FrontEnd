// @vitest-environment node
// Tests des hooks Claude Code du dépôt (lancés par Vitest avec le reste de la suite).
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { check as checkBash } from './guard-bash.mjs';
import { check as checkFile } from './guard-files.mjs';
import { formatFile } from './format.mjs';

const onBranch = (name) => ({ branch: () => name });

test.each([
  'git push origin main',
  'git push origin HEAD:main',
  'git push --force origin fix/3-route-annotate',
  'git push -f',
  'git commit --no-verify -m "wip"',
  'git add .env',
  'git add .env.local',
  'git add dist',
  'git add -f coverage/lcov.info',
  'git status && git push origin main',
  'gh pr merge 20',
  'gh pr merge 20 --merge',
])('bloque : %s', (command) => {
  expect(checkBash(command, onBranch('fix/3-route-annotate'))).not.toBeNull();
});

test.each([
  'git push -u origin HEAD',
  'git push --force-with-lease',
  'git add src .env.example',
  'git commit -m "fix: lit VITE_API_URL depuis le .env"',
  'gh pr merge 20 --squash --delete-branch',
  'npm run test:run',
])('autorise sur une branche d’issue : %s', (command) => {
  expect(checkBash(command, onBranch('fix/3-route-annotate'))).toBeNull();
});

test.each(['git push', 'git push -u origin HEAD', 'git push origin'])(
  'bloque depuis main : %s',
  (command) => {
    expect(checkBash(command, onBranch('main'))).not.toBeNull();
  },
);

test.each([
  ['.env', true],
  ['frontend/.env.production', true],
  ['.env.example', false],
  ['src/App.jsx', false],
])('guard-files %s → bloqué : %s', (path, blocked) => {
  expect(checkFile(path) !== null).toBe(blocked);
});

test('le hook bloque avec le code 2 et un message lisible', () => {
  const script = fileURLToPath(new URL('./guard-bash.mjs', import.meta.url));
  let error;
  try {
    execFileSync('node', [script], {
      input: JSON.stringify({ tool_input: { command: 'git push origin main' } }),
      encoding: 'utf8',
      stdio: 'pipe',
    });
  } catch (e) {
    error = e;
  }
  expect(error.status).toBe(2);
  expect(error.stderr).toContain('bloquée');
});

test('format.mjs applique la config Prettier du dépôt', async () => {
  const file = join(await mkdtemp(join(tmpdir(), 'hook-')), 'exemple.js');
  await writeFile(file, 'const a = {b:"c"}\n');
  expect(await formatFile(file)).toBe(true);
  expect(await readFile(file, 'utf8')).toBe("const a = { b: 'c' };\n");
});
