"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Bar,
  BarChart,
} from "recharts";
import { TrendingDown, Leaf, Plus, Edit3 } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { useTheme } from "next-themes";

interface UserCarbonData {
  transportation: number;
  energy: number;
  other: number;
  month: string;
}

interface TripData {
  transport_mode: string;
  carbon_footprint_kg: number;
  created_at: string;
}

const defaultMonthlyData = [
  { month: "Jan", emissions: 2.8, saved: 0.3 },
  { month: "Feb", emissions: 2.6, saved: 0.5 },
  { month: "Mar", emissions: 2.4, saved: 0.7 },
  { month: "Apr", emissions: 2.2, saved: 0.9 },
  { month: "May", emissions: 2.0, saved: 1.1 },
  { month: "Jun", emissions: 1.8, saved: 1.3 },
];

export function CarbonFootprintChart() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [userCarbonData, setUserCarbonData] = useState<UserCarbonData>({
    transportation: 1.2,
    energy: 0.8,
    other: 0.4,
    month: new Date().toLocaleString("default", { month: "short" }),
  });
  const [tripData, setTripData] = useState<TripData[]>([]);
  const [monthlyData, setMonthlyData] = useState(defaultMonthlyData);

  useEffect(() => {
    const fetchTripData = async () => {
      try {
        const userId = user?.id || "anonymous";
        const sessionId = !user
          ? localStorage.getItem("session_user_id")
          : undefined;

        const params = new URLSearchParams();
        if (user) {
          params.append("user_id", userId);
        } else if (sessionId) {
          params.append("session_id", sessionId);
        }

        const response = await fetch(`/api/user/trips?${params.toString()}`);
        if (response.ok) {
          const trips = await response.json();
          const tripsArray = Array.isArray(trips) ? trips : [];
          console.log("[v0] Fetched trips:", tripsArray);
          console.log("[v0] Trip count:", tripsArray.length);
          if (tripsArray.length > 0) {
            console.log("[v0] Sample trip:", tripsArray[0]);
            console.log(
              "[v0] Transport modes:",
              tripsArray.map((t) => t.transport_mode)
            );
          }
          setTripData(tripsArray);

          const currentMonth = new Date().getMonth();
          const currentMonthTrips = tripsArray.filter(
            (trip: TripData) =>
              new Date(trip.created_at).getMonth() === currentMonth
          );

          // Calculate total emissions from driving/transit trips
          const totalEmissions =
            currentMonthTrips
              .filter((trip: TripData) =>
                ["driving", "transit"].includes(trip.transport_mode)
              )
              .reduce(
                (sum: number, trip: TripData) =>
                  sum + (trip.carbon_footprint_kg || 0),
                0
              ) / 1000;

          // Calculate savings from eco-friendly trips (walking, cycling)
          const totalSaved =
            currentMonthTrips
              .filter((trip: TripData) =>
                ["walking", "bicycling"].includes(trip.transport_mode)
              )
              .reduce(
                (sum: number, trip: TripData) =>
                  sum + (trip.carbon_footprint_kg || 0),
                0
              ) / 1000;

          setUserCarbonData((prev) => ({
            ...prev,
            transportation: Math.max(prev.transportation, totalEmissions),
          }));

          // Update monthly data with real data
          setMonthlyData((prev) =>
            prev.map((data, index) =>
              index === prev.length - 1
                ? {
                    ...data,
                    saved: Math.abs(totalSaved),
                    emissions: Math.max(data.emissions, totalEmissions),
                  }
                : data
            )
          );
        } else {
          console.error("Failed to fetch trips:", response.statusText);
          setTripData([]);
        }
      } catch (error) {
        console.error("Failed to fetch trip data:", error);
        setTripData([]);
      }
    };

    fetchTripData();
  }, [user]);

  const handleSaveUserData = () => {
    setIsEditing(false);

    // Update monthly data with user input
    const totalEmissions =
      userCarbonData.transportation +
      userCarbonData.energy +
      userCarbonData.other;
    setMonthlyData((prev) =>
      prev.map((data, index) =>
        index === prev.length - 1
          ? { ...data, emissions: totalEmissions }
          : data
      )
    );
  };

  const safeFilter = (mode: string) => {
    const filtered = Array.isArray(tripData)
      ? tripData.filter((t) => t.transport_mode === mode)
      : [];
    console.log(`[v0] Filtering for ${mode}:`, filtered.length, "trips found");
    return filtered;
  };

  const transportData = [
    {
      mode: "Walking",
      emissions: 0,
      trips: safeFilter("walking").length,
      saved: Math.abs(
        safeFilter("walking").reduce(
          (sum, t) => sum + (t.carbon_footprint_kg || 0),
          0
        ) / 1000
      ),
    },
    {
      mode: "Cycling",
      emissions: 0,
      trips: safeFilter("bicycling").length,
      saved: Math.abs(
        safeFilter("bicycling").reduce(
          (sum, t) => sum + (t.carbon_footprint_kg || 0),
          0
        ) / 1000
      ),
    },
    {
      mode: "Transit",
      emissions:
        safeFilter("transit").reduce(
          (sum, t) => sum + (t.carbon_footprint_kg || 0),
          0
        ) / 1000,
      trips: safeFilter("transit").length,
      saved: 0,
    },
    {
      mode: "Driving",
      emissions:
        safeFilter("driving").reduce(
          (sum, t) => sum + (t.carbon_footprint_kg || 0),
          0
        ) / 1000,
      trips: safeFilter("driving").length,
      saved: 0,
    },
  ];

  console.log("[v0] Transport data for chart:", transportData);

  const currentMonthStats = {
    totalEmissions: (
      userCarbonData.transportation +
      userCarbonData.energy +
      userCarbonData.other
    ).toFixed(1),
    totalSaved: transportData.reduce((sum, t) => sum + t.saved, 0).toFixed(1),
    totalTrips: tripData.length,
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Leaf className="h-5 w-5" />
                Your Carbon Footprint
              </CardTitle>
              <CardDescription>
                Track and manage your monthly CO₂ emissions
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? (
                <Plus className="h-4 w-4" />
              ) : (
                <Edit3 className="h-4 w-4" />
              )}
              {isEditing ? "Save" : "Edit"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 bg-muted/30 rounded-lg border border-border">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">
                  {currentMonthStats.totalEmissions}t
                </div>
                <div className="text-sm text-muted-foreground">
                  Total CO₂ this month
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {currentMonthStats.totalSaved}t
                </div>
                <div className="text-sm text-muted-foreground">
                  CO₂ saved this month
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {currentMonthStats.totalTrips}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total trips recorded
                </div>
              </div>
            </div>
          </div>

          {isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="transportation">
                  Transportation (tons CO₂)
                </Label>
                <Input
                  id="transportation"
                  type="number"
                  step="0.1"
                  value={userCarbonData.transportation}
                  onChange={(e) =>
                    setUserCarbonData((prev) => ({
                      ...prev,
                      transportation: Number.parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="energy">Energy (tons CO₂)</Label>
                <Input
                  id="energy"
                  type="number"
                  step="0.1"
                  value={userCarbonData.energy}
                  onChange={(e) =>
                    setUserCarbonData((prev) => ({
                      ...prev,
                      energy: Number.parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="other">Other (tons CO₂)</Label>
                <Input
                  id="other"
                  type="number"
                  step="0.1"
                  value={userCarbonData.other}
                  onChange={(e) =>
                    setUserCarbonData((prev) => ({
                      ...prev,
                      other: Number.parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div className="md:col-span-3 flex justify-end">
                <Button onClick={handleSaveUserData}>Save Changes</Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-muted/30 rounded-lg border border-border">
                <div className="text-2xl font-bold text-primary">
                  {userCarbonData.transportation}t
                </div>
                <div className="text-sm text-muted-foreground">
                  Transportation
                </div>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg border border-border">
                <div className="text-2xl font-bold text-primary">
                  {userCarbonData.energy}t
                </div>
                <div className="text-sm text-muted-foreground">Energy</div>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg border border-border">
                <div className="text-2xl font-bold text-primary">
                  {userCarbonData.other}t
                </div>
                <div className="text-sm text-muted-foreground">Other</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-primary" />
              Monthly Emissions Trend
            </CardTitle>
            <CardDescription>
              <span className="text-red-500 dark:text-red-400">Red areas</span>{" "}
              show CO₂ emissions,
              <span className="text-green-500 dark:text-green-400 ml-1">
                green areas
              </span>{" "}
              show CO₂ saved
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                emissions: {
                  label: "CO₂ Emissions",
                  color:
                    theme === "dark" ? "hsl(0, 84%, 60%)" : "hsl(0, 84%, 50%)",
                },
                saved: {
                  label: "CO₂ Saved",
                  color:
                    theme === "dark"
                      ? "hsl(142, 76%, 60%)"
                      : "hsl(142, 76%, 36%)",
                },
              }}
              className="h-[200px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData}>
                  <XAxis
                    dataKey="month"
                    className="text-xs"
                    tick={{
                      fill:
                        theme === "dark"
                          ? "hsl(210, 40%, 80%)"
                          : "hsl(210, 40%, 20%)",
                    }}
                  />
                  <YAxis
                    className="text-xs"
                    tick={{
                      fill:
                        theme === "dark"
                          ? "hsl(210, 40%, 80%)"
                          : "hsl(210, 40%, 20%)",
                    }}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="emissions"
                    stackId="1"
                    stroke="var(--color-emissions)"
                    fill="var(--color-emissions)"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="saved"
                    stackId="2"
                    stroke="var(--color-saved)"
                    fill="var(--color-saved)"
                    fillOpacity={0.8}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Leaf className="h-5 w-5 text-primary" />
              Transportation Breakdown
            </CardTitle>
            <CardDescription>
              Based on your {tripData.length} recorded trips this month -
              <span className="text-blue-500 dark:text-blue-400 ml-1">
                blue bars
              </span>{" "}
              show emissions,
              <span className="text-green-500 dark:text-green-400 ml-1">
                green bars
              </span>{" "}
              show savings
              {tripData.length === 0 && (
                <span className="text-amber-600 dark:text-amber-400 mt-2 text-sm">
                  No trips found. Try recording some trips first!
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {" "}
            {transportData.every((t) => t.trips === 0) ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Leaf className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No transportation data yet</p>
                  <p className="text-sm">
                    Start recording trips to see your breakdown
                  </p>
                </div>
              </div>
            ) : (
              <ChartContainer
                config={{
                  emissions: {
                    label: "Emissions (tons)",
                    color:
                      theme === "dark"
                        ? "hsl(217, 91%, 70%)"
                        : "hsl(217, 91%, 60%)",
                  },
                  saved: {
                    label: "Saved (tons)",
                    color:
                      theme === "dark"
                        ? "hsl(142, 76%, 60%)"
                        : "hsl(142, 76%, 36%)",
                  },
                }}
                className="h-[200px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={transportData}>
                    <XAxis
                      dataKey="mode"
                      className="text-xs"
                      tick={{
                        fill:
                          theme === "dark"
                            ? "hsl(210, 40%, 80%)"
                            : "hsl(210, 40%, 20%)",
                      }}
                    />
                    <YAxis
                      className="text-xs"
                      tick={{
                        fill:
                          theme === "dark"
                            ? "hsl(210, 40%, 80%)"
                            : "hsl(210, 40%, 20%)",
                      }}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar
                      dataKey="emissions"
                      fill="var(--color-emissions)"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="saved"
                      fill="var(--color-saved)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
