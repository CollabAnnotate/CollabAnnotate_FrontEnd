// Lit le JSON envoyé par Claude Code sur l'entrée standard d'un hook.
export async function readStdinJson() {
  let data = '';
  for await (const chunk of process.stdin) data += chunk;
  return data.trim() ? JSON.parse(data) : {};
}
