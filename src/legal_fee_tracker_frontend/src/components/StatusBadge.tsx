import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, XCircle, Pause, AlertCircle } from "lucide-react";
import type { EngagementStatus, PaymentRequestStatus, MilestoneStatus } from "@shared/schema";

interface StatusBadgeProps {
  status: EngagementStatus | PaymentRequestStatus | MilestoneStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "Active":
        return {
          icon: <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />,
          text: "Active",
          variant: "default" as const,
        };
      case "Pending":
        return {
          icon: <Clock className="h-3 w-3" />,
          text: "Pending",
          variant: "secondary" as const,
        };
      case "Completed":
      case "Approved":
      case "Paid":
        return {
          icon: <CheckCircle2 className="h-3 w-3" />,
          text: status,
          variant: "default" as const,
        };
      case "Cancelled":
      case "Rejected":
        return {
          icon: <XCircle className="h-3 w-3" />,
          text: status,
          variant: "destructive" as const,
        };
      case "Disputed":
        return {
          icon: <AlertCircle className="h-3 w-3" />,
          text: "Disputed",
          variant: "destructive" as const,
        };
      case "Paused":
        return {
          icon: <Pause className="h-3 w-3" />,
          text: "Paused",
          variant: "secondary" as const,
        };
      default:
        return {
          icon: null,
          text: status,
          variant: "secondary" as const,
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Badge variant={config.variant} className={className} data-testid={`badge-status-${status.toLowerCase()}`}>
      {config.icon}
      <span className="ml-1">{config.text}</span>
    </Badge>
  );
}
