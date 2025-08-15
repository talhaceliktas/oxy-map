import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      user_id,
      origin,
      destination,
      origin_coords,
      destination_coords,
      mode,
      distance,
      duration,
      carbon_footprint,
      eco_score,
      route_data,
    } = body;

    const finalUserId = user_id && user_id !== "anonymous" ? user_id : null;

    const originLat =
      origin_coords?.lat || Number.parseFloat(origin.split(",")[0]) || 0;
    const originLng =
      origin_coords?.lng || Number.parseFloat(origin.split(",")[1]) || 0;
    const destLat =
      destination_coords?.lat ||
      Number.parseFloat(destination.split(",")[0]) ||
      0;
    const destLng =
      destination_coords?.lng ||
      Number.parseFloat(destination.split(",")[1]) ||
      0;

    const { data, error } = await supabase
      .from("route_history")
      .insert({
        user_id: finalUserId, // This will be null for anonymous users
        origin_address:
          typeof origin === "string" ? origin : `${originLat},${originLng}`,
        destination_address:
          typeof destination === "string"
            ? destination
            : `${destLat},${destLng}`,
        origin_lat: originLat,
        origin_lng: originLng,
        destination_lat: destLat,
        destination_lng: destLng,
        transport_mode: mode,
        distance_km: Number.parseFloat(distance) || 0,
        duration_minutes: Number.parseInt(duration) || 0,
        carbon_footprint_kg: Number.parseFloat(carbon_footprint) || 0,
        eco_score: Number.parseInt(eco_score) || 0,
        route_data: route_data || null,
        created_at: new Date().toISOString(),
      })
      .select();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, trip: data[0] });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const user_id = searchParams.get("user_id");

  const queryUserId = !user_id || user_id === "anonymous" ? null : user_id;

  try {
    let query = supabase
      .from("route_history")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    if (queryUserId) {
      query = query.eq("user_id", queryUserId);
    } else {
      query = query.is("user_id", null);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to fetch trips" },
        { status: 500 }
      );
    }

    return NextResponse.json({ trips: data });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
