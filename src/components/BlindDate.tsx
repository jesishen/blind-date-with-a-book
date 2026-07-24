"use client";

import { useState } from "react";
import { Book } from "@/types/book";
import { BookSlot } from "./BookSlot";
import { fetchCoverUrl } from "@/lib/googleBooks";

export function BlindDate({
  books,
  onMarkRevealed,
  onStart,
}: {
  books: Book[];
  onMarkRevealed: (id: string) => void;
  onStart?: () => void;
}) {
  const [current, setCurrent] = useState<Book | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [coverLoading, setCoverLoading] = useState(false);

  function pickRandomBook(): Book | null {
    if (books.length === 0) return null;
    return books[Math.floor(Math.random() * books.length)];
  }

  async function fetchTeaser(book: Book): Promise<string[]> {
    const res = await fetch("/api/generate-teaser", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: book.title,
        author: book.author,
        description: book.description,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Something went wrong");
    return data.keywords as string[];
  }

  async function handleSurpriseMe() {
    if (loading) return;
    const picked = pickRandomBook();
    if (!picked) return;

    onStart?.();
    setError(null);
    setRevealed(false);
    setCoverUrl(null);
    setCurrent(picked);
    setLoading(true);

    try {
      const keywords = await fetchTeaser(picked);
      setCurrent({ ...picked, teaserKeywords: keywords });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate teaser"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleUnwrapComplete() {
    if (!current) return;
    setRevealed(true);
    onMarkRevealed(current.id);

    setCoverLoading(true);
    const url = await fetchCoverUrl(current.title, current.author);
    setCoverUrl(url);
    setCoverLoading(false);
  }

  if (!current) {
    return (
      <div className="flex flex-col items-center gap-3">
        <button
          onClick={handleSurpriseMe}
          disabled={books.length === 0 || loading}
          className="rounded-full bg-amber-800 px-6 py-3 text-base font-medium text-white transition hover:bg-amber-900 disabled:opacity-50"
        >
          {loading ? "Choosing…" : "Surprise me"}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  const ready = !!current.teaserKeywords;

  return (
    <div className="flex flex-col items-center gap-6">
      {error && <p className="text-sm text-red-600">{error}</p>}

      <BookSlot
        book={current}
        ready={ready}
        coverUrl={coverUrl}
        coverLoading={coverLoading}
        onUnwrapComplete={handleUnwrapComplete}
      />

      {loading && <p className="text-sm text-stone-500">Generating teaser…</p>}
    </div>
  );
}