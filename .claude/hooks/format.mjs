// Hook PostToolUse (Edit / Write) : formate avec Prettier le fichier que Claude vient de modifier.
// Respecte .prettierrc.json et .prettierignore ; silencieux pour les fichiers non gérés par Prettier.
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readStdinJson } from './stdin.mjs';

export async function formatFile(filePath) {
  const prettier = await import('prettier');
  const { ignored, inferredParser } = await prettier.getFileInfo(filePath, {
    ignorePath: new URL('../../.prettierignore', import.meta.url),
  });
  if (ignored || !inferredParser) return false;
  const source = await readFile(filePath, 'utf8');
  // Config la plus proche du fichier, sinon celle du dépôt
  const repoConfig = fileURLToPath(new URL('../../.prettierrc.json', import.meta.url));
  const options =
    (await prettier.resolveConfig(filePath)) ?? (await prettier.resolveConfig(repoConfig)) ?? {};
  const formatted = await prettier.format(source, { ...options, filepath: filePath });
  if (formatted === source) return false;
  await writeFile(filePath, formatted);
  return true;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const payload = await readStdinJson();
  const filePath = payload.tool_input?.file_path;
  if (filePath) {
    try {
      await formatFile(filePath);
    } catch (error) {
      // Erreur de syntaxe : on la renvoie à Claude pour qu'il la corrige tout de suite
      process.stderr.write(`Prettier n'a pas pu formater ${filePath} :\n${error.message}\n`);
      process.exit(2);
    }
  }
}
