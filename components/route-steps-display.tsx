"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Navigation,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  RotateCcw,
  MapPin,
  Clock,
  Route,
  Bus,
  Train,
  Car,
  TreePine,
} from "lucide-react"

interface RouteStep {
  html_instructions: string
  distance: { text: string; value: number }
  duration: { text: string; value: number }
  maneuver?: string
  travel_mode: string
  transit_details?: {
    line: {
      name: string
      short_name: string
      vehicle: { type: string }
    }
    departure_stop: { name: string }
    arrival_stop: { name: string }
  }
}

interface RouteStepsDisplayProps {
  steps: RouteStep[]
  mode: string
  summary: string
  totalDistance: string
  totalDuration: string
  carbonFootprint: number
  ecoScore: number
}

export function RouteStepsDisplay({
  steps,
  mode,
  summary,
  totalDistance,
  totalDuration,
  carbonFootprint,
  ecoScore,
}: RouteStepsDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const getStepIcon = (step: RouteStep) => {
    if (step.transit_details) {
      const vehicleType = step.transit_details.line.vehicle.type.toLowerCase()
      if (vehicleType.includes("bus")) return <Bus className="h-4 w-4" />
      if (vehicleType.includes("train") || vehicleType.includes("subway")) return <Train className="h-4 w-4" />
    }

    switch (step.maneuver) {
      case "turn-right":
        return <ArrowRight className="h-4 w-4" />
      case "turn-left":
        return <ArrowLeft className="h-4 w-4" />
      case "straight":
        return <ArrowUp className="h-4 w-4" />
      case "uturn-left":
      case "uturn-right":
        return <RotateCcw className="h-4 w-4" />
      default:
        return <Navigation className="h-4 w-4" />
    }
  }

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case "walking":
        return <TreePine className="h-5 w-5" />
      case "driving":
        return <Car className="h-5 w-5" />
      case "transit":
        return <Bus className="h-5 w-5" />
      default:
        return <Route className="h-5 w-5" />
    }
  }

  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, "")
  }

  const getEcoScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-100 text-green-800"
    if (score >= 60) return "bg-yellow-100 text-yellow-800"
    return "bg-red-100 text-red-800"
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {getModeIcon(mode)}
            Route Details
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? "Hide Steps" : "Show Steps"}
          </Button>
        </div>

        {/* Route Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{totalDistance}</div>
            <div className="text-sm text-muted-foreground">Distance</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{totalDuration}</div>
            <div className="text-sm text-muted-foreground">Duration</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {carbonFootprint === 0 ? "0" : carbonFootprint.toFixed(2)} kg
            </div>
            <div className="text-sm text-muted-foreground">CO₂ Emissions</div>
          </div>
          <div className="text-center">
            <Badge className={getEcoScoreColor(ecoScore)}>Eco Score: {ecoScore}/100</Badge>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <Route className="h-4 w-4" />
              <span>{summary}</span>
            </div>

            {/* Step-by-step directions */}
            <div className="space-y-3">
              {steps.map((step, index) => (
                <div key={index} className="flex gap-3 p-3 rounded-lg bg-muted/30">
                  <div className="flex-shrink-0 mt-1">{getStepIcon(step)}</div>

                  <div className="flex-1 space-y-2">
                    <div className="text-sm">{stripHtml(step.html_instructions)}</div>

                    {/* Transit details */}
                    {step.transit_details && (
                      <div className="bg-blue-50 p-2 rounded text-xs space-y-1">
                        <div className="font-medium text-blue-800">
                          {step.transit_details.line.name} ({step.transit_details.line.short_name})
                        </div>
                        <div className="text-blue-600">From: {step.transit_details.departure_stop.name}</div>
                        <div className="text-blue-600">To: {step.transit_details.arrival_stop.name}</div>
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {step.distance.text}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {step.duration.text}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
