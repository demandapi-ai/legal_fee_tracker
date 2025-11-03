import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Menu, LayoutDashboard, Search, Briefcase, User, LogOut, Scale } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "./ThemeToggle";
import { getInitials, formatCurrency } from "@/lib/utils";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const { userType, logout } = useAuth();

  const menuItems = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    ...(userType === "Client"
      ? [
          {
            title: "Find a Lawyer",
            url: "/lawyers",
            icon: Search,
          },
        ]
      : []),
    {
      title: "My Engagements",
      url: "/dashboard",
      icon: Briefcase,
    },
    {
      title: "Profile",
      url: "/profile",
      icon: User,
    },
  ];

  const navigate = (url: string) => {
    setLocation(url);
    setOpen(false);
  };

  const handleLogout = () => {
    logout();
    setLocation("/");
    setOpen(false);
  };

  return (
    <div className="flex items-center justify-between p-4 border-b lg:hidden sticky top-0 z-50 bg-background">
      <div className="flex items-center gap-2">
        <Scale className="h-6 w-6 text-primary" />
        <span className="text-lg font-bold">LegalTrust</span>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" data-testid="button-menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80">
            <div className="flex flex-col h-full">
              <div className="flex items-center gap-2 mb-8">
                <Scale className="h-8 w-8 text-primary" />
                <span className="text-xl font-bold">LegalTrust</span>
              </div>

              <nav className="flex-1 space-y-2">
                {menuItems.map((item) => (
                  <Button
                    key={item.title}
                    variant={location === item.url ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => navigate(item.url)}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.title}
                  </Button>
                ))}
              </nav>

              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{getInitials(userType === "Lawyer" ? "Sarah Johnson" : "Tech Startup")}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {userType === "Lawyer" ? "Sarah Johnson" : "Tech Startup"}
                    </p>
                    <Badge variant="secondary" className="text-xs">
                      {userType}
                    </Badge>
                  </div>
                </div>

                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">ckUSDC Balance</p>
                  <p className="text-sm font-mono font-semibold">{formatCurrency(500000000000)}</p>
                </div>

                <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
