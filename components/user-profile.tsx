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
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/auth/auth-provider";
import { supabaseClient as supabase } from "@/lib/supabase-client";
import { User, Settings, Leaf, Calendar, Save, Loader2 } from "lucide-react";

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  location: string;
  carbon_goal: number;
  preferred_transport: string;
  created_at: string;
  updated_at: string;
}

export function UserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    location: "",
    carbon_goal: 2.0,
    preferred_transport: "walking",
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user?.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching profile:", error);
        return;
      }

      if (data) {
        setProfile(data);
        setFormData({
          full_name: data.full_name || "",
          location: data.location || "",
          carbon_goal: data.carbon_goal || 2.0,
          preferred_transport: data.preferred_transport || "walking",
        });
      } else {
        // Create initial profile
        const newProfile = {
          id: user?.id,
          email: user?.email,
          full_name: user?.user_metadata?.full_name || "",
          location: "",
          carbon_goal: 2.0,
          preferred_transport: "walking",
        };

        const { data: createdProfile, error: createError } = await supabase
          .from("user_profiles")
          .insert([newProfile])
          .select()
          .single();

        if (!createError && createdProfile) {
          setProfile(createdProfile);
          setFormData({
            full_name: createdProfile.full_name || "",
            location: createdProfile.location || "",
            carbon_goal: createdProfile.carbon_goal || 2.0,
            preferred_transport:
              createdProfile.preferred_transport || "walking",
          });
        }
      }
    } catch (error) {
      console.error("Error with profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase.from("user_profiles").upsert({
        id: user.id,
        email: user.email,
        ...formData,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        console.error("Error saving profile:", error);
      } else {
        await fetchProfile();
      }
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Profile Information
          </CardTitle>
          <CardDescription>
            Manage your personal information and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => handleInputChange("full_name", e.target.value)}
                placeholder="Enter your full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={user?.email || ""}
                disabled
                className="bg-muted"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => handleInputChange("location", e.target.value)}
              placeholder="Enter your city or address"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Environmental Preferences
          </CardTitle>
          <CardDescription>
            Set your sustainability goals and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="carbon_goal">Monthly Carbon Goal (tons CO₂)</Label>
            <Input
              id="carbon_goal"
              type="number"
              step="0.1"
              min="0"
              value={formData.carbon_goal}
              onChange={(e) =>
                handleInputChange(
                  "carbon_goal",
                  Number.parseFloat(e.target.value)
                )
              }
            />
            <p className="text-sm text-muted-foreground">
              Average person produces 4 tons CO₂ per month. Set a lower goal to
              reduce your impact.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="preferred_transport">
              Preferred Transportation
            </Label>
            <select
              id="preferred_transport"
              value={formData.preferred_transport}
              onChange={(e) =>
                handleInputChange("preferred_transport", e.target.value)
              }
              className="w-full p-2 border border-input rounded-md bg-background"
            >
              <option value="walking">Walking</option>
              <option value="bicycling">Cycling</option>
              <option value="transit">Public Transit</option>
              <option value="driving">Driving</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {profile && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Leaf className="h-5 w-5 text-primary" />
              Environmental Impact
            </CardTitle>
            <CardDescription>Your sustainability statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-primary">2.1</div>
                <div className="text-sm text-muted-foreground">
                  tons CO₂ this month
                </div>
                <Badge
                  variant="secondary"
                  className="mt-2 bg-green-100 text-green-800"
                >
                  Below Goal
                </Badge>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-primary">47</div>
                <div className="text-sm text-muted-foreground">
                  green spaces visited
                </div>
                <Badge
                  variant="secondary"
                  className="mt-2 bg-blue-100 text-blue-800"
                >
                  Explorer
                </Badge>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-primary">156</div>
                <div className="text-sm text-muted-foreground">
                  eco-friendly routes taken
                </div>
                <Badge
                  variant="secondary"
                  className="mt-2 bg-green-100 text-green-800"
                >
                  Eco Warrior
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {profile && (
        <div className="text-center text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-2">
            <Calendar className="h-4 w-4" />
            Member since {new Date(profile.created_at).toLocaleDateString()}
          </div>
        </div>
      )}
    </div>
  );
}
