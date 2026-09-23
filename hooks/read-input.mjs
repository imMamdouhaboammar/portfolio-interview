// Shared by the hooks: read the hook payload from stdin and pull the file
// path out of it. Any malformed payload yields null, and the hook then exits
// 0 so it never gets in the way of unrelated work.

export async function readTarget() {
  let raw = '';
  for await (const chunk of process.stdin) raw += chunk;
  try {
    const input = JSON.parse(raw);
    const file = input?.tool_input?.file_path;
    return typeof file === 'string' && file ? { input, file } : null;
  } catch {
    return null;
  }
}
