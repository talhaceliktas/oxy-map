import { type NextRequest, NextResponse } from "next/server";

const NEXT_PUBLIC_GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY!;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const origins = searchParams.get("origins");
  const destinations = searchParams.get("destinations");
  const mode = searchParams.get("mode") || "driving";

  if (!origins || !destinations) {
    return NextResponse.json(
      { error: "Origins and destinations are required" },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(
        origins
      )}&destinations=${encodeURIComponent(
        destinations
      )}&mode=${mode}&units=metric&key=${NEXT_PUBLIC_GOOGLE_API_KEY}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch distance matrix");
    }

    const data = await response.json();

    // Add carbon footprint calculations
    const enhancedData = {
      ...data,
      rows: data.rows?.map((row: any) => ({
        ...row,
        elements: row.elements?.map((element: any) => {
          if (element.status === "OK") {
            const distance = element.distance?.value || 0; // in meters
            let carbonFootprint = 0;

            switch (mode) {
              case "driving":
                carbonFootprint = (distance / 1000) * 0.21;
                break;
              case "walking":
              case "bicycling":
                carbonFootprint = 0;
                break;
              case "transit":
                carbonFootprint = (distance / 1000) * 0.05;
                break;
            }

            return {
              ...element,
              carbonFootprint: Math.round(carbonFootprint * 100) / 100,
              ecoScore:
                carbonFootprint === 0
                  ? 100
                  : Math.max(0, 100 - carbonFootprint * 10),
            };
          }
          return element;
        }),
      })),
    };

    return NextResponse.json(enhancedData);
  } catch (error) {
    console.error("Distance Matrix API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch distance matrix" },
      { status: 500 }
    );
  }
}
