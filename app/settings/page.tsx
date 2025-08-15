"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/components/auth/auth-provider"
import { UserMenu } from "@/components/user-menu"
import { Loader2, Save, ArrowLeft, Bell, Palette, Car } from "lucide-react"

interface UserPreferences {
  preferred_transport_mode: string
  carbon_goal_monthly: number
  notifications_enabled: boolean
  units_system: string
  theme: string
}

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    preferred_transport_mode: "walking",
    carbon_goal_monthly: 2.0,
    notifications_enabled: true,
    units_system: "metric",
    theme: "system",
  })

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      fetchPreferences()
    }
  }, [user])

  const fetchPreferences = async () => {
    try {
      const response = await fetch("/api/user/preferences")
      const data = await response.json()

      if (data.preferences) {
        setPreferences(data.preferences)
        setFormData({
          preferred_transport_mode: data.preferences.preferred_transport_mode || "walking",
          carbon_goal_monthly: data.preferences.carbon_goal_monthly || 2.0,
          notifications_enabled: data.preferences.notifications_enabled ?? true,
          units_system: data.preferences.units_system || "metric",
          theme: data.preferences.theme || "system",
        })
      }
    } catch (error) {
      console.error("Failed to fetch preferences:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch("/api/user/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setPreferences(data.preferences)
        // Show success message
      } else {
        console.error("Failed to save preferences:", data.error)
      }
    } catch (error) {
      console.error("Failed to save preferences:", error)
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.push("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <UserMenu />
        </div>

        {/* Settings Form */}
        <form onSubmit={handleSave} className="space-y-6">
          {/* Transportation Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5 text-primary" />
                Transportation Preferences
              </CardTitle>
              <CardDescription>Set your preferred transportation mode and carbon goals</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="transport_mode">Preferred Transport Mode</Label>
                <Select
                  value={formData.preferred_transport_mode}
                  onValueChange={(value) => setFormData({ ...formData, preferred_transport_mode: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select transport mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="walking">Walking</SelectItem>
                    <SelectItem value="bicycling">Bicycling</SelectItem>
                    <SelectItem value="transit">Public Transit</SelectItem>
                    <SelectItem value="driving">Driving</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="carbon_goal">Monthly Carbon Goal (tons CO₂)</Label>
                <Input
                  id="carbon_goal"
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.carbon_goal_monthly}
                  onChange={(e) =>
                    setFormData({ ...formData, carbon_goal_monthly: Number.parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Notifications
              </CardTitle>
              <CardDescription>Manage your notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notifications">Enable Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive updates about air quality, carbon goals, and eco-friendly routes
                  </p>
                </div>
                <Switch
                  id="notifications"
                  checked={formData.notifications_enabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, notifications_enabled: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Display Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                Display Settings
              </CardTitle>
              <CardDescription>Customize your app appearance and units</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="units">Units System</Label>
                <Select
                  value={formData.units_system}
                  onValueChange={(value) => setFormData({ ...formData, units_system: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select units system" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="metric">Metric (km, kg)</SelectItem>
                    <SelectItem value="imperial">Imperial (miles, lbs)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <Select value={formData.theme} onValueChange={(value) => setFormData({ ...formData, theme: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button type="submit" disabled={saving} className="w-full">
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving Settings...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
