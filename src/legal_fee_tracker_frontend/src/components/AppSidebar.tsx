import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { LayoutDashboard, Search, Briefcase, User, LogOut, Scale } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { getInitials, formatCurrency } from "@/lib/utils";

export function AppSidebar() {
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

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  return (
    <Sidebar>
      <SidebarContent>
        <div className="px-6 py-6">
          <div className="flex items-center gap-2">
            <Scale className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">LegalTrust</span>
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <a href={item.url} onClick={(e) => {
                      e.preventDefault();
                      setLocation(item.url);
                    }}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="p-4 border-t space-y-4">
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

          <SidebarMenuButton onClick={handleLogout} data-testid="button-logout">
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </SidebarMenuButton>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
