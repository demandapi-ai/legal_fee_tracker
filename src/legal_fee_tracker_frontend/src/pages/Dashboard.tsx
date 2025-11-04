import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Plus, Briefcase, Clock, DollarSign, CheckCircle2, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "../contexts/AuthContext";
import { StatusBadge } from "../components/StatusBadge";
import { formatCurrency, formatTimeAgo } from "../lib/utils";
import { UserEngagement } from "../../../declarations/UserEngagement";
import type { Engagement } from "../../../declarations/UserEngagement/UserEngagement.did";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { principalId } = useAuth();
  const [engagements, setEngagements] = useState<Engagement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEngagements();
  }, []);

  const loadEngagements = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const actor = UserEngagement;
      const result = await actor.getMyEngagements();
      setEngagements(result);
    } catch (err) {
      console.error("Error loading engagements:", err);
      setError(err instanceof Error ? err.message : "Failed to load engagements");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusString = (status: any): "Active" | "Completed" | "Paused" | "Cancelled" | "Disputed" | "Pending" => {
    if ('Active' in status) return "Active";
    if ('Completed' in status) return "Completed";
    if ('Paused' in status) return "Paused";
    if ('Cancelled' in status) return "Cancelled";
    if ('Disputed' in status) return "Disputed";
    return "Pending";
  };

  const userType = engagements.length > 0 && principalId
    ? engagements[0].lawyer.toString() === principalId 
      ? "Lawyer" 
      : "Client"
    : "Client";

  const activeEngagements = engagements.filter(e => {
    const status = getStatusString(e.status);
    return status === "Active";
  });

  const pendingEngagements = engagements.filter(e => {
    const status = getStatusString(e.status);
    return status === "Paused" || e.timeEntries.some(entry => !entry.approved);
  });

  const completedEngagements = engagements.filter(e => {
    const status = getStatusString(e.status);
    return status === "Completed";
  });

  const totalEarned = engagements.reduce((sum, e) => sum + e.spentAmount, BigInt(0));
  const totalHours = engagements.reduce((sum, e) => 
    sum + e.timeEntries.reduce((h, entry) => h + entry.hours, 0), 0
  );
  const completedCount = completedEngagements.length;

  const formatCurrencyValue = (amount: bigint) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Number(amount) / 100);
  };

  const stats = [
    {
      title: "Total Engagements",
      value: engagements.length.toString(),
      icon: <Briefcase className="h-5 w-5" />,
      trend: `${activeEngagements.length} active`,
    },
    {
      title: "Active Cases",
      value: activeEngagements.length.toString(),
      icon: <Clock className="h-5 w-5" />,
      trend: `${pendingEngagements.length} pending approval`,
    },
    {
      title: userType === "Lawyer" ? "Total Earned" : "Total Spent",
      value: formatCurrencyValue(totalEarned),
      icon: <DollarSign className="h-5 w-5" />,
      trend: `${totalHours.toFixed(1)} hours logged`,
    },
    {
      title: "Completed",
      value: completedCount.toString(),
      icon: <CheckCircle2 className="h-5 w-5" />,
      trend: engagements.length > 0 
        ? `${Math.round((completedCount / engagements.length) * 100)}% completion rate`
        : "0% completion rate",
    },
  ];

  const getEngagementHours = (engagement: Engagement) => {
    return engagement.timeEntries.reduce((sum, entry) => sum + entry.hours, 0);
  };

  const getOtherPartyName = (engagement: Engagement) => {
    const otherPrincipal = userType === "Lawyer" ? engagement.client : engagement.lawyer;
    return otherPrincipal.toString().slice(0, 8) + "...";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={loadEngagements}>Try Again</Button>
      </div>
    );
  }

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
          {activeEngagements.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No active engagements</p>
              </CardContent>
            </Card>
          ) : (
            activeEngagements.map((engagement) => (
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
                        {userType === "Lawyer" ? "Client" : "Lawyer"}: {getOtherPartyName(engagement)}
                      </p>
                    </div>
                    <StatusBadge status={getStatusString(engagement.status)} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Escrow Balance</p>
                      <p className="text-lg font-mono font-semibold">
                        {formatCurrencyValue(engagement.escrowAmount - engagement.spentAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Hours Logged</p>
                      <p className="text-lg font-mono font-semibold">
                        {getEngagementHours(engagement).toFixed(1)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Last Update</p>
                      <p className="text-sm">{formatTimeAgo(Number(engagement.updatedAt))}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {pendingEngagements.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No pending approvals</p>
              </CardContent>
            </Card>
          ) : (
            pendingEngagements.map((engagement) => {
              const unapprovedEntries = engagement.timeEntries.filter(e => !e.approved);
              return (
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
                          {userType === "Lawyer" ? "Client" : "Lawyer"}: {getOtherPartyName(engagement)}
                        </p>
                      </div>
                      <StatusBadge status={getStatusString(engagement.status)} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {unapprovedEntries.length > 0 
                        ? `${unapprovedEntries.length} time ${unapprovedEntries.length === 1 ? 'entry' : 'entries'} awaiting approval`
                        : "Waiting for action"}
                    </p>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedEngagements.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No completed engagements</p>
              </CardContent>
            </Card>
          ) : (
            completedEngagements.map((engagement) => (
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
                        {userType === "Lawyer" ? "Client" : "Lawyer"}: {getOtherPartyName(engagement)}
                      </p>
                    </div>
                    <StatusBadge status={getStatusString(engagement.status)} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Total Paid</p>
                      <p className="text-lg font-mono font-semibold">
                        {formatCurrencyValue(engagement.spentAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Completed</p>
                      <p className="text-sm">
                        {engagement.completedAt && engagement.completedAt.length > 0
                          ? formatTimeAgo(Number(engagement.completedAt[0]))
                          : formatTimeAgo(Number(engagement.updatedAt))}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}