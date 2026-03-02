import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, LogIn, UserPlus } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

// Simple local auth using localStorage for credentials
const AUTH_KEY = "infinexy_auth_session";
const USERS_KEY = "infinexy_users";

interface UserData {
  name: string;
  mobile: string;
  password: string;
}

function getUsers(): Record<string, UserData> {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveUsers(users: Record<string, UserData>) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

interface LoginPageProps {
  onLogin: (name: string) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { login: iiLogin, isLoggingIn } = useInternetIdentity();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobile.trim() || !password.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      const users = getUsers();
      const user = users[mobile.trim()];
      if (!user) {
        toast.error("Account not found. Please create an account.");
        setIsLoading(false);
        return;
      }
      if (user.password !== password) {
        toast.error("Invalid password. Please try again.");
        setIsLoading(false);
        return;
      }
      localStorage.setItem(
        AUTH_KEY,
        JSON.stringify({ mobile, name: user.name }),
      );
      toast.success(`Welcome back, ${user.name}!`);
      onLogin(user.name);
    } catch {
      toast.error("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !mobile.trim() || !password.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    if (mobile.trim().length < 10) {
      toast.error("Please enter a valid mobile number");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    try {
      const users = getUsers();
      if (users[mobile.trim()]) {
        toast.error("An account with this mobile number already exists");
        setIsLoading(false);
        return;
      }
      users[mobile.trim()] = {
        name: name.trim(),
        mobile: mobile.trim(),
        password,
      };
      saveUsers(users);
      localStorage.setItem(
        AUTH_KEY,
        JSON.stringify({ mobile: mobile.trim(), name: name.trim() }),
      );
      toast.success(`Account created! Welcome, ${name.trim()}!`);
      onLogin(name.trim());
    } catch {
      toast.error("Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleIILogin = async () => {
    try {
      await iiLogin();
    } catch {
      toast.error("Internet Identity login failed");
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-navy text-white p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 -right-20 w-96 h-96 rounded-full border-2 border-white" />
          <div className="absolute bottom-20 -left-20 w-80 h-80 rounded-full border-2 border-white" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full border border-white" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative z-10"
        >
          <div className="flex items-center gap-4 mb-12">
            <img
              src="/assets/generated/infinexy-logo.jpeg"
              alt="Infinexy Finance Logo"
              className="h-14 w-20 object-contain rounded"
            />
            <div>
              <div className="text-3xl font-display font-bold tracking-wide">
                INFINEXY
              </div>
              <div className="text-lg font-display font-medium text-white/70">
                FINANCE
              </div>
            </div>
          </div>

          <h1 className="text-4xl font-display font-bold leading-tight mb-4">
            Professional
            <br />
            Billing &<br />
            Finance Management
          </h1>
          <p className="text-white/70 text-lg leading-relaxed">
            Create professional GST invoices, track expenses, and manage your
            business finances with ease.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="relative z-10 space-y-3"
        >
          {[
            "✓ GST-compliant invoices with CGST/SGST/IGST",
            "✓ Place of Supply: 24-Gujarat auto-filled",
            "✓ Customer & Transport copy printing",
            "✓ Expense tracking with categories",
          ].map((item) => (
            <div key={item} className="text-white/80 text-sm">
              {item}
            </div>
          ))}
        </motion.div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <img
              src="/assets/generated/infinexy-logo.jpeg"
              alt="Logo"
              className="h-8 w-12 object-contain rounded"
            />
            <div>
              <div className="font-display font-bold text-xl text-primary">
                INFINEXY FINANCE
              </div>
            </div>
          </div>

          <Card className="border-border shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="font-display text-2xl text-primary">
                {mode === "login" ? "Welcome back" : "Create account"}
              </CardTitle>
              <CardDescription>
                {mode === "login"
                  ? "Sign in to access your billing dashboard"
                  : "Set up your Infinexy Finance account"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={mode === "login" ? handleLogin : handleRegister}
                className="space-y-4"
              >
                {mode === "register" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="regName">Full Name</Label>
                    <Input
                      id="regName"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your full name"
                      autoComplete="name"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="mobile">Mobile Number</Label>
                  <Input
                    id="mobile"
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="9876543210"
                    autoComplete="tel"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      autoComplete={
                        mode === "login" ? "current-password" : "new-password"
                      }
                      className="pr-10"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword((v) => !v)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-navy hover:bg-navy-light text-white gap-2"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : mode === "login" ? (
                    <LogIn className="h-4 w-4" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                  {mode === "login" ? "Sign In" : "Create Account"}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase text-muted-foreground bg-card px-2">
                    or
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2"
                  onClick={handleIILogin}
                  disabled={isLoggingIn}
                >
                  {isLoggingIn ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <span className="text-base">🔐</span>
                  )}
                  Continue with Internet Identity
                </Button>
              </form>

              <div className="mt-4 text-center text-sm">
                {mode === "login" ? (
                  <span className="text-muted-foreground">
                    Don't have an account?{" "}
                    <button
                      type="button"
                      className="text-primary font-medium hover:underline"
                      onClick={() => setMode("register")}
                    >
                      Create account
                    </button>
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    Already have an account?{" "}
                    <button
                      type="button"
                      className="text-primary font-medium hover:underline"
                      onClick={() => setMode("login")}
                    >
                      Sign in
                    </button>
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
