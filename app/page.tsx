"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { LocationInput } from "@/components/location-input"
import { InteractiveMap } from "@/components/interactive-map"
import { UserMenu } from "@/components/user-menu"
import { useAuth } from "@/components/auth/auth-provider"
import { Leaf, Wind, Car, TreePine, MapPin, TrendingDown, Loader2, AlertCircle } from "lucide-react"
import { UserTripHistory } from "@/components/user-trip-history"
import { ThemeToggle } from "@/components/theme-toggle"
import { CarbonFootprintChart } from "@/components/carbon-footprint-chart"

interface Location {
  lat: number
  lng: number
  address: string
}

interface AirQualityData {
  indexes?: Array<{
    aqi: number
    aqiDisplay: string
    category: string
    color: { red: number; green: number; blue: number }
  }>
  pollutants?: Array<{
    code: string
    displayName: string
    concentration: { value: number; units: string }
  }>
}

interface Place {
  name: string
  vicinity: string
  geometry: {
    location: { lat: number; lng: number }
  }
  rating?: number
}

export default function EnvironmentalDashboard() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [location, setLocation] = useState<Location | null>(null)
  const [airQuality, setAirQuality] = useState<AirQualityData | null>(null)
  const [places, setPlaces] = useState<Place[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth")
    }
  }, [user, authLoading, router])

  const handleLocationSet = async (lat: number, lng: number, address: string) => {
    setLocation({ lat, lng, address })
    setLoading(true)
    setError(null)

    try {
      // Fetch air quality data
      const airQualityResponse = await fetch(`/api/air-quality?lat=${lat}&lng=${lng}`)
      if (airQualityResponse.ok) {
        const airQualityData = await airQualityResponse.json()
        setAirQuality(airQualityData)
      }

      // Fetch nearby places
      const placesResponse = await fetch(`/api/places?lat=${lat}&lng=${lng}`)
      if (placesResponse.ok) {
        const placesData = await placesResponse.json()
        setPlaces(placesData.results?.slice(0, 5) || [])
      }
    } catch (err) {
      setError("Failed to fetch environmental data. Please try again.")
      console.error("Data fetching error:", err)
    } finally {
      setLoading(false)
    }
  }

  const getAQIInfo = () => {
    if (!airQuality?.indexes?.[0]) {
      return { aqi: 0, category: "Unknown", color: "bg-gray-100 text-gray-800" }
    }

    const index = airQuality.indexes[0]
    const aqi = index.aqi || 0
    const category = index.category || "Unknown"

    let color = "bg-gray-100 text-gray-800"
    if (aqi <= 50) color = "bg-green-100 text-green-800"
    else if (aqi <= 100) color = "bg-yellow-100 text-yellow-800"
    else if (aqi <= 150) color = "bg-orange-100 text-orange-800"
    else color = "bg-red-100 text-red-800"

    return { aqi, category, color }
  }

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 3959 // Earth's radius in miles
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLng = ((lng2 - lng1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to auth
  }

  const aqiInfo = getAQIInfo()

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
            <UserMenu />
          </div>

          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-3 bg-primary rounded-2xl shadow-lg">
              <Leaf className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-5xl font-bold text-primary">OxyMap</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {location ? (
              <>
                Environmental insights for <strong className="text-foreground">{location.address}</strong>
              </>
            ) : (
              <>
                Welcome to OxyMap, {user?.user_metadata?.full_name || user?.email}! Monitor air quality, discover green
                spaces, and track your carbon footprint
              </>
            )}
          </p>
          {location && (
            <Button variant="outline" onClick={() => setLocation(null)} className="mt-4 shadow-sm">
              <MapPin className="mr-2 h-4 w-4" />
              Change Location
            </Button>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 p-4 border border-red-200 bg-red-50 rounded-lg text-red-800">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-lg">Loading environmental data...</span>
          </div>
        ) : location ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Air Quality Card */}
              <Card className="border-0 shadow-lg bg-card">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Wind className="h-5 w-5 text-primary" />
                      </div>
                      Air Quality
                    </CardTitle>
                    <Badge variant="secondary" className={aqiInfo.color}>
                      {aqiInfo.category}
                    </Badge>
                  </div>
                  <CardDescription>Current AQI in your area</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary">{aqiInfo.aqi}</div>
                    <div className="text-sm text-muted-foreground">AQI Score</div>
                  </div>
                  <Progress value={Math.min(aqiInfo.aqi, 300)} max={300} className="h-3" />
                  {airQuality?.pollutants && (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {airQuality.pollutants.slice(0, 2).map((pollutant, index) => (
                        <div key={index}>
                          <div className="font-medium">{pollutant.code}</div>
                          <div className="text-muted-foreground">
                            {pollutant.concentration.value.toFixed(1)} {pollutant.concentration.units}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Green Spaces Card */}
              <Card className="border-0 shadow-lg bg-card">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <TreePine className="h-5 w-5 text-primary" />
                    </div>
                    Green Spaces
                  </CardTitle>
                  <CardDescription>Parks and nature areas nearby</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {places.length > 0 ? (
                      places.map((place, index) => {
                        const distance = calculateDistance(
                          location.lat,
                          location.lng,
                          place.geometry.location.lat,
                          place.geometry.location.lng,
                        )
                        return (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{place.name}</span>
                            </div>
                            <span className="text-sm text-muted-foreground">{distance.toFixed(1)} mi</span>
                          </div>
                        )
                      })
                    ) : (
                      <div className="text-sm text-muted-foreground text-center py-4">No parks found nearby</div>
                    )}
                  </div>
                  <Button variant="outline" className="w-full bg-transparent">
                    View All Green Spaces
                  </Button>
                </CardContent>
              </Card>

              {/* Carbon Footprint Card */}
              <Card className="border-0 shadow-lg bg-card">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 bg-destructive/10 rounded-lg">
                      <Car className="h-5 w-5 text-destructive" />
                    </div>
                    Carbon Footprint
                  </CardTitle>
                  <CardDescription>Your monthly CO₂ emissions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-destructive">2.4</div>
                    <div className="text-sm text-muted-foreground">tons CO₂</div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-primary">
                    <TrendingDown className="h-4 w-4" />
                    <span>15% lower than last month</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Transportation</span>
                      <span>1.2t</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Energy</span>
                      <span>0.8t</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Other</span>
                      <span>0.4t</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <CarbonFootprintChart />

            <Card className="border-0 shadow-lg bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 bg-primary rounded-lg">
                    <MapPin className="h-5 w-5 text-primary-foreground" />
                  </div>
                  Eco-Friendly Routes
                </CardTitle>
                <CardDescription>Find routes with the lowest carbon footprint and best air quality</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Recommended Routes</h3>
                    <div className="space-y-3">
                      {places.slice(0, 2).map((place, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/50"
                        >
                          <div>
                            <div className="font-medium">Route to {place.name}</div>
                            <div className="text-sm text-muted-foreground">Via green corridors</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-primary">-30% CO₂</div>
                            <div className="text-xs text-muted-foreground">vs main road</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-semibold">Transportation Options</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        className="h-auto p-4 flex flex-col items-center gap-2 bg-muted/50 hover:bg-muted"
                      >
                        <TreePine className="h-6 w-6 text-primary" />
                        <span className="text-sm">Walking</span>
                        <span className="text-xs text-primary">0 CO₂</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-auto p-4 flex flex-col items-center gap-2 bg-muted/50 hover:bg-muted"
                      >
                        <Wind className="h-6 w-6 text-primary" />
                        <span className="text-sm">Cycling</span>
                        <span className="text-xs text-primary">0 CO₂</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Interactive Map and User Trip History */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <InteractiveMap location={location} places={places} />
              </div>
              <div>
                <UserTripHistory />
              </div>
            </div>
          </>
        ) : (
          <LocationInput onLocationSet={handleLocationSet} loading={loading} />
        )}
      </div>
    </div>
  )
}
