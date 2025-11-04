import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Scale, User } from "lucide-react";
import { useLocation } from "wouter";

export default function Onboarding() {
  const [selectedType, setSelectedType] = useState<"lawyer" | "client" | null>(null);
  const [, setLocation] = useLocation();

  const handleContinue = () => {
    if (selectedType) {
      setLocation(`/profile/create/${selectedType}`);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Welcome to LegalTrust</h1>
          <p className="text-lg text-muted-foreground">
            Let's get started by creating your profile
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card
            className={`p-8 cursor-pointer transition-all hover-elevate ${
              selectedType === "lawyer" ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => setSelectedType("lawyer")}
            data-testid="card-select-lawyer"
          >
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-6">
                <Scale className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-semibold mb-3">I'm a Lawyer</h2>
              <p className="text-muted-foreground mb-6">
                Offer legal services, track billable hours, and receive payments 
                securely through smart contracts.
              </p>
              <ul className="text-sm text-muted-foreground text-left space-y-2">
                <li>• Set your hourly rate</li>
                <li>• Log billable time</li>
                <li>• Receive instant payments</li>
                <li>• Build your reputation</li>
              </ul>
            </div>
          </Card>

          <Card
            className={`p-8 cursor-pointer transition-all hover-elevate ${
              selectedType === "client" ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => setSelectedType("client")}
            data-testid="card-select-client"
          >
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-6">
                <User className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-semibold mb-3">I'm a Client</h2>
              <p className="text-muted-foreground mb-6">
                Find qualified lawyers, track legal expenses in real-time, and 
                pay securely with complete transparency.
              </p>
              <ul className="text-sm text-muted-foreground text-left space-y-2">
                <li>• Search for lawyers</li>
                <li>• Track all expenses live</li>
                <li>• Secure escrow payments</li>
                <li>• Leave reviews</li>
              </ul>
            </div>
          </Card>
        </div>

        {selectedType && (
          <div className="mt-8 text-center">
            <Button
              size="lg"
              onClick={handleContinue}
              data-testid="button-continue-onboarding"
            >
              Continue as {selectedType === "lawyer" ? "Lawyer" : "Client"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}