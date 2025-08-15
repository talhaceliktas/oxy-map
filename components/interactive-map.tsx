"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, Leaf, Car, TreePine, Wind } from "lucide-react";
import { RouteStepsDisplay } from "./route-steps-display";
import type { google } from "google-maps";
import { useAuth } from "@/components/auth/auth-provider";

declare global {
  interface Window {
    google: typeof google;
  }
}

interface Location {
  lat: number;
  lng: number;
  address: string;
}

interface Place {
  name: string;
  vicinity: string;
  geometry: {
    location: { lat: number; lng: number };
  };
  rating?: number;
}

interface Route {
  summary: string;
  legs: Array<{
    distance: { text: string; value: number };
    duration: { text: string; value: number };
    start_address: string;
    end_address: string;
    steps: Array<{
      html_instructions: string;
      distance: { text: string; value: number };
      duration: { text: string; value: number };
      maneuver?: string;
      travel_mode: string;
      transit_details?: any;
    }>;
  }>;
  carbonFootprint: number;
  ecoScore: number;
  overview_polyline: { points: string };
}

interface InteractiveMapProps {
  location: Location;
  places: Place[];
}

export function InteractiveMap({ location, places }: InteractiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [routes, setRoutes] = useState<{ [key: string]: Route[] }>({});
  const [selectedMode, setSelectedMode] = useState<
    "driving" | "walking" | "bicycling" | "transit"
  >("walking");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentRoute, setCurrentRoute] = useState<Route | null>(null);
  const [pendingTrip, setPendingTrip] = useState<any>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<{ [key: string]: number }>(
    {}
  ); // Track selected route index for each place
  const { user } = useAuth();

  useEffect(() => {
    if (!mapRef.current || map) return;

    const initMap = () => {
      try {
        const googleMap = new window.google.maps.Map(mapRef.current!, {
          center: { lat: location.lat, lng: location.lng },
          zoom: 13,
          styles: [
            {
              featureType: "poi.park",
              elementType: "geometry",
              stylers: [{ color: "#a5d6a7" }],
            },
            {
              featureType: "landscape.natural",
              elementType: "geometry",
              stylers: [{ color: "#e8f5e8" }],
            },
          ],
        });

        new window.google.maps.Marker({
          position: { lat: location.lat, lng: location.lng },
          map: googleMap,
          title: "Your Location",
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#22c55e",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          },
        });

        places.forEach((place, index) => {
          const marker = new window.google.maps.Marker({
            position: place.geometry.location,
            map: googleMap,
            title: place.name,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 6,
              fillColor: "#16a34a",
              fillOpacity: 0.8,
              strokeColor: "#ffffff",
              strokeWeight: 1,
            },
          });

          marker.addListener("click", () => {
            setSelectedPlace(place);
          });
        });

        setMap(googleMap);
      } catch (err) {
        console.error("Error initializing map:", err);
        setError("Failed to initialize map");
      }
    };

    if (window.google) {
      initMap();
    } else {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_API_KEY}&libraries=places`;
      script.async = true;
      script.onload = initMap;
      script.onerror = () => setError("Failed to load Google Maps");
      document.head.appendChild(script);
    }
  }, [location, places, map]);

  const fetchRoutes = async (destination: Place, mode: string) => {
    setLoading(true);
    setError(null);

    setRoutes({});
    setSelectedRoute({});
    setCurrentRoute(null);

    // Clear existing map renderers
    if (map) {
      const existingRenderers = (map as any)._renderers || [];
      existingRenderers.forEach((renderer: any) => renderer.setMap(null));
      (map as any)._renderers = [];
    }

    try {
      const origin = `${location.lat},${location.lng}`;
      const dest = `${destination.geometry.location.lat},${destination.geometry.location.lng}`;

      const response = await fetch(
        `/api/directions?origin=${origin}&destination=${dest}&mode=${mode}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.routes && data.routes.length > 0) {
        setRoutes((prev) => ({
          ...prev,
          [`${destination.name}-${mode}`]: data.routes,
        }));

        setCurrentRoute(data.routes[0]);

        if (map && window.google) {
          try {
            const directionsService =
              new window.google.maps.DirectionsService();
            const directionsRenderer =
              new window.google.maps.DirectionsRenderer({
                polylineOptions: {
                  strokeColor:
                    mode === "walking" || mode === "bicycling"
                      ? "#22c55e"
                      : mode === "transit"
                      ? "#3b82f6"
                      : "#f59e0b",
                  strokeWeight: 4,
                  strokeOpacity: 0.8,
                },
                suppressMarkers: false,
                preserveViewport: false,
              });

            directionsRenderer.setMap(map);

            const travelMode =
              mode === "driving"
                ? window.google.maps.TravelMode.DRIVING
                : mode === "walking"
                ? window.google.maps.TravelMode.WALKING
                : mode === "bicycling"
                ? window.google.maps.TravelMode.BICYCLING
                : window.google.maps.TravelMode.TRANSIT;

            directionsService.route(
              {
                origin: { lat: location.lat, lng: location.lng },
                destination: destination.geometry.location,
                travelMode: travelMode,
              },
              (result, status) => {
                if (
                  status === window.google.maps.DirectionsStatus.OK &&
                  result
                ) {
                  directionsRenderer.setDirections(result);

                  if (!(map as any)._renderers) (map as any)._renderers = [];
                  (map as any)._renderers.push(directionsRenderer);
                } else {
                  console.error("Directions request failed:", status);
                  setError("Failed to get directions");
                }
              }
            );
          } catch (err) {
            console.error("Error rendering route:", err);
            setError("Failed to display route");
          }
        }
      } else {
        setError("No routes found");
      }
    } catch (error) {
      console.error("Failed to fetch routes:", error);
      setError(
        error instanceof Error ? error.message : "Failed to fetch routes"
      );
    } finally {
      setLoading(false);
    }
  };

  const confirmTrip = async () => {
    if (!pendingTrip) return;

    setSaving(true);
    try {
      const response = await fetch("/api/user/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pendingTrip),
      });

      if (!response.ok) {
        throw new Error("Failed to save trip");
      }

      setShowConfirmation(false);
      setPendingTrip(null);
      setRoutes({}); // Clear all routes to close the options menu
      setSelectedRoute({}); // Clear selected route state
      setCurrentRoute(null); // Clear current route display

      // Clear map renderers
      if (map) {
        const existingRenderers = (map as any)._renderers || [];
        existingRenderers.forEach((renderer: any) => renderer.setMap(null));
        (map as any)._renderers = [];
      }
    } catch (err) {
      console.error("Failed to save trip:", err);
      setError("Failed to save trip");
    } finally {
      setSaving(false);
    }
  };

  const cancelTrip = () => {
    setShowConfirmation(false);
    setPendingTrip(null);
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case "walking":
        return <TreePine className="h-4 w-4" />;
      case "bicycling":
        return <Wind className="h-4 w-4" />;
      case "driving":
        return <Car className="h-4 w-4" />;
      case "transit":
        return <Navigation className="h-4 w-4" />;
      default:
        return <MapPin className="h-4 w-4" />;
    }
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

  return (
    <div className="space-y-6">
      {error && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="pt-6">
            <p className="text-destructive text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      <Card className="border-0 shadow-lg bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 bg-primary rounded-lg">
              <MapPin className="h-5 w-5 text-primary-foreground" />
            </div>
            Interactive Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div ref={mapRef} className="w-full h-96 rounded-xl shadow-inner" />
        </CardContent>
      </Card>

      {currentRoute && currentRoute.legs[0] && (
        <RouteStepsDisplay
          steps={currentRoute.legs[0].steps}
          mode={selectedMode}
          summary={currentRoute.summary}
          totalDistance={currentRoute.legs[0].distance.text}
          totalDuration={currentRoute.legs[0].duration.text}
          carbonFootprint={currentRoute.carbonFootprint}
          ecoScore={currentRoute.ecoScore}
        />
      )}

      <Card className="border-0 shadow-lg bg-card">
        <CardHeader>
          <CardTitle>Transportation Mode</CardTitle>
          <CardDescription>Choose your preferred way to travel</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(["walking", "bicycling", "transit", "driving"] as const).map(
              (mode) => (
                <Button
                  key={mode}
                  variant={selectedMode === mode ? "default" : "outline"}
                  onClick={() => setSelectedMode(mode)}
                  className={`h-auto p-4 flex flex-col items-center gap-2 transition-all ${
                    selectedMode === mode
                      ? "shadow-lg scale-105"
                      : "hover:shadow-md hover:scale-102"
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg ${
                      selectedMode === mode
                        ? "bg-primary-foreground/20"
                        : "bg-muted"
                    }`}
                  >
                    {getModeIcon(mode)}
                  </div>
                  <span className="text-sm capitalize font-medium">{mode}</span>
                  <Badge variant="secondary" className={getModeColor(mode)}>
                    {mode === "walking" || mode === "bicycling"
                      ? "0 CO₂"
                      : mode === "transit"
                      ? "Low CO₂"
                      : "High CO₂"}
                  </Badge>
                </Button>
              )
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 bg-primary rounded-lg">
              <TreePine className="h-5 w-5 text-primary-foreground" />
            </div>
            Nearby Green Spaces
          </CardTitle>
          <CardDescription>
            Discover parks and nature areas with eco-friendly routes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showConfirmation && pendingTrip && (
            <Card className="border-primary/50 bg-primary/10 mb-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Navigation className="h-5 w-5" />
                  Confirm Your Trip
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">From:</span>
                    <div className="font-medium">{pendingTrip.origin}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">To:</span>
                    <div className="font-medium">{pendingTrip.destination}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Mode:</span>
                    <div className="font-medium capitalize">
                      {pendingTrip.mode}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Distance:</span>
                    <div className="font-medium">
                      {pendingTrip.distance.toFixed(1)} km
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Duration:</span>
                    <div className="font-medium">
                      {Math.round(pendingTrip.duration)} min
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">CO₂ Impact:</span>
                    <div className="font-medium text-primary">
                      {pendingTrip.carbon_footprint === 0
                        ? "0 kg"
                        : `${pendingTrip.carbon_footprint} kg`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="bg-primary/20 text-primary"
                  >
                    <Leaf className="h-3 w-3 mr-1" />
                    Eco Score: {pendingTrip.eco_score}/100
                  </Badge>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={confirmTrip}
                    disabled={saving}
                    className="flex-1"
                  >
                    {saving ? "Saving..." : "Confirm Trip"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={cancelTrip}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {places.map((place, index) => {
              const routeKey = `${place.name}-${selectedMode}`;
              const placeRoutes = routes[routeKey] || [];

              return (
                <div
                  key={index}
                  className="border border-border rounded-lg p-4 space-y-3 bg-card"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{place.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {place.vicinity}
                      </p>
                    </div>
                    <Button
                      onClick={() => fetchRoutes(place, selectedMode)}
                      disabled={loading}
                      size="sm"
                    >
                      <Navigation className="h-4 w-4 mr-2" />
                      {loading ? "Loading..." : "Get Route"}
                    </Button>
                  </div>

                  {placeRoutes.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground mb-2">
                        Choose your route ({placeRoutes.length} option
                        {placeRoutes.length > 1 ? "s" : ""} available):
                      </div>
                      {placeRoutes.map((route, routeIndex) => {
                        const isSelected =
                          (selectedRoute[routeKey] || 0) === routeIndex;
                        const isLowestCarbon = placeRoutes.every(
                          (r) => route.carbonFootprint <= r.carbonFootprint
                        );

                        return (
                          <div
                            key={routeIndex}
                            className={`bg-muted/50 rounded p-3 cursor-pointer transition-colors ${
                              isSelected
                                ? "ring-2 ring-primary bg-primary/5"
                                : "hover:bg-muted/70"
                            }`}
                            onClick={() => {
                              setSelectedRoute((prev) => ({
                                ...prev,
                                [routeKey]: routeIndex,
                              }));
                              setCurrentRoute(route);

                              if (map && window.google) {
                                const existingRenderers =
                                  (map as any)._renderers || [];
                                existingRenderers.forEach((renderer: any) =>
                                  renderer.setMap(null)
                                );

                                const directionsService =
                                  new window.google.maps.DirectionsService();
                                const directionsRenderer =
                                  new window.google.maps.DirectionsRenderer({
                                    polylineOptions: {
                                      strokeColor: isLowestCarbon
                                        ? "#22c55e"
                                        : selectedMode === "transit"
                                        ? "#3b82f6"
                                        : "#f59e0b",
                                      strokeWeight: 4,
                                      strokeOpacity: 0.8,
                                    },
                                    suppressMarkers: false,
                                    preserveViewport: false,
                                  });

                                directionsRenderer.setMap(map);

                                const travelMode =
                                  selectedMode === "driving"
                                    ? window.google.maps.TravelMode.DRIVING
                                    : selectedMode === "walking"
                                    ? window.google.maps.TravelMode.WALKING
                                    : selectedMode === "bicycling"
                                    ? window.google.maps.TravelMode.BICYCLING
                                    : window.google.maps.TravelMode.TRANSIT;

                                directionsService.route(
                                  {
                                    origin: {
                                      lat: location.lat,
                                      lng: location.lng,
                                    },
                                    destination: place.geometry.location,
                                    travelMode: travelMode,
                                  },
                                  (result, status) => {
                                    if (
                                      status ===
                                        window.google.maps.DirectionsStatus
                                          .OK &&
                                      result
                                    ) {
                                      directionsRenderer.setDirections(result);
                                      if (!(map as any)._renderers)
                                        (map as any)._renderers = [];
                                      (map as any)._renderers.push(
                                        directionsRenderer
                                      );
                                    }
                                  }
                                );
                              }
                            }}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">
                                {route.summary || `Route ${routeIndex + 1}`}
                              </span>
                              <div className="flex items-center gap-2">
                                {isLowestCarbon && (
                                  <Badge
                                    variant="secondary"
                                    className="bg-primary/20 text-primary text-xs"
                                  >
                                    Lowest CO₂
                                  </Badge>
                                )}
                                <Badge
                                  variant="secondary"
                                  className="bg-primary/20 text-primary"
                                >
                                  <Leaf className="h-3 w-3 mr-1" />
                                  {route.ecoScore}/100
                                </Badge>
                                {isSelected && (
                                  <Badge variant="default" className="text-xs">
                                    Selected
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">
                                  Distance:
                                </span>
                                <div className="font-medium">
                                  {route.legs[0]?.distance?.text}
                                </div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">
                                  Duration:
                                </span>
                                <div className="font-medium">
                                  {route.legs[0]?.duration?.text}
                                </div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">
                                  CO₂:
                                </span>
                                <div
                                  className={`font-medium ${
                                    isLowestCarbon
                                      ? "text-primary"
                                      : "text-destructive"
                                  }`}
                                >
                                  {route.carbonFootprint === 0
                                    ? "0 kg"
                                    : `${route.carbonFootprint} kg`}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {placeRoutes.length > 0 && (
                        <Button
                          onClick={() => {
                            const selectedRouteIndex =
                              selectedRoute[routeKey] || 0;
                            const route = placeRoutes[selectedRouteIndex];

                            if (route) {
                              const getUserId = () => {
                                if (user?.id) return user.id;
                                return "anonymous";
                              };

                              const tripData = {
                                user_id: getUserId(),
                                origin: location.address,
                                destination: place.name,
                                origin_coords: {
                                  lat: location.lat,
                                  lng: location.lng,
                                },
                                destination_coords: {
                                  lat: place.geometry.location.lat,
                                  lng: place.geometry.location.lng,
                                },
                                mode: selectedMode,
                                distance: route.legs[0]?.distance?.value
                                  ? route.legs[0].distance.value / 1000
                                  : 0,
                                duration: route.legs[0]?.duration?.value
                                  ? route.legs[0].duration.value / 60
                                  : 0,
                                carbon_footprint: route.carbonFootprint || 0,
                                eco_score: route.ecoScore || 50,
                                route_data: {
                                  steps: route.legs[0]?.steps,
                                  summary: route.summary,
                                  overview_polyline: route.overview_polyline,
                                },
                              };

                              setPendingTrip(tripData);
                              setShowConfirmation(true);
                            }
                          }}
                          className="w-full mt-2"
                          size="sm"
                        >
                          Confirm Selected Route
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
