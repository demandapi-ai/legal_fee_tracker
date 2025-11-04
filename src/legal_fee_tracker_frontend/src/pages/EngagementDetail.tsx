import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { Clock, DollarSign, FileText, MessageSquare, TrendingUp, Check, X, Upload, Send, Loader2 } from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";
import { useAuth } from "../contexts/AuthContext";
import { formatDateTime, formatTimeAgo } from "../lib/utils";
import { UserEngagement } from "../../../declarations/UserEngagement";
import type { Engagement, TimeEntry, Document, Message } from "../../../declarations/UserEngagement/UserEngagement.did";
import { useParams } from "wouter";
import { Principal } from "@dfinity/principal";

export default function EngagementDetail() {
  const { id } = useParams<{ id: string }>();
  const { principalId, identity } = useAuth();
  const [engagement, setEngagement] = useState<Engagement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTimeHours, setNewTimeHours] = useState("");
  const [newTimeDesc, setNewTimeDesc] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const userType = engagement && principalId 
    ? engagement.lawyer.toString() === principalId 
      ? "Lawyer" 
      : "Client"
    : null;

  useEffect(() => {
    loadEngagement();
  }, [id]);

  const loadEngagement = async () => {
    if (!id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const actor = UserEngagement;
      const result = await actor.getEngagement(id);
      
      if ('err' in result) {
        throw new Error(result.err);
      }
      
      setEngagement(result.ok);
    } catch (err) {
      console.error("Error loading engagement:", err);
      setError(err instanceof Error ? err.message : "Failed to load engagement");
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: bigint) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Number(amount) / 100);
  };

  const getEngagementRate = (): bigint => {
    if (!engagement) return BigInt(0);
    if ('Hourly' in engagement.engagementType) {
      return engagement.engagementType.Hourly.rate;
    }
    return BigInt(0);
  };

  const totalHours = engagement?.timeEntries.reduce((sum, entry) => sum + entry.hours, 0) || 0;
  const approvedHours = engagement?.timeEntries.filter(e => e.approved).reduce((sum, entry) => sum + entry.hours, 0) || 0;
  const pendingEntries = engagement?.timeEntries.filter(e => !e.approved) || [];

  const handleAddTimeEntry = async () => {
    if (!id || !newTimeHours || !newTimeDesc) return;
    
    setIsSubmitting(true);
    try {
      const actor = UserEngagement;
      const result = await actor.addTimeEntry(
        id,
        newTimeDesc,
        parseFloat(newTimeHours)
      );
      
      if ('err' in result) {
        throw new Error(result.err);
      }
      
      setNewTimeHours("");
      setNewTimeDesc("");
      await loadEngagement();
    } catch (err) {
      console.error("Error adding time entry:", err);
      setError(err instanceof Error ? err.message : "Failed to add time entry");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveTimeEntry = async (entryId: bigint) => {
    if (!id) return;
    
    setIsSubmitting(true);
    try {
      const actor = UserEngagement;
      const result = await actor.approveTimeEntry(id, entryId);
      
      if ('err' in result) {
        throw new Error(result.err);
      }
      
      await loadEngagement();
    } catch (err) {
      console.error("Error approving time entry:", err);
      setError(err instanceof Error ? err.message : "Failed to approve time entry");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendMessage = async () => {
    if (!id || !newMessage.trim()) return;
    
    setIsSubmitting(true);
    try {
      const actor = UserEngagement;
      const result = await actor.sendMessage(id, newMessage);
      
      if ('err' in result) {
        throw new Error(result.err);
      }
      
      setNewMessage("");
      await loadEngagement();
    } catch (err) {
      console.error("Error sending message:", err);
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusString = (status: any): "Active" | "Completed" | "Paused" | "Cancelled" | "Disputed" => {
    if ('Active' in status) return "Active";
    if ('Completed' in status) return "Completed";
    if ('Paused' in status) return "Paused";
    if ('Cancelled' in status) return "Cancelled";
    if ('Disputed' in status) return "Disputed";
    return "Active";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !engagement) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive mb-4">{error || "Engagement not found"}</p>
        <Button onClick={loadEngagement}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold mb-2">{engagement.title}</h1>
            <p className="text-muted-foreground">{engagement.description}</p>
          </div>
          <StatusBadge status={getStatusString(engagement.status)} />
        </div>

        <div className="flex flex-wrap gap-6 text-sm">
          <div>
            <span className="text-muted-foreground">Lawyer:</span>
            <span className="ml-2 font-medium">{engagement.lawyer.toString().slice(0, 8)}...</span>
          </div>
          <div>
            <span className="text-muted-foreground">Client:</span>
            <span className="ml-2 font-medium">{engagement.client.toString().slice(0, 8)}...</span>
          </div>
          <div>
            <span className="text-muted-foreground">Created:</span>
            <span className="ml-2">{formatTimeAgo(Number(engagement.createdAt))}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Escrow Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {formatCurrency(engagement.escrowAmount - engagement.spentAmount)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              of {formatCurrency(engagement.escrowAmount)} deposited
            </p>
            <Progress 
              value={Number((BigInt(100) * (engagement.escrowAmount - engagement.spentAmount)) / engagement.escrowAmount)} 
              className="mt-2" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hours Logged</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{totalHours.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {approvedHours.toFixed(1)} approved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Amount Paid</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{formatCurrency(engagement.spentAmount)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {engagement.timeEntries.filter(e => e.approved).length} payments
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="time" data-testid="tab-time">Time & Milestones</TabsTrigger>
          <TabsTrigger value="documents" data-testid="tab-documents">Documents</TabsTrigger>
          <TabsTrigger value="payments" data-testid="tab-payments">Payments</TabsTrigger>
          <TabsTrigger value="messages" data-testid="tab-messages">Communication</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Engagement Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Engagement Type</p>
                  <p className="font-semibold">
                    {'Hourly' in engagement.engagementType ? 'Hourly Rate' :
                     'FixedFee' in engagement.engagementType ? 'Fixed Fee' :
                     'Milestone-Based'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Rate</p>
                  <p className="font-mono font-semibold">{formatCurrency(getEngagementRate())}/hr</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Deposited</p>
                  <p className="font-mono font-semibold">{formatCurrency(engagement.escrowAmount)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Remaining Balance</p>
                  <p className="font-mono font-semibold">
                    {formatCurrency(engagement.escrowAmount - engagement.spentAmount)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {userType === "Client" && pendingEntries.length > 0 && (
            <Card className="border-yellow-200 dark:border-yellow-900 bg-yellow-50/50 dark:bg-yellow-900/10">
              <CardHeader>
                <CardTitle className="text-yellow-900 dark:text-yellow-200">
                  Pending Approvals ({pendingEntries.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  You have {pendingEntries.length} time {pendingEntries.length === 1 ? "entry" : "entries"} waiting for your review.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="time" className="space-y-6">
          {userType === "Lawyer" && (
            <Card>
              <CardHeader>
                <CardTitle>Add Time Entry</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Hours Worked</label>
                  <Input
                    type="number"
                    step="0.25"
                    placeholder="3.5"
                    value={newTimeHours}
                    onChange={(e) => setNewTimeHours(e.target.value)}
                    data-testid="input-time-hours"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Description</label>
                  <Textarea
                    placeholder="Describe the work performed..."
                    value={newTimeDesc}
                    onChange={(e) => setNewTimeDesc(e.target.value)}
                    data-testid="input-time-description"
                    disabled={isSubmitting}
                  />
                </div>
                {newTimeHours && (
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Amount to bill:</p>
                    <p className="text-xl font-mono font-semibold">
                      {formatCurrency(BigInt(Math.round(parseFloat(newTimeHours) * 100)) * getEngagementRate() / BigInt(100))}
                    </p>
                  </div>
                )}
                <Button 
                  onClick={handleAddTimeEntry} 
                  className="w-full" 
                  data-testid="button-add-time"
                  disabled={isSubmitting || !newTimeHours || !newTimeDesc}
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Clock className="mr-2 h-4 w-4" />
                  )}
                  Add Time Entry
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Time Entry Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {engagement.timeEntries.map((entry) => (
                  <div key={Number(entry.id)} className="border rounded-lg p-4">
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={entry.approved ? "default" : "secondary"}>
                            {entry.approved ? "Approved" : "Pending"}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatTimeAgo(Number(entry.timestamp))}
                          </span>
                        </div>
                        <p className="text-sm mb-2">{entry.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground mb-1">Amount</p>
                        <p className="font-mono font-semibold">
                          {formatCurrency(BigInt(Math.round(entry.hours * 100)) * entry.rate / BigInt(100))}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">
                        Hours: <span className="font-mono font-semibold">{entry.hours.toFixed(2)}</span>
                      </span>
                      <span className="text-muted-foreground">
                        Rate: <span className="font-mono">{formatCurrency(entry.rate)}/hr</span>
                      </span>
                    </div>
                    
                    {!entry.approved && userType === "Client" && (
                      <div className="flex gap-2 mt-4">
                        <Button
                          size="sm"
                          onClick={() => handleApproveTimeEntry(entry.id)}
                          data-testid={`button-approve-${entry.id}`}
                          disabled={isSubmitting}
                        >
                          <Check className="mr-2 h-4 w-4" />
                          Approve
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
                {engagement.timeEntries.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No time entries yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Documents</CardTitle>
                <Button size="sm" data-testid="button-upload-document">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {engagement.documents.map((doc) => (
                  <div
                    key={Number(doc.id)}
                    className="flex items-center justify-between p-3 border rounded-lg hover-elevate transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(Number(doc.fileSize) / 1024).toFixed(1)} KB • {formatTimeAgo(Number(doc.timestamp))}
                        </p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" data-testid={`button-download-${doc.id}`}>
                      Download
                    </Button>
                  </div>
                ))}
                {engagement.documents.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No documents uploaded yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                  <span className="text-sm text-muted-foreground">Total Escrow</span>
                  <span className="font-mono font-semibold">{formatCurrency(engagement.escrowAmount)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                  <span className="text-sm text-muted-foreground">Spent Amount</span>
                  <span className="font-mono font-semibold">{formatCurrency(engagement.spentAmount)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
                  <span className="text-sm font-medium">Remaining Balance</span>
                  <span className="font-mono font-semibold">
                    {formatCurrency(engagement.escrowAmount - engagement.spentAmount)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages" className="space-y-6">
          <Card className="h-[500px] flex flex-col">
            <CardHeader>
              <CardTitle>Communication</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                {engagement.messages.map((msg) => (
                  <div
                    key={Number(msg.id)}
                    className={`flex ${msg.sender.toString() === principalId ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] p-3 rounded-lg ${
                        msg.sender.toString() === principalId
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <p className="text-xs opacity-70 mt-1">{formatTimeAgo(Number(msg.timestamp))}</p>
                    </div>
                  </div>
                ))}
                {engagement.messages.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No messages yet</p>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && !isSubmitting && handleSendMessage()}
                  data-testid="input-message"
                  disabled={isSubmitting}
                />
                <Button 
                  onClick={handleSendMessage} 
                  data-testid="button-send-message"
                  disabled={isSubmitting || !newMessage.trim()}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}