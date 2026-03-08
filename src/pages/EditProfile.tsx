import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Camera, Save, Mail, Lock, User } from "lucide-react";
import { toast } from "sonner";

export default function EditProfile() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string>("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Password reset
  const [resettingPassword, setResettingPassword] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }

      setUserId(user.id);
      setEmail(user.email || "");
      setNewEmail(user.email || "");

      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name, avatar_url")
        .eq("id", user.id)
        .single();

      if (profile) {
        setFirstName(profile.first_name || "");
        setLastName(profile.last_name || "");
        setAvatarUrl(profile.avatar_url || null);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const getInitials = () => {
    if (firstName || lastName) {
      return [firstName, lastName].filter(Boolean).map(n => n[0]).join("").toUpperCase();
    }
    return email.slice(0, 2).toUpperCase();
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2MB");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const filePath = `${userId}/avatar.${ext}`;

      // Remove old avatar if exists
      await supabase.storage.from("avatars").remove([filePath]);

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      // Add cache-busting param
      const url = `${publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: url })
        .eq("id", userId);

      if (updateError) throw updateError;

      setAvatarUrl(url);
      toast.success("Avatar updated!");
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Failed to upload avatar");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveName = async () => {
    if (!firstName.trim()) {
      toast.error("First name is required");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ first_name: firstName.trim(), last_name: lastName.trim() })
        .eq("id", userId);

      if (error) throw error;
      toast.success("Name updated!");
    } catch (error) {
      console.error("Error updating name:", error);
      toast.error("Failed to update name");
    } finally {
      setSaving(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail.trim() || newEmail === email) {
      toast.error("Please enter a new email address");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
      if (error) throw error;
      toast.success("Confirmation email sent to your new address. Please check your inbox.");
    } catch (error: any) {
      console.error("Error updating email:", error);
      toast.error(error.message || "Failed to update email");
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    setResettingPassword(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Password reset email sent! Check your inbox.");
    } catch (error: any) {
      console.error("Error sending reset:", error);
      toast.error(error.message || "Failed to send reset email");
    } finally {
      setResettingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <header className="sticky top-0 z-50 glass-card border-b border-border/50 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-display font-bold">Edit Profile</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 sm:py-8 space-y-4 sm:space-y-6">
        {/* Avatar Section */}
        <Card className="p-4 sm:p-6 glass-card animate-fade-up">
          <h2 className="text-base sm:text-lg font-display font-semibold mb-3 sm:mb-4 flex items-center gap-2">
            <Camera className="w-5 h-5 text-primary" />
            Profile Photo
          </h2>
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <div className="relative group">
              <Avatar className="w-20 h-20 sm:w-24 sm:h-24 border-4 border-primary/20 shadow-lg transition-all duration-300 group-hover:border-primary/40">
                <AvatarImage src={avatarUrl || undefined} alt="Avatar" />
                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-2xl font-display font-bold">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
              >
                <Camera className="w-6 h-6 text-white" />
              </button>
            </div>
            <div className="space-y-2 text-center sm:text-left">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? "Uploading..." : "Change Photo"}
              </Button>
              <p className="text-xs text-muted-foreground">JPG, PNG. Max 2MB.</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>
        </Card>

        {/* Name Section */}
        <Card className="p-6 glass-card animate-fade-up" style={{ animationDelay: "0.05s" }}>
          <h2 className="text-lg font-display font-semibold mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Personal Info
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                maxLength={50}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                maxLength={50}
              />
            </div>
          </div>
          <Button onClick={handleSaveName} disabled={saving} className="mt-4">
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Save Name"}
          </Button>
        </Card>

        {/* Email Section */}
        <Card className="p-6 glass-card animate-fade-up" style={{ animationDelay: "0.1s" }}>
          <h2 className="text-lg font-display font-semibold mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            Email Address
          </h2>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="your@email.com"
              maxLength={255}
            />
            <p className="text-xs text-muted-foreground">
              Current: {email}. A confirmation will be sent to the new address.
            </p>
          </div>
          <Button
            onClick={handleChangeEmail}
            disabled={saving || newEmail === email}
            variant="outline"
            className="mt-4"
          >
            <Mail className="w-4 h-4 mr-2" />
            Update Email
          </Button>
        </Card>

        {/* Password Section */}
        <Card className="p-6 glass-card animate-fade-up" style={{ animationDelay: "0.15s" }}>
          <h2 className="text-lg font-display font-semibold mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            Password
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            We'll send a password reset link to your email address.
          </p>
          <Button
            onClick={handleResetPassword}
            disabled={resettingPassword}
            variant="outline"
          >
            <Lock className="w-4 h-4 mr-2" />
            {resettingPassword ? "Sending..." : "Send Password Reset Email"}
          </Button>
        </Card>
      </main>
    </div>
  );
}
