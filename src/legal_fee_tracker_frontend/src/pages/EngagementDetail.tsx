import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, DollarSign, FileText, MessageSquare, TrendingUp, Check, X, Upload, Send } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency, formatDateTime, formatTimeAgo } from "@/lib/utils";

export default function EngagementDetail() {
  const { userType } = useAuth();
  const [newTimeHours, setNewTimeHours] = useState("");
  const [newTimeDesc, setNewTimeDesc] = useState("");
  const [newMessage, setNewMessage] = useState("");

  const engagement = {
    id: "1",
    title: "Contract Review for SaaS Agreement",
    description: "Comprehensive review and negotiation of SaaS terms, data privacy clauses, and liability limitations.",
    lawyer: "Sarah Johnson",
    client: "Tech Startup Inc.",
    status: "Active" as const,
    engagementType: { type: "Hourly" as const, rate: 250000000000 },
    escrowBalance: 175000000000,
    escrowAmount: 200000000000,
    spentAmount: 25000000000,
    createdAt: Date.now() * 1000000 - 7 * 24 * 3600000000000,
  };

  const timeEntries = [
    {
      id: 1,
      hours: 3.5,
      rate: 250000000000,
      description: "Initial contract review and identification of key issues",
      timestamp: Date.now() * 1000000 - 2 * 24 * 3600000000000,
      approved: true,
    },
    {
      id: 2,
      hours: 5.0,
      rate: 250000000000,
      description: "Drafted revisions and negotiation points for data privacy section",
      timestamp: Date.now() * 1000000 - 1 * 24 * 3600000000000,
      approved: false,
    },
  ];

  const transactions = [
    {
      id: 1,
      type: "Deposit" as const,
      amount: 200000000000,
      from: "client",
      to: "escrow",
      timestamp: Date.now() * 1000000 - 7 * 24 * 3600000000000,
      memo: "Initial escrow deposit",
    },
    {
      id: 2,
      type: "Release" as const,
      amount: 25000000000,
      from: "escrow",
      to: "lawyer",
      timestamp: Date.now() * 1000000 - 2 * 24 * 3600000000000,
      memo: "Payment for approved time entry #1",
    },
  ];

  const documents = [
    {
      id: 1,
      name: "Original_SaaS_Agreement.pdf",
      fileSize: 245000,
      uploadedBy: "client",
      timestamp: Date.now() * 1000000 - 7 * 24 * 3600000000000,
    },
    {
      id: 2,
      name: "Redlined_Version_v1.pdf",
      fileSize: 289000,
      uploadedBy: "lawyer",
      timestamp: Date.now() * 1000000 - 3 * 24 * 3600000000000,
    },
  ];

  const messages = [
    {
      id: 1,
      sender: "lawyer",
      content: "I've completed the initial review. There are several concerning clauses regarding data ownership that we should discuss.",
      timestamp: Date.now() * 1000000 - 2 * 24 * 3600000000000,
    },
    {
      id: 2,
      sender: "client",
      content: "Thanks for the quick turnaround. Can we schedule a call tomorrow to go over these points?",
      timestamp: Date.now() * 1000000 - 2 * 24 * 3600000000000 + 3600000000000,
    },
  ];

  const totalHours = timeEntries.reduce((sum, entry) => sum + entry.hours, 0);
  const approvedHours = timeEntries.filter(e => e.approved).reduce((sum, entry) => sum + entry.hours, 0);
  const pendingEntries = timeEntries.filter(e => !e.approved);

  const handleAddTimeEntry = () => {
    setNewTimeHours("");
    setNewTimeDesc("");
  };

  const handleApproveTimeEntry = (entryId: number) => {
    console.log("Approve time entry:", entryId);
  };

  const handleRejectTimeEntry = (entryId: number) => {
    console.log("Reject time entry:", entryId);
  };

  const handleSendMessage = () => {
    setNewMessage("");
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold mb-2">{engagement.title}</h1>
            <p className="text-muted-foreground">{engagement.description}</p>
          </div>
          <StatusBadge status={engagement.status} />
        </div>

        <div className="flex flex-wrap gap-6 text-sm">
          <div>
            <span className="text-muted-foreground">Lawyer:</span>
            <span className="ml-2 font-medium">{engagement.lawyer}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Client:</span>
            <span className="ml-2 font-medium">{engagement.client}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Created:</span>
            <span className="ml-2">{formatTimeAgo(engagement.createdAt)}</span>
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
            <div className="text-2xl font-bold font-mono">{formatCurrency(engagement.escrowBalance)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              of {formatCurrency(engagement.escrowAmount)} deposited
            </p>
            <Progress value={(engagement.escrowBalance / engagement.escrowAmount) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hours Logged</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{totalHours}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {approvedHours} approved
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
              {timeEntries.filter(e => e.approved).length} payments
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
                  <p className="font-semibold">Hourly Rate</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Rate</p>
                  <p className="font-mono font-semibold">{formatCurrency(engagement.engagementType.rate)}/hr</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Deposited</p>
                  <p className="font-mono font-semibold">{formatCurrency(engagement.escrowAmount)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Remaining Balance</p>
                  <p className="font-mono font-semibold">{formatCurrency(engagement.escrowBalance)}</p>
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
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Description</label>
                  <Textarea
                    placeholder="Describe the work performed..."
                    value={newTimeDesc}
                    onChange={(e) => setNewTimeDesc(e.target.value)}
                    data-testid="input-time-description"
                  />
                </div>
                {newTimeHours && (
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Amount to bill:</p>
                    <p className="text-xl font-mono font-semibold">
                      {formatCurrency(parseFloat(newTimeHours) * engagement.engagementType.rate)}
                    </p>
                  </div>
                )}
                <Button onClick={handleAddTimeEntry} className="w-full" data-testid="button-add-time">
                  <Clock className="mr-2 h-4 w-4" />
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
                {timeEntries.map((entry) => (
                  <div key={entry.id} className="border rounded-lg p-4">
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={entry.approved ? "default" : "secondary"}>
                            {entry.approved ? "Approved" : "Pending"}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatTimeAgo(entry.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm mb-2">{entry.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground mb-1">Amount</p>
                        <p className="font-mono font-semibold">
                          {formatCurrency(entry.hours * entry.rate)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">Hours: <span className="font-mono font-semibold">{entry.hours}</span></span>
                      <span className="text-muted-foreground">Rate: <span className="font-mono">{formatCurrency(entry.rate)}/hr</span></span>
                    </div>
                    
                    {!entry.approved && userType === "Client" && (
                      <div className="flex gap-2 mt-4">
                        <Button
                          size="sm"
                          onClick={() => handleApproveTimeEntry(entry.id)}
                          data-testid={`button-approve-${entry.id}`}
                        >
                          <Check className="mr-2 h-4 w-4" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejectTimeEntry(entry.id)}
                          data-testid={`button-reject-${entry.id}`}
                        >
                          <X className="mr-2 h-4 w-4" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
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
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover-elevate transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(doc.fileSize / 1000).toFixed(1)} KB • Uploaded by {doc.uploadedBy} • {formatTimeAgo(doc.timestamp)}
                        </p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" data-testid={`button-download-${doc.id}`}>
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          {userType === "Client" && (
            <Card>
              <CardHeader>
                <CardTitle>Add Funds to Escrow</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Amount (USD)</label>
                  <Input type="number" placeholder="1000" data-testid="input-deposit-amount" />
                </div>
                <Button className="w-full" data-testid="button-deposit">
                  <DollarSign className="mr-2 h-4 w-4" />
                  Deposit to Escrow
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        tx.type === "Deposit" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" :
                        tx.type === "Release" ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" :
                        "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                      }`}>
                        <DollarSign className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">{tx.type}</p>
                        <p className="text-xs text-muted-foreground">{tx.memo}</p>
                        <p className="text-xs text-muted-foreground">{formatDateTime(tx.timestamp)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-mono font-semibold ${
                        tx.type === "Deposit" ? "text-blue-600 dark:text-blue-400" :
                        tx.type === "Release" ? "text-green-600 dark:text-green-400" :
                        "text-red-600 dark:text-red-400"
                      }`}>
                        {tx.type === "Deposit" ? "+" : "-"}{formatCurrency(tx.amount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages" className="space-y-6">
          <Card className="h-[500px] flex flex-col">
            <CardHeader>
              <CardTitle>Encrypted Communication</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === (userType === "Lawyer" ? "lawyer" : "client") ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] p-3 rounded-lg ${
                        msg.sender === (userType === "Lawyer" ? "lawyer" : "client")
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <p className="text-xs opacity-70 mt-1">{formatTimeAgo(msg.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  data-testid="input-message"
                />
                <Button onClick={handleSendMessage} data-testid="button-send-message">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
