import { useState, useEffect } from "react";
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
import { LayoutDashboard, Search, Briefcase, User, LogOut, Scale, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { getInitials, formatCurrency } from "@/lib/utils";
import { UserManagement } from "../../../declarations/UserManagement";
import type { LawyerProfile, ClientProfile } from "../../../declarations/UserManagement/UserManagement.did";
import { Principal } from "@dfinity/principal";

export function AppSidebar() {
  const [location, setLocation] = useLocation();
  const { principalId, logout } = useAuth();
  const [profile, setProfile] = useState<LawyerProfile | ClientProfile | null>(null);
  const [userType, setUserType] = useState<"Lawyer" | "Client" | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, [principalId]);

  const loadProfile = async () => {
    if (!principalId) {
      setIsLoading(false);
      return;
    }

    try {
      const actor = UserManagement;
      const principal = Principal.fromText(principalId);

      // Try to get user type first
      const userTypeResult = await actor.getUserType(principal);
      
      if ('Lawyer' in userTypeResult) {
        const result = await actor.getLawyerProfile(principal);
        if ('ok' in result) {
          setProfile(result.ok);
        }
      } else if ('Client' in userTypeResult) {
        const result = await actor.getClientProfile(principal);
        if ('ok' in result) {
          setProfile(result.ok);
        }
      }
    } catch (err) {
      console.error("Error loading profile:", err);
    } finally {
      setIsLoading(false);
    }
  };

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

  const getUserName = () => {
    if (profile) {
      return profile.name;
    }
    return userType === "Lawyer" ? "Lawyer" : "Client";
  };

  const getUserEmail = () => {
    if (profile) {
      return profile.email;
    }
    return "";
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
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>{getInitials(getUserName())}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {getUserName()}
                  </p>
                  {getUserEmail() && (
                    <p className="text-xs text-muted-foreground truncate">
                      {getUserEmail()}
                    </p>
                  )}
                  <Badge variant="secondary" className="text-xs mt-1">
                    {userType}
                  </Badge>
                </div>
              </div>

              {profile && (
                <div className="space-y-2">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Total Engagements</p>
                    <p className="text-sm font-mono font-semibold">
                      {Number(profile.totalEngagements)}
                    </p>
                  </div>
                  
                  {'rating' in profile && profile.reviewCount > 0 && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Rating</p>
                      <p className="text-sm font-semibold">
                        ⭐ {profile.rating.toFixed(1)} ({Number(profile.reviewCount)} reviews)
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          <SidebarMenuButton onClick={handleLogout} data-testid="button-logout">
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </SidebarMenuButton>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}