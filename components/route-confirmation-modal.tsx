"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Clock, Leaf, Route } from "lucide-react"

interface RouteOption {
  mode: string
  distance: string
  duration: string
  carbonFootprint: number
  ecoScore: number
  steps: any[]
  routeData: any
}

interface RouteConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (selectedRoute: RouteOption) => void
  routes: RouteOption[]
  origin: string
  destination: string
}

export function RouteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  routes,
  origin,
  destination,
}: RouteConfirmationModalProps) {
  const [selectedRoute, setSelectedRoute] = useState<RouteOption | null>(null)

  if (!isOpen) return null

  const getModeIcon = (mode: string) => {
    switch (mode.toLowerCase()) {
      case "walking":
        return "🚶"
      case "cycling":
        return "🚴"
      case "transit":
        return "🚌"
      case "driving":
        return "🚗"
      default:
        return "🚶"
    }
  }

  const getModeColor = (mode: string) => {
    switch (mode.toLowerCase()) {
      case "walking":
        return "bg-green-100 text-green-800"
      case "cycling":
        return "bg-blue-100 text-blue-800"
      case "transit":
        return "bg-purple-100 text-purple-800"
      case "driving":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Choose Your Route</h2>
              <div className="flex items-center gap-2 text-gray-600 mt-2">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">
                  {origin} → {destination}
                </span>
              </div>
            </div>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>

          <div className="grid gap-4 mb-6">
            {routes.map((route, index) => (
              <Card
                key={index}
                className={`cursor-pointer transition-all ${
                  selectedRoute === route ? "ring-2 ring-green-500 bg-green-50" : "hover:shadow-md"
                }`}
                onClick={() => setSelectedRoute(route)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getModeIcon(route.mode)}</span>
                      <div>
                        <CardTitle className="text-lg capitalize">{route.mode}</CardTitle>
                        <CardDescription className="flex items-center gap-4 mt-1">
                          <span className="flex items-center gap-1">
                            <Route className="w-4 h-4" />
                            {route.distance}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {route.duration}
                          </span>
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getModeColor(route.mode)}>{route.mode}</Badge>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Leaf className="w-3 h-3" />
                        {route.carbonFootprint.toFixed(2)} kg CO₂
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{route.ecoScore}</div>
                        <div className="text-xs text-gray-500">Eco Score</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-900">{route.carbonFootprint.toFixed(2)}</div>
                        <div className="text-xs text-gray-500">kg CO₂</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">{route.steps?.length || 0} steps</div>
                      <div className="text-xs text-gray-500">Turn-by-turn navigation</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {selectedRoute && (
                <span>
                  Selected: <strong className="capitalize">{selectedRoute.mode}</strong> - Save{" "}
                  {(Math.max(...routes.map((r) => r.carbonFootprint)) - selectedRoute.carbonFootprint).toFixed(2)} kg
                  CO₂
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={() => selectedRoute && onConfirm(selectedRoute)}
                disabled={!selectedRoute}
                className="bg-green-600 hover:bg-green-700"
              >
                Confirm Route
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
