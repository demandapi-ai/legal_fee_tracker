import { z } from "zod";

// ============================
// ENUMS AND TYPE DEFINITIONS
// ============================

export type UserType = "Client" | "Lawyer" | "Both";

export type EngagementStatus = "Active" | "Pending" | "Completed" | "Cancelled" | "Disputed" | "Paused";

export type TransactionType = "Deposit" | "Release" | "Refund" | "Dispute";

export type PaymentRequestStatus = "Pending" | "Approved" | "Paid" | "Rejected";

export type MilestoneStatus = "Pending" | "Completed" | "Approved" | "Paid" | "Disputed";

// ============================
// USER SCHEMAS
// ============================

export const lawyerProfileSchema = z.object({
  principal: z.string(),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  walletAddress: z.string(),
  bio: z.string(),
  jurisdiction: z.string().min(1, "Jurisdiction is required"),
  specializations: z.array(z.string()).min(1, "At least one specialization required"),
  hourlyRate: z.number().positive().optional(),
  verified: z.boolean(),
  rating: z.number().min(0).max(5),
  reviewCount: z.number(),
  totalEngagements: z.number(),
  completedEngagements: z.number(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const clientProfileSchema = z.object({
  principal: z.string(),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  walletAddress: z.string(),
  rating: z.number().min(0).max(5),
  reviewCount: z.number(),
  totalEngagements: z.number(),
  completedEngagements: z.number(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const createLawyerProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  walletAddress: z.string().min(1, "Wallet address is required"),
  bio: z.string().min(10, "Bio must be at least 10 characters"),
  jurisdiction: z.string().min(1, "Jurisdiction is required"),
  specializations: z.array(z.string()).min(1, "At least one specialization required"),
  hourlyRate: z.number().positive("Hourly rate must be positive").optional(),
});

export const createClientProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  walletAddress: z.string().min(1, "Wallet address is required"),
});

export const reviewSchema = z.object({
  id: z.number(),
  reviewerPrincipal: z.string(),
  revieweePrincipal: z.string(),
  engagementId: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string(),
  timestamp: z.number(),
});

export type LawyerProfile = z.infer<typeof lawyerProfileSchema>;
export type ClientProfile = z.infer<typeof clientProfileSchema>;
export type CreateLawyerProfile = z.infer<typeof createLawyerProfileSchema>;
export type CreateClientProfile = z.infer<typeof createClientProfileSchema>;
export type Review = z.infer<typeof reviewSchema>;

// ============================
// ENGAGEMENT SCHEMAS
// ============================

export const milestoneSchema = z.object({
  id: z.number(),
  description: z.string(),
  amount: z.number(),
  dueDate: z.number().optional(),
  status: z.enum(["Pending", "Completed", "Approved", "Paid", "Disputed"]),
  completedAt: z.number().optional(),
});

export const timeEntrySchema = z.object({
  id: z.number(),
  lawyerPrincipal: z.string(),
  hours: z.number().positive(),
  rate: z.number(),
  description: z.string(),
  timestamp: z.number(),
  approved: z.boolean(),
});

export const documentSchema = z.object({
  id: z.number(),
  name: z.string(),
  contentHash: z.string(),
  fileSize: z.number(),
  uploadedBy: z.string(),
  timestamp: z.number(),
});

export const messageSchema = z.object({
  id: z.number(),
  sender: z.string(),
  content: z.string(),
  timestamp: z.number(),
});

export const engagementTypeSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("Hourly"),
    rate: z.number().positive(),
  }),
  z.object({
    type: z.literal("FixedFee"),
    amount: z.number().positive(),
  }),
  z.object({
    type: z.literal("Milestone"),
    milestones: z.array(milestoneSchema),
  }),
]);

export const engagementSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  lawyer: z.string(),
  client: z.string(),
  engagementType: engagementTypeSchema,
  status: z.enum(["Active", "Pending", "Completed", "Cancelled", "Disputed", "Paused"]),
  escrowAmount: z.number(),
  spentAmount: z.number(),
  timeEntries: z.array(timeEntrySchema),
  documents: z.array(documentSchema),
  messages: z.array(messageSchema),
  createdAt: z.number(),
  updatedAt: z.number(),
  completedAt: z.number().optional(),
});

export const createEngagementSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  lawyer: z.string(),
  client: z.string(),
  engagementType: engagementTypeSchema,
  escrowAmount: z.number().positive("Escrow amount must be positive"),
});

export const feeBreakdownSchema = z.object({
  totalBilled: z.number(),
  pending: z.number(),
  approved: z.number(),
  hoursLogged: z.number(),
  escrowBalance: z.number(),
});

export type Milestone = z.infer<typeof milestoneSchema>;
export type TimeEntry = z.infer<typeof timeEntrySchema>;
export type Document = z.infer<typeof documentSchema>;
export type Message = z.infer<typeof messageSchema>;
export type EngagementType = z.infer<typeof engagementTypeSchema>;
export type Engagement = z.infer<typeof engagementSchema>;
export type CreateEngagement = z.infer<typeof createEngagementSchema>;
export type FeeBreakdown = z.infer<typeof feeBreakdownSchema>;

// ============================
// PAYMENT/ESCROW SCHEMAS
// ============================

export const transactionSchema = z.object({
  id: z.number(),
  engagementId: z.string(),
  from: z.string(),
  to: z.string(),
  amount: z.number(),
  txType: z.enum(["Deposit", "Release", "Refund", "Dispute"]),
  memo: z.string(),
  timestamp: z.number(),
  blockIndex: z.number().optional(),
});

export const escrowAccountSchema = z.object({
  engagementId: z.string(),
  client: z.string(),
  lawyer: z.string(),
  balance: z.number(),
  totalDeposited: z.number(),
  totalReleased: z.number(),
  totalRefunded: z.number(),
  transactions: z.array(z.number()),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const paymentRequestSchema = z.object({
  id: z.number(),
  engagementId: z.string(),
  requestedBy: z.string(),
  amount: z.number(),
  reason: z.string(),
  status: z.enum(["Pending", "Approved", "Paid", "Rejected"]),
  createdAt: z.number(),
});

export type Transaction = z.infer<typeof transactionSchema>;
export type EscrowAccount = z.infer<typeof escrowAccountSchema>;
export type PaymentRequest = z.infer<typeof paymentRequestSchema>;

// ============================
// FILTER SCHEMAS
// ============================

export const lawyerSearchFiltersSchema = z.object({
  specialization: z.string().optional(),
  jurisdiction: z.string().optional(),
  minRate: z.number().optional(),
  maxRate: z.number().optional(),
  minRating: z.number().optional(),
});

export type LawyerSearchFilters = z.infer<typeof lawyerSearchFiltersSchema>;
