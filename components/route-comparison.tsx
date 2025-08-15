"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Car, TreePine, Wind, Navigation, Leaf, Clock, MapPin } from "lucide-react"

interface Location {
  lat: number
  lng: number
  address: string
}

interface Place {
  name: string
  vicinity: string
  geometry: {
    location: { lat: number; lng: number }
  }
}

interface Route {
  summary: string
  legs: Array<{
    distance: { text: string; value: number }
    duration: { text: string; value: number }
    start_address: string
    end_address: string
  }>
  carbonFootprint: number
  ecoScore: number
  totalDistance: number
  totalDuration: number
}

interface RouteComparisonProps {
  location: Location
  destination: Place
  onRouteSelect?: (route: Route, mode: string) => void
}

export function RouteComparison({ location, destination, onRouteSelect }: RouteComparisonProps) {
  const [routes, setRoutes] = useState<{ [key: string]: Route[] }>({})
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({})
  const [selectedRoute, setSelectedRoute] = useState<{ route: Route; mode: string } | null>(null)

  const transportModes = [
    { id: "walking", name: "Walking", icon: TreePine, color: "bg-green-100 text-green-800" },
    { id: "bicycling", name: "Cycling", icon: Wind, color: "bg-green-100 text-green-800" },
    { id: "transit", name: "Transit", icon: Navigation, color: "bg-blue-100 text-blue-800" },
    { id: "driving", name: "Driving", icon: Car, color: "bg-orange-100 text-orange-800" },
  ]

  const fetchRoutes = async (mode: string) => {
    setLoading((prev) => ({ ...prev, [mode]: true }))

    try {
      const origin = `${location.lat},${location.lng}`
      const dest = `${destination.geometry.location.lat},${destination.geometry.location.lng}`

      const response = await fetch(`/api/directions?origin=${origin}&destination=${dest}&mode=${mode}`)
      const data = await response.json()

      if (data.routes) {
        setRoutes((prev) => ({ ...prev, [mode]: data.routes }))
      }
    } catch (error) {
      console.error(`Failed to fetch ${mode} routes:`, error)
    } finally {
      setLoading((prev) => ({ ...prev, [mode]: false }))
    }
  }

  const handleRouteSelect = (route: Route, mode: string) => {
    setSelectedRoute({ route, mode })
    onRouteSelect?.(route, mode)
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const formatDistance = (meters: number) => {
    const km = meters / 1000
    if (km < 1) {
      return `${meters}m`
    }
    return `${km.toFixed(1)}km`
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Route to {destination.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {transportModes.map((mode) => {
              const Icon = mode.icon
              const isLoading = loading[mode.id]
              const hasRoutes = routes[mode.id]?.length > 0

              return (
                <Button
                  key={mode.id}
                  variant="outline"
                  onClick={() => fetchRoutes(mode.id)}
                  disabled={isLoading}
                  className="h-auto p-4 flex flex-col items-center gap-2"
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-sm">{mode.name}</span>
                  {isLoading && <div className="text-xs text-muted-foreground">Loading...</div>}
                  {hasRoutes && (
                    <Badge variant="secondary" className={mode.color}>
                      Ready
                    </Badge>
                  )}
                </Button>
              )
            })}
          </div>

          {/* Route Results */}
          <div className="space-y-4">
            {Object.entries(routes).map(([mode, modeRoutes]) => {
              const modeInfo = transportModes.find((m) => m.id === mode)
              if (!modeInfo || !modeRoutes.length) return null

              const Icon = modeInfo.icon

              return (
                <div key={mode} className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {modeInfo.name} Routes
                  </h3>

                  {modeRoutes.slice(0, 2).map((route, index) => (
                    <div
                      key={index}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedRoute?.route === route && selectedRoute?.mode === mode
                          ? "border-primary bg-primary/5"
                          : "hover:border-primary/50"
                      }`}
                      onClick={() => handleRouteSelect(route, mode)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Route {index + 1}</span>
                          {route.summary && <span className="text-sm text-muted-foreground">via {route.summary}</span>}
                        </div>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          <Leaf className="h-3 w-3 mr-1" />
                          {route.ecoScore}/100
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-3">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="text-sm font-medium">{formatDistance(route.totalDistance)}</div>
                            <div className="text-xs text-muted-foreground">Distance</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="text-sm font-medium">{formatDuration(route.totalDuration)}</div>
                            <div className="text-xs text-muted-foreground">Duration</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Leaf className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="text-sm font-medium text-green-600">
                              {route.carbonFootprint === 0 ? "0 kg" : `${route.carbonFootprint} kg`}
                            </div>
                            <div className="text-xs text-muted-foreground">CO₂</div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span>Eco Score</span>
                          <span>{route.ecoScore}/100</span>
                        </div>
                        <Progress value={route.ecoScore} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>

          {selectedRoute && (
            <div className="mt-6 p-4 bg-primary/5 rounded-lg">
              <h4 className="font-semibold mb-2">Selected Route</h4>
              <p className="text-sm text-muted-foreground">
                {selectedRoute.mode} route to {destination.name} - {formatDistance(selectedRoute.route.totalDistance)}{" "}
                in {formatDuration(selectedRoute.route.totalDuration)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
