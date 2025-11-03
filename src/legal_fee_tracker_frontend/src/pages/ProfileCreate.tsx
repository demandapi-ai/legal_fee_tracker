import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { createLawyerProfileSchema, createClientProfileSchema, type CreateLawyerProfile, type CreateClientProfile } from "@shared/schema";
import { useAuth } from "@/contexts/AuthContext";

export default function ProfileCreate() {
  const { type } = useParams<{ type: "lawyer" | "client" }>();
  const [, setLocation] = useLocation();
  const { setUserType, userPrincipal } = useAuth();
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [currentSpec, setCurrentSpec] = useState("");

  const isLawyer = type === "lawyer";

  const lawyerForm = useForm<CreateLawyerProfile>({
    resolver: zodResolver(createLawyerProfileSchema),
    defaultValues: {
      name: "",
      email: "",
      walletAddress: "",
      bio: "",
      jurisdiction: "",
      specializations: [],
      hourlyRate: undefined,
    },
  });

  const clientForm = useForm<CreateClientProfile>({
    resolver: zodResolver(createClientProfileSchema),
    defaultValues: {
      name: "",
      email: "",
      walletAddress: "",
    },
  });

  const form = isLawyer ? lawyerForm : clientForm;

  const addSpecialization = () => {
    if (currentSpec.trim() && !specializations.includes(currentSpec.trim())) {
      const updated = [...specializations, currentSpec.trim()];
      setSpecializations(updated);
      if (isLawyer) {
        lawyerForm.setValue("specializations", updated);
      }
      setCurrentSpec("");
    }
  };

  const removeSpecialization = (spec: string) => {
    const updated = specializations.filter(s => s !== spec);
    setSpecializations(updated);
    if (isLawyer) {
      lawyerForm.setValue("specializations", updated);
    }
  };

  const onSubmit = async (data: any) => {
    try {
      const endpoint = isLawyer ? "/api/users/lawyer" : "/api/users/client";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, principal: userPrincipal }),
      });
      
      if (!response.ok) throw new Error("Failed to create profile");
      
      setUserType(isLawyer ? "Lawyer" : "Client");
      setLocation("/dashboard");
    } catch (error) {
      console.error("Error creating profile:", error);
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
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
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
                control={form.control}
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
                control={form.control}
                name="walletAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Wallet Address (ckUSDC)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="0x..." data-testid="input-wallet" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isLawyer && (
                <>
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
                </>
              )}

              <div className="flex gap-4">
                <Button type="button" variant="outline" onClick={() => setLocation("/onboarding")} className="flex-1" data-testid="button-back">
                  Back
                </Button>
                <Button type="submit" className="flex-1" data-testid="button-create-profile">
                  Create Profile
                </Button>
              </div>
            </form>
          </Form>
        </Card>
      </div>
    </div>
  );
}
