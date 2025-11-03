import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Plus, Briefcase, Clock, DollarSign, CheckCircle2 } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "../contexts/AuthContext";
import { StatusBadge } from "../components/StatusBadge";
import { formatCurrency, formatTimeAgo } from "../lib/utils";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { userType } = useAuth();

  const stats = [
    {
      title: "Total Engagements",
      value: "12",
      icon: <Briefcase className="h-5 w-5" />,
      trend: "+2 this month",
    },
    {
      title: "Active Cases",
      value: "5",
      icon: <Clock className="h-5 w-5" />,
      trend: "3 pending approval",
    },
    {
      title: userType === "Lawyer" ? "Total Earned" : "Total Spent",
      value: formatCurrency(245000000000),
      icon: <DollarSign className="h-5 w-5" />,
      trend: "+$12,500 this month",
    },
    {
      title: "Completed",
      value: "7",
      icon: <CheckCircle2 className="h-5 w-5" />,
      trend: "58% success rate",
    },
  ];

  const mockEngagements = [
    {
      id: "1",
      title: "Contract Review for SaaS Agreement",
      otherParty: userType === "Lawyer" ? "Tech Startup Inc." : "Sarah Johnson",
      status: "Active" as const,
      escrowBalance: 200000000000,
      hoursLogged: 8.5,
      lastUpdate: Date.now() * 1000000 - 3600000000000,
    },
    {
      id: "2",
      title: "Corporate Merger Documentation",
      otherParty: userType === "Lawyer" ? "Global Corp" : "Michael Chen",
      status: "Pending" as const,
      escrowBalance: 500000000000,
      hoursLogged: 0,
      lastUpdate: Date.now() * 1000000 - 86400000000000,
    },
    {
      id: "3",
      title: "IP Licensing Agreement",
      otherParty: userType === "Lawyer" ? "Innovation Labs" : "David Smith",
      status: "Active" as const,
      escrowBalance: 150000000000,
      hoursLogged: 12.0,
      lastUpdate: Date.now() * 1000000 - 7200000000000,
    },
  ];

  const completedEngagements = [
    {
      id: "4",
      title: "Employment Contract Dispute Resolution",
      otherParty: userType === "Lawyer" ? "ABC Company" : "Jennifer Williams",
      status: "Completed" as const,
      totalPaid: 350000000000,
      completedDate: Date.now() * 1000000 - 604800000000000,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's an overview of your legal engagements.
          </p>
        </div>
        <Button onClick={() => setLocation(userType === "Lawyer" ? "/dashboard" : "/lawyers")} data-testid="button-new-engagement">
          <Plus className="mr-2 h-4 w-4" />
          {userType === "Lawyer" ? "View Requests" : "Find a Lawyer"}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index} data-testid={`stat-card-${index}`}>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className="text-muted-foreground">{stat.icon}</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.trend}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="active" className="space-y-6">
        <TabsList>
          <TabsTrigger value="active" data-testid="tab-active">Active</TabsTrigger>
          <TabsTrigger value="pending" data-testid="tab-pending">Pending</TabsTrigger>
          <TabsTrigger value="completed" data-testid="tab-completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {mockEngagements
            .filter((e) => e.status === "Active")
            .map((engagement) => (
              <Card
                key={engagement.id}
                className="hover-elevate cursor-pointer transition-all"
                onClick={() => setLocation(`/engagement/${engagement.id}`)}
                data-testid={`engagement-card-${engagement.id}`}
              >
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="mb-2">{engagement.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {userType === "Lawyer" ? "Client" : "Lawyer"}: {engagement.otherParty}
                      </p>
                    </div>
                    <StatusBadge status={engagement.status} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Escrow Balance</p>
                      <p className="text-lg font-mono font-semibold">{formatCurrency(engagement.escrowBalance)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Hours Logged</p>
                      <p className="text-lg font-mono font-semibold">{engagement.hoursLogged}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Last Update</p>
                      <p className="text-sm">{formatTimeAgo(engagement.lastUpdate)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {mockEngagements
            .filter((e) => e.status === "Pending")
            .map((engagement) => (
              <Card
                key={engagement.id}
                className="hover-elevate cursor-pointer transition-all"
                onClick={() => setLocation(`/engagement/${engagement.id}`)}
                data-testid={`engagement-card-${engagement.id}`}
              >
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="mb-2">{engagement.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {userType === "Lawyer" ? "Client" : "Lawyer"}: {engagement.otherParty}
                      </p>
                    </div>
                    <StatusBadge status={engagement.status} />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Waiting for {userType === "Lawyer" ? "client" : "lawyer"} confirmation
                  </p>
                </CardContent>
              </Card>
            ))}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedEngagements.map((engagement) => (
            <Card
              key={engagement.id}
              className="hover-elevate cursor-pointer transition-all"
              onClick={() => setLocation(`/engagement/${engagement.id}`)}
              data-testid={`engagement-card-${engagement.id}`}
            >
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="mb-2">{engagement.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {userType === "Lawyer" ? "Client" : "Lawyer"}: {engagement.otherParty}
                    </p>
                  </div>
                  <StatusBadge status={engagement.status} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Paid</p>
                    <p className="text-lg font-mono font-semibold">{formatCurrency(engagement.totalPaid)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Completed</p>
                    <p className="text-sm">{formatTimeAgo(engagement.completedDate)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
