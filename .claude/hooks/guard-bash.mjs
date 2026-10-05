// Hook PreToolUse (Bash / PowerShell) : bloque les commandes git / gh contraires au workflow.
// Entrée : JSON du hook sur stdin ({ tool_input: { command }, cwd }).
// Sortie : exit 0 = autorisé ; exit 2 = bloqué, le message sur stderr est renvoyé à Claude.
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { readStdinJson } from './stdin.mjs';

const PROTECTED_BRANCHES = ['main', 'master'];
// Fichiers à ne jamais committer (.env.example reste autorisé)
const FORBIDDEN_PATHS =
  /(^|[\s/\\])(\.env(?!\.example)\S*|dist([/\\]\S*)?|coverage([/\\]\S*)?)(\s|$)/;

export function currentBranch(cwd) {
  try {
    return execFileSync('git', ['branch', '--show-current'], {
      cwd,
      encoding: 'utf8',
      timeout: 5000,
    }).trim();
  } catch {
    return '';
  }
}

// Renvoie le motif du refus, ou null si la commande est autorisée
export function check(command, { branch = () => currentBranch() } = {}) {
  for (const raw of command.split(/&&|\|\||;|\n/)) {
    const words = raw.trim().split(/\s+/);
    if (words.length < 2) continue;
    const [tool, sub] = words;

    if (tool === 'git' && words.includes('--no-verify')) {
      return "`--no-verify` contourne les vérifications : corriger le problème plutôt que de l'ignorer.";
    }

    if (tool === 'git' && sub === 'push') {
      if (words.includes('--force') || words.includes('-f')) {
        return '`git push --force` est interdit ; utiliser `--force-with-lease` sur sa propre branche.';
      }
      // git push [options] [remote] [refspec…] : la cible est la partie droite de chaque refspec
      const args = words.slice(2).filter((w) => !w.startsWith('-'));
      let refspecs = args.slice(1);
      if (refspecs.length === 0 || refspecs.some((r) => r.split(':').at(-1) === 'HEAD')) {
        refspecs = [...refspecs, branch()];
      }
      if (refspecs.some((r) => PROTECTED_BRANCHES.includes(r.split(':').at(-1)))) {
        return "Pousser sur `main` est interdit : passer par une branche d'issue et une PR (skill /merge).";
      }
    }

    if (tool === 'git' && sub === 'add') {
      if (words.includes('-f') || words.includes('--force')) {
        return '`git add --force` contourne le .gitignore : ne pas versionner ce fichier.';
      }
      if (FORBIDDEN_PATHS.test(` ${words.slice(2).join(' ')} `)) {
        return 'Fichier interdit dans git (.env, dist/, coverage/) : il doit rester local.';
      }
    }

    if (tool === 'gh' && sub === 'pr' && words[2] === 'merge' && !words.includes('--squash')) {
      return "Les PR se mergent en squash : `gh pr merge --squash --delete-branch`, après accord de l'utilisateur.";
    }
  }
  return null;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const payload = await readStdinJson();
  const reason = check(payload.tool_input?.command ?? '', {
    branch: () => currentBranch(payload.cwd),
  });
  if (reason) {
    process.stderr.write(`Commande bloquée par le hook guard-bash : ${reason}\n`);
    process.exit(2);
  }
}
