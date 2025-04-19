import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../../contexts/AuthContext";

const specialtiesList = [
  "Anxiety",
  "Depression",
  "Trauma",
  "Relationships",
  "Addiction",
  "Grief",
  "Stress",
  "LGBTQ+",
  "Family",
  "Career",
];

export const TherapistRegisterPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [specialties, setSpecialties] = useState([]);
  const [license, setLicense] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSpecialtyToggle = (specialty) => {
    if (specialties.includes(specialty)) {
      setSpecialties(specialties.filter((s) => s !== specialty));
    } else {
      setSpecialties([...specialties, specialty]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (specialties.length === 0) {
      setError("Please select at least one specialty");
      return;
    }

    if (!license) {
      setError("Please enter your license information");
      return;
    }

    setIsLoading(true);

    try {
      // Register the therapist
      await signUp(email, password, "therapist", displayName);

      // Additional therapist profile data will be added in the dashboard
      navigate("/therapist-dashboard/profile");
    } catch (err) {
      setError(err.message || "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 flex justify-center">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">Register as a Therapist</CardTitle>
          <CardDescription>
            Create your therapist account and start helping patients
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Account Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Full Name</Label>
                  <Input
                    id="displayName"
                    placeholder="Dr. Jane Smith"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Professional Information</h3>

              <div className="space-y-2">
                <Label htmlFor="license">License Information</Label>
                <Input
                  id="license"
                  placeholder="License number and state"
                  value={license}
                  onChange={(e) => setLicense(e.target.value)}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  This information will be verified before your profile is made
                  public
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Professional Bio</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Write a brief introduction about your practice and experience..."
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Specialties (select at least one)</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {specialtiesList.map((specialty) => (
                    <div
                      key={specialty}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={`specialty-${specialty}`}
                        checked={specialties.includes(specialty)}
                        onCheckedChange={() => handleSpecialtyToggle(specialty)}
                      />
                      <Label htmlFor={`specialty-${specialty}`}>
                        {specialty}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Register as a Therapist"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <div className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Log in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};
