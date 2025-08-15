import { type NextRequest, NextResponse } from "next/server";

const NEXT_PUBLIC_GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY!;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const origin = searchParams.get("origin");
  const destination = searchParams.get("destination");
  const mode = searchParams.get("mode") || "driving"; // driving, walking, bicycling, transit

  if (!origin || !destination) {
    return NextResponse.json(
      { error: "Origin and destination are required" },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(
        origin
      )}&destination=${encodeURIComponent(
        destination
      )}&mode=${mode}&alternatives=true&key=${NEXT_PUBLIC_GOOGLE_API_KEY}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch directions");
    }

    const data = await response.json();

    const routesWithCarbon = data.routes?.map((route: any) => {
      const distance = route.legs[0]?.distance?.value || 0;
      const duration = route.legs[0]?.duration?.value || 0;

      let carbonFootprint = 0;
      let ecoScore = 100;

      switch (mode) {
        case "driving":
          carbonFootprint = (distance / 1000) * 0.21;
          ecoScore = Math.max(0, 100 - carbonFootprint * 10);
          break;
        case "walking":
        case "bicycling":
          carbonFootprint = 0;
          ecoScore = 100;
          break;
        case "transit":
          carbonFootprint = (distance / 1000) * 0.05;
          ecoScore = Math.max(20, 100 - carbonFootprint * 5);
          break;
      }

      return {
        ...route,
        carbonFootprint: Math.round(carbonFootprint * 100) / 100,
        ecoScore: Math.round(ecoScore),
      };
    });

    return NextResponse.json({
      ...data,
      routes: routesWithCarbon,
    });
  } catch (error) {
    console.error("Directions API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch directions" },
      { status: 500 }
    );
  }
}
