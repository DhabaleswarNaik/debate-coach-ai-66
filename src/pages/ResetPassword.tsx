import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Eye, EyeOff, CheckCircle, KeyRound } from "lucide-react";
import { LogoGlow } from "@/components/LogoGlow";
import { ThemeToggle } from "@/components/ThemeToggle";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if there's a recovery session from the URL hash
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get("type");
    if (type !== "recovery") {
      // Also check query params for newer flows
      const queryParams = new URLSearchParams(window.location.search);
      const queryType = queryParams.get("type");
      if (queryType !== "recovery") {
        // Listen for auth state change for recovery event
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
          if (event !== "PASSWORD_RECOVERY") {
            // Allow staying on the page - the user may have navigated here directly
          }
        });
        return () => subscription.unsubscribe();
      }
    }
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }

    if (password.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
      toast({ title: "Password Updated!", description: "Your password has been reset successfully." });
      setTimeout(() => navigate("/auth"), 2000);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4 relative overflow-hidden">
      {/* Theme toggle */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-primary/8 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-accent/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <Card className="w-full max-w-md glass-card shadow-2xl relative animate-fade-up border border-border/50 backdrop-blur-xl">
        <CardContent className="p-6 sm:p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-5">
              <LogoGlow size="lg" />
            </div>
            {success ? (
              <>
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/20 flex items-center justify-center animate-scale-in">
                  <CheckCircle className="w-8 h-8 text-accent" />
                </div>
                <h1 className="text-2xl font-display font-bold gradient-text">Password Reset!</h1>
                <p className="text-muted-foreground mt-2 text-sm">Redirecting you to login...</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <KeyRound className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-2xl font-display font-bold gradient-text">Set New Password</h1>
                <p className="text-muted-foreground mt-2 text-sm">Enter your new password below</p>
              </>
            )}
          </div>

          {!success && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-sm font-medium">New Password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="h-12 bg-background/50 pr-12 border-border/60 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-300 hover:border-primary/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-200"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-sm font-medium">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="h-12 bg-background/50 border-border/60 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-300 hover:border-primary/30"
                />
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-destructive">Passwords do not match</p>
                )}
              </div>
              <Button
                type="submit"
                className="w-full h-12 font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary-hover hover:to-primary shadow-lg hover:shadow-primary/25 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] btn-glow group"
                disabled={loading || (confirmPassword.length > 0 && password !== confirmPassword)}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    Updating...
                  </div>
                ) : (
                  <>
                    Reset Password
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => navigate("/auth")}
              >
                Back to Login
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
