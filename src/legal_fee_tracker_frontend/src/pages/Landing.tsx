import { Button } from "@/components/ui/button";
import { Shield, Clock, DollarSign, Globe, FileCheck, History } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { generateMockPrincipal } from "@/lib/utils";
import heroImage from "@assets/generated_images/Legal_trust_blockchain_hero_349d832d.png";

export default function Landing() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();

  const handleConnect = () => {
    const mockPrincipal = generateMockPrincipal();
    login(mockPrincipal);
    setLocation("/onboarding");
  };

  const features = [
    {
      icon: <Clock className="h-8 w-8" />,
      title: "Real-time Work Logging",
      description: "Immutable timestamped logs for every billed activity ensure complete transparency.",
    },
    {
      icon: <DollarSign className="h-8 w-8" />,
      title: "Smart Escrow",
      description: "Funds are automatically released upon verified milestones with blockchain security.",
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Transparent Billing Dashboard",
      description: "Clients see all billed hours and remaining balance live in real-time.",
    },
    {
      icon: <Globe className="h-8 w-8" />,
      title: "Cross-Border Payments",
      description: "Settle instantly using crypto or stablecoins with no banking delays.",
    },
    {
      icon: <FileCheck className="h-8 w-8" />,
      title: "Immutable Agreements",
      description: "All terms stored on-chain, preventing post-fact disputes.",
    },
    {
      icon: <History className="h-8 w-8" />,
      title: "Auditable History",
      description: "Every transaction, invoice, and log preserved immutably forever.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div 
        className="relative h-screen flex items-center justify-center bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/70" />
        
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight">
            Transparent Legal Fees.<br />
            Instant Escrow.<br />
            Zero Disputes.
          </h1>
          
          <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-2xl mx-auto font-light">
            Decentralized legal fee tracking with blockchain-powered transparency, 
            real-time billing, and automated escrow payments.
          </p>
          
          <Button
            size="lg"
            className="text-lg px-8 py-6 h-auto"
            onClick={handleConnect}
            data-testid="button-connect-identity"
          >
            <Shield className="mr-2 h-5 w-5" />
            Connect with Internet Identity
          </Button>
          
          <p className="mt-6 text-sm text-white/70">
            Secure authentication powered by Internet Computer
          </p>
        </div>
      </div>

      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Built for Trust and Transparency
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              LegalTrust leverages blockchain technology to create an immutable, 
              transparent record of all legal work and payments.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-8 rounded-lg border bg-card hover-elevate transition-all"
                data-testid={`feature-card-${index}`}
              >
                <div className="text-primary mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-muted/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Transform Legal Payments?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join lawyers and clients who trust blockchain technology for transparent, 
            secure legal fee management.
          </p>
          <Button
            size="lg"
            className="text-lg px-8 py-6 h-auto"
            onClick={handleConnect}
            data-testid="button-get-started"
          >
            Get Started Now
          </Button>
        </div>
      </section>

      <footer className="py-12 px-6 border-t">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm text-muted-foreground">
            © 2025 LegalTrust. Built on the Internet Computer blockchain.
          </p>
        </div>
      </footer>
    </div>
  );
}
