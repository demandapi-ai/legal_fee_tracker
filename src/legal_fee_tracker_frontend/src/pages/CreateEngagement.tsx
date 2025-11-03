import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { createEngagementSchema, type CreateEngagement, type Milestone } from "@shared/schema";
import { useLocation } from "wouter";
import { formatCurrency } from "@/lib/utils";

export default function CreateEngagement() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [engagementTypeSelected, setEngagementTypeSelected] = useState<"Hourly" | "FixedFee" | "Milestone">("Hourly");
  const [milestones, setMilestones] = useState<Milestone[]>([]);

  const form = useForm<CreateEngagement>({
    resolver: zodResolver(createEngagementSchema),
    defaultValues: {
      title: "",
      description: "",
      lawyer: "lawyer1",
      client: "client1",
      engagementType: { type: "Hourly", rate: 0 },
      escrowAmount: 0,
    },
  });

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  const addMilestone = () => {
    setMilestones([
      ...milestones,
      {
        id: milestones.length,
        description: "",
        amount: 0,
        status: "Pending",
      },
    ]);
  };

  const updateMilestone = (index: number, field: keyof Milestone, value: any) => {
    const updated = [...milestones];
    updated[index] = { ...updated[index], [field]: value };
    setMilestones(updated);
  };

  const removeMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const onSubmit = () => {
    setLocation("/dashboard");
  };

  const nextStep = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Create New Engagement</h1>
        <p className="text-muted-foreground">Follow the steps to set up your legal engagement</p>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground mb-1">
          <span>Step {step} of {totalSteps}</span>
          <span>{progress.toFixed(0)}% Complete</span>
        </div>
        <Progress value={progress} />
      </div>

      <Card className="p-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold mb-4">Basic Information</h2>
                
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Engagement Title</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Contract Review for SaaS Agreement" data-testid="input-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Describe the scope of work and expectations..."
                          className="min-h-32"
                          data-testid="input-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold mb-4">Engagement Type</h2>

                <div className="space-y-4">
                  <label className="text-sm font-medium">Select Engagement Type</label>
                  <RadioGroup
                    value={engagementTypeSelected}
                    onValueChange={(value) => setEngagementTypeSelected(value as any)}
                  >
                    <Card className={`p-4 cursor-pointer transition-all ${engagementTypeSelected === "Hourly" ? "ring-2 ring-primary" : ""}`}>
                      <div className="flex items-start gap-3">
                        <RadioGroupItem value="Hourly" id="hourly" data-testid="radio-hourly" />
                        <div className="flex-1">
                          <label htmlFor="hourly" className="font-semibold cursor-pointer">Hourly Rate</label>
                          <p className="text-sm text-muted-foreground mt-1">
                            Pay based on hours worked at an agreed hourly rate
                          </p>
                        </div>
                      </div>
                    </Card>

                    <Card className={`p-4 cursor-pointer transition-all ${engagementTypeSelected === "FixedFee" ? "ring-2 ring-primary" : ""}`}>
                      <div className="flex items-start gap-3">
                        <RadioGroupItem value="FixedFee" id="fixed" data-testid="radio-fixed" />
                        <div className="flex-1">
                          <label htmlFor="fixed" className="font-semibold cursor-pointer">Fixed Fee</label>
                          <p className="text-sm text-muted-foreground mt-1">
                            One-time payment for the entire scope of work
                          </p>
                        </div>
                      </div>
                    </Card>

                    <Card className={`p-4 cursor-pointer transition-all ${engagementTypeSelected === "Milestone" ? "ring-2 ring-primary" : ""}`}>
                      <div className="flex items-start gap-3">
                        <RadioGroupItem value="Milestone" id="milestone" data-testid="radio-milestone" />
                        <div className="flex-1">
                          <label htmlFor="milestone" className="font-semibold cursor-pointer">Milestone-Based</label>
                          <p className="text-sm text-muted-foreground mt-1">
                            Payments released upon completion of specific milestones
                          </p>
                        </div>
                      </div>
                    </Card>
                  </RadioGroup>
                </div>

                {engagementTypeSelected === "Hourly" && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Hourly Rate (USD)</label>
                    <Input
                      type="number"
                      placeholder="250"
                      onChange={(e) =>
                        form.setValue("engagementType", {
                          type: "Hourly",
                          rate: parseFloat(e.target.value) * 1000000,
                        })
                      }
                      data-testid="input-hourly-rate"
                    />
                  </div>
                )}

                {engagementTypeSelected === "FixedFee" && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Fixed Fee Amount (USD)</label>
                    <Input
                      type="number"
                      placeholder="5000"
                      onChange={(e) =>
                        form.setValue("engagementType", {
                          type: "FixedFee",
                          amount: parseFloat(e.target.value) * 1000000,
                        })
                      }
                      data-testid="input-fixed-amount"
                    />
                  </div>
                )}

                {engagementTypeSelected === "Milestone" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Milestones</label>
                      <Button type="button" size="sm" onClick={addMilestone} data-testid="button-add-milestone">
                        Add Milestone
                      </Button>
                    </div>
                    {milestones.map((milestone, index) => (
                      <Card key={index} className="p-4">
                        <div className="space-y-3">
                          <Input
                            placeholder="Milestone description"
                            value={milestone.description}
                            onChange={(e) => updateMilestone(index, "description", e.target.value)}
                            data-testid={`input-milestone-desc-${index}`}
                          />
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              placeholder="Amount (USD)"
                              onChange={(e) => updateMilestone(index, "amount", parseFloat(e.target.value) * 1000000)}
                              data-testid={`input-milestone-amount-${index}`}
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => removeMilestone(index)}
                              data-testid={`button-remove-milestone-${index}`}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold mb-4">Escrow Deposit</h2>
                
                <FormField
                  control={form.control}
                  name="escrowAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Initial Escrow Amount (USD)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          placeholder="2000"
                          onChange={(e) => field.onChange(parseFloat(e.target.value) * 1000000)}
                          data-testid="input-escrow-amount"
                        />
                      </FormControl>
                      <p className="text-sm text-muted-foreground mt-2">
                        This amount will be held in escrow and released as work is completed and approved.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Card className="p-4 bg-muted/30">
                  <h3 className="font-semibold mb-2">How Escrow Works</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Funds are securely held in a smart contract</li>
                    <li>• Payments are released automatically upon approval</li>
                    <li>• Remaining funds can be refunded at any time</li>
                    <li>• All transactions are recorded on-chain</li>
                  </ul>
                </Card>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold mb-4">Review & Confirm</h2>
                
                <Card className="p-6 space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Title</p>
                    <p className="font-semibold">{form.watch("title") || "Not set"}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Description</p>
                    <p className="text-sm">{form.watch("description") || "Not set"}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Engagement Type</p>
                    <p className="font-semibold">{engagementTypeSelected}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Initial Escrow Deposit</p>
                    <p className="font-mono font-semibold text-lg">
                      {formatCurrency(form.watch("escrowAmount") || 0)}
                    </p>
                  </div>
                </Card>

                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900 rounded-lg">
                  <p className="text-sm font-medium text-yellow-900 dark:text-yellow-200">
                    By creating this engagement, both parties agree to the terms outlined above. 
                    All transactions will be recorded on the blockchain.
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-4 pt-6">
              {step > 1 && (
                <Button type="button" variant="outline" onClick={prevStep} data-testid="button-back">
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              )}
              
              {step < totalSteps ? (
                <Button type="button" onClick={nextStep} className="ml-auto" data-testid="button-next">
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" className="ml-auto" data-testid="button-create-engagement">
                  Create Engagement
                </Button>
              )}
            </div>
          </form>
        </Form>
      </Card>
    </div>
  );
}
