import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');

  if (!lat || !lon) {
    return NextResponse.json({ error: 'Missing lat or lon' }, { status: 400 });
  }

  try {
    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=2023-01-01&end_date=2023-12-31&daily=shortwave_radiation_sum,precipitation_sum,wind_speed_10m_max&timezone=auto`;
    const res = await fetch(url);
    
    if (!res.ok) {
      throw new Error(`Open-Meteo API responded with status: ${res.status}`);
    }
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Climate proxy error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch climate data' }, { status: 500 });
  }
}
