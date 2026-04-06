import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q) {
    return NextResponse.json({ error: 'Missing query' }, { status: 400 });
  }

  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&language=uk&count=5`;
    const res = await fetch(url);
    
    if (!res.ok) {
      throw new Error(`Open-Meteo API responded with status: ${res.status}`);
    }
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Search proxy error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch search results' }, { status: 500 });
  }
}
