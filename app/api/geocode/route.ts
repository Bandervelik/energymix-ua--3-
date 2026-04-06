import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');

  if (!lat || !lon) {
    return NextResponse.json({ error: 'Missing lat or lon' }, { status: 400 });
  }

  try {
    // Try Nominatim first
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&accept-language=uk`;
    const res = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'EnergyMixUA/1.0'
      }
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.display_name) {
        return NextResponse.json({
          address: data.display_name,
          city: data.address?.city || data.address?.town || data.address?.village,
          country: data.address?.country
        });
      }
    }

    // Fallback to BigDataCloud
    const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=uk`;
    const bdcRes = await fetch(bdcUrl);
    
    if (bdcRes.ok) {
      const data = await bdcRes.json();
      const parts = [data.locality, data.city, data.principalSubdivision, data.countryName].filter(Boolean);
      const uniqueParts = Array.from(new Set(parts));
      const display_name = uniqueParts.join(', ');
      
      return NextResponse.json({
        address: display_name || 'Unknown location',
        city: data.city || data.locality,
        country: data.countryName
      });
    }

    throw new Error('Both geocoding services failed');
  } catch (error: any) {
    console.error('Geocoding proxy error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch address' }, { status: 500 });
  }
}
