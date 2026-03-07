"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { User, Lock, Handshake, Building2, Calendar, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

interface Profile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  twoFactorEnabled: boolean;
  createdAt: string;
  _count: {
    createdDeals: number;
    dealParties: number;
    companies: number;
  };
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Profile fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => {
        setProfile(data);
        setName(data.name);
        setPhone(data.phone || "");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleProfileUpdate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);

    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone: phone || undefined }),
    });

    const data = await res.json();
    if (res.ok) {
      setMessage("Profile updated successfully");
      toast.success("Profile updated");
      setProfile((prev) => (prev ? { ...prev, ...data } : prev));
    } else {
      setError(data.error);
      toast.error(data.error || "Failed to update profile");
    }

    setSaving(false);
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    setChangingPassword(true);

    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const data = await res.json();
    if (res.ok) {
      setPasswordSuccess("Password changed successfully");
      toast.success("Password changed");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      setPasswordError(data.error);
      toast.error(data.error || "Failed to change password");
    }

    setChangingPassword(false);
  }

  if (loading) {
    return <p className="text-muted-foreground">Loading profile...</p>;
  }

  if (!profile) {
    return <p className="text-muted-foreground">Failed to load profile</p>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-muted-foreground">Manage your account settings</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-3">
        <Card>
          <CardContent className="pt-6 text-center">
            <Handshake className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <p className="text-2xl font-bold">{profile._count.createdDeals}</p>
            <p className="text-xs text-muted-foreground">Deals Created</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <User className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <p className="text-2xl font-bold">{profile._count.dealParties}</p>
            <p className="text-xs text-muted-foreground">Deal Participations</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Building2 className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <p className="text-2xl font-bold">{profile._count.companies}</p>
            <p className="text-xs text-muted-foreground">Companies</p>
          </CardContent>
        </Card>
      </div>

      {/* Profile Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" /> Personal Information
          </CardTitle>
          <CardDescription>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Member since {new Date(profile.createdAt).toLocaleDateString()}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {message && (
            <div className="rounded-md bg-primary/5 p-3 text-sm text-primary mb-4">
              {message}
            </div>
          )}
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 mb-4">
              {error}
            </div>
          )}
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={profile.email} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+27..."
              />
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="h-4 w-4" /> Change Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          {passwordSuccess && (
            <div className="rounded-md bg-primary/5 p-3 text-sm text-primary mb-4">
              {passwordSuccess}
            </div>
          )}
          {passwordError && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 mb-4">
              {passwordError}
            </div>
          )}
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
              <Input
                id="confirmNewPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" variant="outline" disabled={changingPassword}>
              {changingPassword ? "Changing..." : "Change Password"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <TwoFactorSettings enabled={profile.twoFactorEnabled} />
    </div>
  );
}

function TwoFactorSettings({ enabled }: { enabled: boolean }) {
  const [is2FAEnabled, setIs2FAEnabled] = useState(enabled);
  const [setupData, setSetupData] = useState<{ secret: string; qrCode: string } | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [settingUp, setSettingUp] = useState(false);
  const [tfaError, setTfaError] = useState("");
  const [tfaSuccess, setTfaSuccess] = useState("");

  async function startSetup() {
    setTfaError("");
    setTfaSuccess("");
    setSettingUp(true);

    const res = await fetch("/api/auth/two-factor", { method: "POST" });
    const data = await res.json();

    if (res.ok) {
      setSetupData(data);
    } else {
      setTfaError(data.error);
    }
    setSettingUp(false);
  }

  async function verifyAndEnable(e: React.FormEvent) {
    e.preventDefault();
    setTfaError("");
    setSettingUp(true);

    const res = await fetch("/api/auth/two-factor", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: verifyCode }),
    });

    const data = await res.json();
    if (res.ok) {
      setIs2FAEnabled(true);
      setSetupData(null);
      setVerifyCode("");
      setTfaSuccess("Two-factor authentication enabled successfully");
    } else {
      setTfaError(data.error);
    }
    setSettingUp(false);
  }

  async function disable2FA(e: React.FormEvent) {
    e.preventDefault();
    setTfaError("");
    setTfaSuccess("");
    setSettingUp(true);

    const res = await fetch("/api/auth/two-factor", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: disableCode }),
    });

    const data = await res.json();
    if (res.ok) {
      setIs2FAEnabled(false);
      setDisableCode("");
      setTfaSuccess("Two-factor authentication disabled");
    } else {
      setTfaError(data.error);
    }
    setSettingUp(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <ShieldCheck className="h-4 w-4" /> Two-Factor Authentication
        </CardTitle>
        <CardDescription>
          {is2FAEnabled
            ? "2FA is enabled. Your account has an extra layer of security."
            : "Add an extra layer of security with a TOTP authenticator app."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {tfaSuccess && (
          <div className="rounded-md bg-primary/5 p-3 text-sm text-primary">
            {tfaSuccess}
          </div>
        )}
        {tfaError && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
            {tfaError}
          </div>
        )}

        {!is2FAEnabled && !setupData && (
          <Button onClick={startSetup} disabled={settingUp}>
            {settingUp ? "Setting up..." : "Enable 2FA"}
          </Button>
        )}

        {setupData && (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
            </div>
            <div className="flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={setupData.qrCode} alt="2FA QR Code" className="rounded-lg border" />
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Manual key: </span>
              <code className="bg-muted px-2 py-1 rounded text-xs">{setupData.secret}</code>
            </div>
            <Separator />
            <form onSubmit={verifyAndEnable} className="flex items-end gap-3">
              <div className="space-y-2 flex-1">
                <Label htmlFor="verify2fa">Verification Code</Label>
                <Input
                  id="verify2fa"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value)}
                  placeholder="000000"
                  maxLength={6}
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  required
                />
              </div>
              <Button type="submit" disabled={settingUp}>
                {settingUp ? "Verifying..." : "Verify & Enable"}
              </Button>
            </form>
          </div>
        )}

        {is2FAEnabled && (
          <form onSubmit={disable2FA} className="flex items-end gap-3">
            <div className="space-y-2 flex-1">
              <Label htmlFor="disable2fa">Enter code to disable 2FA</Label>
              <Input
                id="disable2fa"
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value)}
                placeholder="000000"
                maxLength={6}
                inputMode="numeric"
                pattern="[0-9]{6}"
                required
              />
            </div>
            <Button type="submit" variant="destructive" disabled={settingUp}>
              {settingUp ? "Disabling..." : "Disable 2FA"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
