// Hook PreToolUse (Edit / Write) : les fichiers .env contiennent des secrets et se modifient à la main.
import { basename } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readStdinJson } from './stdin.mjs';

export function check(filePath) {
  const name = basename(filePath);
  if (name === '.env' || (name.startsWith('.env.') && name !== '.env.example')) {
    return 'les fichiers .env contiennent des secrets : les modifier à la main, pas via Claude.';
  }
  return null;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const payload = await readStdinJson();
  const filePath = payload.tool_input?.file_path ?? '';
  const reason = filePath ? check(filePath) : null;
  if (reason) {
    process.stderr.write(`Écriture bloquée par le hook guard-files : ${reason}\n`);
    process.exit(2);
  }
}
