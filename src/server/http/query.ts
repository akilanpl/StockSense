export function readQuery(request: Request) {
  const params = new URL(request.url).searchParams;
  const query: Record<string, string> = {};

  for (const [key, value] of params) {
    if (value.trim()) {
      query[key] = value.trim();
    }
  }

  return query;
}
