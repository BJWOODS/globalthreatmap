import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const NOMINATIM_USER_AGENT =
  process.env.NOMINATIM_USER_AGENT || "GlobalThreatMap/1.0 (self-hosted)";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  if (!lat || !lng) {
    return NextResponse.json(
      { error: "lat and lng parameters are required" },
      { status: 400 }
    );
  }

  try {
    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("lat", lat);
    url.searchParams.set("lon", lng);
    url.searchParams.set("format", "json");
    url.searchParams.set("zoom", "3");
    url.searchParams.set("addressdetails", "1");

    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "User-Agent": NOMINATIM_USER_AGENT,
      },
      next: { revalidate: 86400 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Reverse geocoding failed: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const countryName = data.address?.country || null;
    const countryCode = data.address?.country_code
      ? String(data.address.country_code).toUpperCase()
      : null;

    return NextResponse.json({
      countryName,
      countryCode,
      displayName: data.display_name || countryName,
    });
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    return NextResponse.json(
      { error: "Reverse geocoding failed" },
      { status: 500 }
    );
  }
}
