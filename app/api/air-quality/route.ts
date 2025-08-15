import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  if (!lat || !lng) {
    return NextResponse.json(
      { error: "Latitude and longitude are required" },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      "https://airquality.googleapis.com/v1/currentConditions:lookup",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": process.env.NEXT_PUBLIC_GOOGLE_API_KEY!,
        },
        body: JSON.stringify({
          location: {
            latitude: Number.parseFloat(lat),
            longitude: Number.parseFloat(lng),
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch air quality data");
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Air quality API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch air quality data" },
      { status: 500 }
    );
  }
}
