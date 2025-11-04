import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { X, Copy, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { UserManagement } from "../../../declarations/UserManagement";
import type { CreateLawyerProfileArgs, CreateClientProfileArgs } from "../../../declarations/UserManagement/UserManagement.did";

type LawyerFormData = {
  name: string;
  email: string;
  walletAddress: string;
  bio: string;
  jurisdiction: string;
  specializations: string[];
  hourlyRate?: number;
};

type ClientFormData = {
  name: string;
  email: string;
  walletAddress: string;
};

export default function ProfileCreate() {
  const { type } = useParams<{ type: "lawyer" | "client" }>();
  const [, setLocation] = useLocation();
  const { identity, principalId } = useAuth();
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [currentSpec, setCurrentSpec] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isLawyer = type === "lawyer";

  const lawyerForm = useForm<LawyerFormData>({
    defaultValues: {
      name: "",
      email: "",
      walletAddress: principalId || "",
      bio: "",
      jurisdiction: "",
      specializations: [],
      hourlyRate: undefined,
    },
  });

  const clientForm = useForm<ClientFormData>({
    defaultValues: {
      name: "",
      email: "",
      walletAddress: principalId || "",
    },
  });

  // Auto-fill wallet address when principalId becomes available
  useEffect(() => {
    if (principalId) {
      lawyerForm.setValue("walletAddress", principalId);
      clientForm.setValue("walletAddress", principalId);
    }
  }, [principalId, lawyerForm, clientForm]);

  const handleCopyPrincipal = async () => {
    if (principalId) {
      await navigator.clipboard.writeText(principalId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const addSpecialization = () => {
    if (currentSpec.trim() && !specializations.includes(currentSpec.trim())) {
      const updated = [...specializations, currentSpec.trim()];
      setSpecializations(updated);
      lawyerForm.setValue("specializations", updated);
      setCurrentSpec("");
    }
  };

  const removeSpecialization = (spec: string) => {
    const updated = specializations.filter(s => s !== spec);
    setSpecializations(updated);
    lawyerForm.setValue("specializations", updated);
  };

  const onSubmitLawyer = async (data: LawyerFormData) => {
    if (!identity) {
      setError("Not authenticated. Please log in again.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const actor = UserManagement;

      const args: CreateLawyerProfileArgs = {
        name: data.name,
        email: data.email,
        walletAddress: data.walletAddress,
        bio: data.bio,
        jurisdiction: data.jurisdiction,
        specializations: data.specializations,
        hourlyRate: data.hourlyRate ? [BigInt(data.hourlyRate)] : [],
      };

      const result = await actor.registerLawyer(args);
      
      if ('err' in result) {
        throw new Error(result.err);
      }

      setLocation("/dashboard");
    } catch (err) {
      console.error("Error creating profile:", err);
      setError(err instanceof Error ? err.message : "Failed to create profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmitClient = async (data: ClientFormData) => {
    if (!identity) {
      setError("Not authenticated. Please log in again.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const actor = UserManagement;

      const args: CreateClientProfileArgs = {
        name: data.name,
        email: data.email,
        walletAddress: data.walletAddress,
      };

      const result = await actor.registerClient(args);
      
      if ('err' in result) {
        throw new Error(result.err);
      }

      setLocation("/dashboard");
    } catch (err) {
      console.error("Error creating profile:", err);
      setError(err instanceof Error ? err.message : "Failed to create profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Create Your {isLawyer ? "Lawyer" : "Client"} Profile
          </h1>
          <p className="text-muted-foreground">
            Fill in your details to get started on LegalTrust
          </p>
        </div>

        <Card className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {isLawyer ? (
            <Form {...lawyerForm}>
              <form onSubmit={lawyerForm.handleSubmit(onSubmitLawyer)} className="space-y-6">
                <FormField
                  control={lawyerForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="John Doe" data-testid="input-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={lawyerForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="john@example.com" data-testid="input-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={lawyerForm.control}
                  name="walletAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Principal ID (Wallet Address)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            {...field} 
                            placeholder="Your principal ID" 
                            data-testid="input-wallet"
                            readOnly
                            className="pr-10 bg-muted/50"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                            onClick={handleCopyPrincipal}
                          >
                            {copied ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={lawyerForm.control}
                  name="jurisdiction"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jurisdiction</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., New York, California" data-testid="input-jurisdiction" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={lawyerForm.control}
                  name="specializations"
                  render={() => (
                    <FormItem>
                      <FormLabel>Specializations</FormLabel>
                      <div className="flex gap-2">
                        <Input
                          value={currentSpec}
                          onChange={(e) => setCurrentSpec(e.target.value)}
                          onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSpecialization())}
                          placeholder="e.g., Contract Law"
                          data-testid="input-specialization"
                        />
                        <Button type="button" onClick={addSpecialization} data-testid="button-add-specialization">
                          Add
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {specializations.map((spec) => (
                          <Badge key={spec} variant="secondary" className="gap-1" data-testid={`badge-spec-${spec}`}>
                            {spec}
                            <X className="h-3 w-3 cursor-pointer" onClick={() => removeSpecialization(spec)} />
                          </Badge>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={lawyerForm.control}
                  name="hourlyRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hourly Rate (USD) - Optional</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          placeholder="200"
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          value={field.value || ""}
                          data-testid="input-hourly-rate"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={lawyerForm.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Professional Bio</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Tell clients about your experience and expertise..."
                          className="min-h-32"
                          data-testid="input-bio"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setLocation("/onboarding")} 
                    className="flex-1" 
                    data-testid="button-back"
                    disabled={isSubmitting}
                  >
                    Back
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1" 
                    data-testid="button-create-profile"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Creating..." : "Create Profile"}
                  </Button>
                </div>
              </form>
            </Form>
          ) : (
            <Form {...clientForm}>
              <form onSubmit={clientForm.handleSubmit(onSubmitClient)} className="space-y-6">
                <FormField
                  control={clientForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="John Doe" data-testid="input-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={clientForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="john@example.com" data-testid="input-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={clientForm.control}
                  name="walletAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Principal ID (Wallet Address)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            {...field} 
                            placeholder="Your principal ID" 
                            data-testid="input-wallet"
                            readOnly
                            className="pr-10 bg-muted/50"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                            onClick={handleCopyPrincipal}
                          >
                            {copied ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setLocation("/onboarding")} 
                    className="flex-1" 
                    data-testid="button-back"
                    disabled={isSubmitting}
                  >
                    Back
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1" 
                    data-testid="button-create-profile"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Creating..." : "Create Profile"}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </Card>
      </div>
    </div>
  );
}