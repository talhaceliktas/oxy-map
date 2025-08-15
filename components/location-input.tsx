"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Loader2 } from "lucide-react";

interface LocationInputProps {
  onLocationSet: (lat: number, lng: number, address: string) => void;
  loading: boolean;
}

export function LocationInput({ onLocationSet, loading }: LocationInputProps) {
  const [address, setAddress] = useState("");
  const [geoLoading, setGeoLoading] = useState(false);

  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser.");
      return;
    }

    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // Reverse geocode to get address
        try {
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_API_KEY}`
          );
          const data = await response.json();
          const address =
            data.results[0]?.formatted_address || "Current Location";

          onLocationSet(latitude, longitude, address);
        } catch (error) {
          onLocationSet(latitude, longitude, "Current Location");
        }
        setGeoLoading(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert(
          "Unable to retrieve your location. Please enter an address manually."
        );
        setGeoLoading(false);
      }
    );
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) return;

    try {
      const response = await fetch(
        `/api/geocode?address=${encodeURIComponent(address)}`
      );
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        onLocationSet(
          location.lat,
          location.lng,
          data.results[0].formatted_address
        );
      } else {
        alert("Address not found. Please try a different address.");
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      alert("Failed to find address. Please try again.");
    }
  };

  return (
    <div className="space-y-4 p-6 border-2 border-dashed border-primary/30 rounded-lg bg-primary/5">
      <div className="text-center space-y-2">
        <MapPin className="h-8 w-8 text-primary mx-auto" />
        <h3 className="text-lg font-semibold">Set Your Location</h3>
        <p className="text-sm text-muted-foreground">
          Allow location access or enter your address to get personalized
          environmental data
        </p>
      </div>

      <div className="space-y-3">
        <Button
          onClick={handleGeolocation}
          disabled={geoLoading || loading}
          className="w-full"
        >
          {geoLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Getting Location...
            </>
          ) : (
            <>
              <MapPin className="mr-2 h-4 w-4" />
              Use Current Location
            </>
          )}
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or</span>
          </div>
        </div>

        <form onSubmit={handleAddressSubmit} className="flex gap-2">
          <Input
            type="text"
            placeholder="Enter your address..."
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            disabled={loading}
          />
          <Button type="submit" disabled={loading || !address.trim()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Go"}
          </Button>
        </form>
      </div>
    </div>
  );
}
