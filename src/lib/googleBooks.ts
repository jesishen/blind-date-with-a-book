export async function fetchCoverUrl(
  title: string,
  author: string
): Promise<string | null> {
  try {
    const params = new URLSearchParams({ title, author });
    const res = await fetch(`/api/book-cover?${params.toString()}`);
    if (!res.ok) return null;

    const data = await res.json();
    return data.coverUrl ?? null;
  } catch {
    return null;
  }
}