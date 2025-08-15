"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Leaf, MapPin, Clock, TrendingDown } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";

interface Trip {
  id: string;
  origin_address: string;
  destination_address: string;
  transportation_mode: string;
  distance_km: number;
  duration_minutes: number;
  carbon_footprint_kg: number;
  eco_score: number;
  created_at: string;
}

export function UserTripHistory() {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  const getSessionId = () => {
    if (typeof window !== "undefined") {
      let sessionId = localStorage.getItem("session_user_id");
      if (!sessionId) {
        sessionId = crypto.randomUUID();
        localStorage.setItem("session_user_id", sessionId);
      }
      return sessionId;
    }
    return null;
  };

  useEffect(() => {
    fetchTrips();
  }, [user]);

  const fetchTrips = async () => {
    try {
      let url = "/api/user/trips";
      if (user?.id) {
        // Authenticated user
        url += `?user_id=${user.id}`;
      } else {
        // Anonymous user - use session ID
        const sessionId = getSessionId();
        if (sessionId) {
          url += `?session_id=${sessionId}`;
        }
      }

      const response = await fetch(url);
      const data = await response.json();
      setTrips(data.trips || []);
    } catch (error) {
      console.error("Failed to fetch trips:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTotalCarbonSaved = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    return trips
      .filter((trip) => {
        const tripDate = new Date(trip.created_at);
        return (
          tripDate.getMonth() === currentMonth &&
          tripDate.getFullYear() === currentYear
        );
      })
      .reduce((total, trip) => {
        // Calculate carbon saved compared to driving
        const drivingEmissions = trip.distance_km * 0.21; // kg CO₂ per km for average car
        const actualEmissions = trip.carbon_footprint_kg;
        return total + Math.max(0, drivingEmissions - actualEmissions);
      }, 0);
  };

  const getMonthlyCarbonEmissions = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    return trips
      .filter((trip) => {
        const tripDate = new Date(trip.created_at);
        return (
          tripDate.getMonth() === currentMonth &&
          tripDate.getFullYear() === currentYear
        );
      })
      .reduce((total, trip) => total + trip.carbon_footprint_kg, 0);
  };

  const getModeColor = (mode: string) => {
    switch (mode) {
      case "walking":
      case "bicycling":
        return "bg-green-100 text-green-800";
      case "transit":
        return "bg-blue-100 text-blue-800";
      case "driving":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        Loading trip history...
      </div>
    );
  }

  return (
    <Card className="bg-card border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Recent Trips
        </CardTitle>
        {trips.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-primary">
              <TrendingDown className="h-4 w-4" />
              <span>
                Saved {getTotalCarbonSaved().toFixed(1)} kg CO₂ this month
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>
                Your monthly CO₂ emissions:{" "}
                {getMonthlyCarbonEmissions().toFixed(1)} kg
              </span>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {trips.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No trips recorded yet</p>
              <p className="text-sm">
                Start exploring green routes to see your impact!
              </p>
            </div>
          ) : (
            trips.map((trip) => (
              <div
                key={trip.id}
                className="border border-border rounded-lg p-4 bg-muted/30"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={getModeColor(trip.transportation_mode)}
                    >
                      {trip.transportation_mode}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="bg-primary/20 text-primary"
                    >
                      <Leaf className="h-3 w-3 mr-1" />
                      {trip.eco_score}/100
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(trip.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="text-sm">
                    <span className="font-medium">From:</span>{" "}
                    {trip.origin_address}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">To:</span>{" "}
                    {trip.destination_address}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                    <span>{trip.distance_km.toFixed(1)} km</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {trip.duration_minutes.toFixed(0)} min
                    </span>
                    <span className="text-primary">
                      {trip.carbon_footprint_kg === 0
                        ? "0 CO₂"
                        : `${trip.carbon_footprint_kg} kg CO₂`}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
