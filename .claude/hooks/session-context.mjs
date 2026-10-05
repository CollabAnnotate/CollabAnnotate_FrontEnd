// Hook SessionStart : rappelle à Claude où en est le travail (branche, issue, PR, CI).
// Ce qui est écrit sur stdout est ajouté au contexte ; en cas d'échec (réseau, gh absent) : silence.
import { execFileSync } from 'node:child_process';

const run = (cmd, args) => {
  try {
    return execFileSync(cmd, args, {
      encoding: 'utf8',
      timeout: 8000,
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return '';
  }
};

const branch = run('git', ['branch', '--show-current']);
if (branch) {
  const lines = [`Dépôt CollabAnnotate_FrontEnd — branche courante : ${branch}.`];
  const issueNumber = branch.match(/^\w+\/(\d+)-/)?.[1];
  if (issueNumber) {
    const issue = run('gh', ['issue', 'view', issueNumber, '--json', 'number,title,state']);
    if (issue) {
      const { number, title, state } = JSON.parse(issue);
      lines.push(`Issue liée : #${number} « ${title} » (${state}).`);
    }
  }
  const pr = run('gh', ['pr', 'view', '--json', 'number,url,statusCheckRollup']);
  if (pr) {
    const { number, url, statusCheckRollup = [] } = JSON.parse(pr);
    const checks = [...new Set(statusCheckRollup.map((c) => c.conclusion || c.status))].sort();
    lines.push(`PR ouverte : #${number} ${url} — CI : ${checks.join(', ') || 'aucune'}.`);
  } else if (['main', 'master'].includes(branch)) {
    lines.push('Sur main : démarrer une issue avec /plan-tests <n> (gh issue list --label P0).');
  }
  process.stdout.write(`${lines.join('\n')}\n`);
}
