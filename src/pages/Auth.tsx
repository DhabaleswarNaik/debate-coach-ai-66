import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, ArrowRight, Eye, EyeOff, ArrowLeft, Mail } from "lucide-react";
import { LogoGlow } from "@/components/LogoGlow";
import { ThemeToggle } from "@/components/ThemeToggle";

type AuthView = "main" | "forgot";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [view, setView] = useState<AuthView>("main");
  const [resetSent, setResetSent] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      }
    });
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: { first_name: firstName.trim(), last_name: lastName.trim() },
        },
      });
      if (error) throw error;
      toast({ title: "Success!", description: "Account created successfully. You can now login." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate("/");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setResetSent(true);
      toast({ title: "Email Sent!", description: "Check your inbox for a password reset link." });
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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <Card className="w-full max-w-md glass-card shadow-2xl relative animate-fade-up border border-border/50 backdrop-blur-xl">
        <CardContent className="p-6 sm:p-8">
          {/* Logo Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-5">
              <LogoGlow size="lg" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold gradient-text tracking-tight">AI Debate Partner</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Sharpen your argumentation skills with AI
            </p>
          </div>

          {view === "forgot" ? (
            /* Forgot Password View */
            <div className="space-y-5 animate-fade-up">
              <button
                onClick={() => { setView("main"); setResetSent(false); }}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" />
                Back to login
              </button>

              {resetSent ? (
                <div className="text-center py-6 space-y-4 animate-fade-up">
                  <div className="w-16 h-16 mx-auto rounded-full bg-accent/15 flex items-center justify-center animate-scale-in">
                    <Mail className="w-8 h-8 text-accent" />
                  </div>
                  <h2 className="text-xl font-display font-bold">Check your email</h2>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    We've sent a password reset link to <span className="font-medium text-foreground">{email}</span>
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => { setView("main"); setResetSent(false); }}
                    className="mt-4 hover:border-primary/40 transition-all duration-300"
                  >
                    Return to login
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-5">
                  <div className="space-y-1">
                    <h2 className="text-xl font-display font-bold">Forgot password?</h2>
                    <p className="text-sm text-muted-foreground">Enter your email and we'll send a reset link</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email" className="text-sm font-medium">Email</Label>
                    <Input
                      id="forgot-email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-12 bg-background/50 border-border/60 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-300 hover:border-primary/30"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-12 font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary-hover hover:to-primary shadow-lg hover:shadow-primary/25 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] btn-glow group"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                        Sending...
                      </div>
                    ) : (
                      <>
                        Send Reset Link
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                      </>
                    )}
                  </Button>
                </form>
              )}
            </div>
          ) : (
            /* Main Login/Signup View */
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted/50 p-1 h-12">
                <TabsTrigger value="login" className="font-semibold text-sm data-[state=active]:shadow-md transition-all duration-300">Login</TabsTrigger>
                <TabsTrigger value="signup" className="font-semibold text-sm data-[state=active]:shadow-md transition-all duration-300">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleSignIn} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-sm font-medium">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-12 bg-background/50 border-border/60 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-300 hover:border-primary/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="login-password" className="text-sm font-medium">Password</Label>
                      <button
                        type="button"
                        onClick={() => setView("forgot")}
                        className="text-xs text-primary hover:text-primary-hover transition-colors duration-200 hover:underline underline-offset-2"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
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
                  <Button 
                    type="submit" 
                    className="w-full h-12 font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary-hover hover:to-primary shadow-lg hover:shadow-primary/25 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] btn-glow group" 
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                        Logging in...
                      </div>
                    ) : (
                      <>
                        Login
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="signup-first" className="text-sm font-medium">First Name</Label>
                      <Input
                        id="signup-first"
                        type="text"
                        placeholder="John"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        maxLength={50}
                        className="h-12 bg-background/50 border-border/60 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-300 hover:border-primary/30"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-last" className="text-sm font-medium">Last Name</Label>
                      <Input
                        id="signup-last"
                        type="text"
                        placeholder="Doe"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                        maxLength={50}
                        className="h-12 bg-background/50 border-border/60 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-300 hover:border-primary/30"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-sm font-medium">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-12 bg-background/50 border-border/60 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-300 hover:border-primary/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-sm font-medium">Password</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
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
                    <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-12 font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary-hover hover:to-primary shadow-lg hover:shadow-primary/25 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] btn-glow group" 
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                        Creating account...
                      </div>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Create Account
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          )}

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground mt-6">
            Practice debating with AI-powered opponents
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;