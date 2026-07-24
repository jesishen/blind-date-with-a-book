import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title");
  const author = searchParams.get("author");

  if (!title || !author) {
    return NextResponse.json(
      { error: "title and author are required" },
      { status: 400 }
    );
  }

  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  const query = encodeURIComponent(`intitle:${title} inauthor:${author}`);
  const url = apiKey
    ? `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=1&key=${apiKey}`
    : `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=1`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      return NextResponse.json({ coverUrl: null });
    }

    const data = await res.json();
    const item = data.items?.[0];
    const imageLinks = item?.volumeInfo?.imageLinks;
    const raw = imageLinks?.thumbnail || imageLinks?.smallThumbnail;

    return NextResponse.json({
      coverUrl: raw ? raw.replace(/^http:/, "https:") : null,
    });
  } catch {
    return NextResponse.json({ coverUrl: null });
  }
}