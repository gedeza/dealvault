"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

interface CheckpointSubmitFormProps {
  dealId: string;
  checkpointId: string;
  onSubmit: () => void;
}

export function CheckpointSubmitForm({
  dealId,
  checkpointId,
  onSubmit,
}: CheckpointSubmitFormProps) {
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    latitude: "",
    longitude: "",
    locationName: "",
    notes: "",
    sealIntact: "",
    weight: "",
    weightUnit: "g",
  });

  const getLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported by your browser");
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) => ({
          ...prev,
          latitude: pos.coords.latitude.toString(),
          longitude: pos.coords.longitude.toString(),
        }));
        setGettingLocation(false);
        toast.success("Location captured");
      },
      (err) => {
        setGettingLocation(false);
        toast.error(`Location error: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Upload photo first if provided
      let photoPath: string | undefined;
      let photoHash: string | undefined;

      if (photoFile) {
        const formData = new FormData();
        formData.append("file", photoFile);

        const photoRes = await fetch(
          `/api/deals/${dealId}/custody/checkpoints/${checkpointId}/photo`,
          { method: "POST", body: formData }
        );

        if (!photoRes.ok) {
          const data = await photoRes.json();
          toast.error(data.error || "Failed to upload photo");
          setLoading(false);
          return;
        }

        const photoData = await photoRes.json();
        photoPath = photoData.photoPath;
        photoHash = photoData.photoHash;
      }

      // Submit evidence
      const payload: Record<string, unknown> = {};
      if (form.latitude) payload.latitude = parseFloat(form.latitude);
      if (form.longitude) payload.longitude = parseFloat(form.longitude);
      if (form.locationName) payload.locationName = form.locationName;
      if (form.notes) payload.notes = form.notes;
      if (form.sealIntact !== "") payload.sealIntact = form.sealIntact === "true";
      if (form.weight) {
        payload.weight = parseFloat(form.weight);
        payload.weightUnit = form.weightUnit;
      }
      if (photoPath) payload.photoPath = photoPath;
      if (photoHash) payload.photoHash = photoHash;

      const res = await fetch(
        `/api/deals/${dealId}/custody/checkpoints/${checkpointId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (res.ok) {
        toast.success("Evidence submitted");
        onSubmit();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to submit evidence");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3 bg-muted/50 p-3 rounded-lg">
      <p className="text-sm font-medium">Submit Evidence</p>

      <div className="grid gap-3 sm:grid-cols-2">
        {/* Location */}
        <div className="sm:col-span-2">
          <Label className="text-xs">Location</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Location name"
              value={form.locationName}
              onChange={(e) => setForm({ ...form, locationName: e.target.value })}
              className="flex-1"
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={getLocation}
              disabled={gettingLocation}
            >
              {gettingLocation ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MapPin className="h-4 w-4" />
              )}
            </Button>
          </div>
          {form.latitude && (
            <p className="text-xs text-muted-foreground mt-1">
              GPS: {form.latitude}, {form.longitude}
            </p>
          )}
        </div>

        {/* Seal integrity */}
        <div>
          <Label className="text-xs">Seal Intact?</Label>
          <Select
            value={form.sealIntact}
            onValueChange={(v) => setForm({ ...form, sealIntact: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Yes - Intact</SelectItem>
              <SelectItem value="false">No - Broken/Tampered</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Weight */}
        <div>
          <Label className="text-xs">Weight</Label>
          <div className="flex gap-1">
            <Input
              type="number"
              step="0.01"
              placeholder="Weight"
              value={form.weight}
              onChange={(e) => setForm({ ...form, weight: e.target.value })}
              className="flex-1"
            />
            <Select
              value={form.weightUnit}
              onValueChange={(v) => setForm({ ...form, weightUnit: v })}
            >
              <SelectTrigger className="w-16">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="g">g</SelectItem>
                <SelectItem value="kg">kg</SelectItem>
                <SelectItem value="oz">oz</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Photo upload */}
        <div className="sm:col-span-2">
          <Label className="text-xs">Photo Evidence</Label>
          <Input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
          />
        </div>

        {/* Notes */}
        <div className="sm:col-span-2">
          <Label className="text-xs">Notes</Label>
          <Textarea
            placeholder="Observations, serial numbers, condition..."
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="h-16"
          />
        </div>
      </div>

      <Button size="sm" onClick={handleSubmit} disabled={loading}>
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin mr-1" />
        ) : (
          <Upload className="h-4 w-4 mr-1" />
        )}
        Submit Evidence
      </Button>
    </div>
  );
}
