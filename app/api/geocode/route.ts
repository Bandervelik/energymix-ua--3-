import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');

  try {
    if (q) {
      // Forward geocoding using Open-Meteo
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&language=uk&count=5`;
      const response = await fetch(url, { cache: 'no-store' });
      
      if (!response.ok) {
        return NextResponse.json({ error: `Open-Meteo API error: ${response.status}` }, { status: response.status });
      }
      
      const data = await response.json();
      
      // Map to expected format
      const results = (data.results || []).map((item: any) => {
        const parts = [item.name, item.admin1, item.country].filter(Boolean);
        return {
          lat: item.latitude.toString(),
          lon: item.longitude.toString(),
          display_name: parts.join(', ')
        };
      });
      
      return NextResponse.json(results);
      
    } else if (lat && lon) {
      // Reverse geocoding using BigDataCloud
      const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=uk`;
      const response = await fetch(url, { cache: 'no-store' });
      
      if (!response.ok) {
        return NextResponse.json({ error: `BigDataCloud API error: ${response.status}` }, { status: response.status });
      }
      
      const data = await response.json();
      
      // Construct a display name
      const parts = [data.locality, data.city, data.principalSubdivision, data.countryName].filter(Boolean);
      // Remove duplicates
      const uniqueParts = Array.from(new Set(parts));
      
      return NextResponse.json({
        display_name: uniqueParts.join(', ') || 'Unknown location'
      });
      
    } else {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Geocoding proxy error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch geocoding data' }, { status: 500 });
  }
}
