import { z } from "zod";

export const purchaseCreditSchema = z.object({
  packageId: z.string().min(1),
});

export const purchaseTicketSchema = z.object({}).optional();

export const purchaseSubscriptionSchema = z.object({}).optional();

export const proposeInterviewSchema = z.object({
  sitterId: z.string().min(1),
  jobId: z.string().optional(),
  scheduledFor: z.string().datetime().optional(),
});

export const startChatSchema = z.object({
  sitterId: z.string().min(1),
  jobId: z.string().optional(),
});

export const workLogSchema = z.object({
  jobId: z.string().min(1),
  hours: z.number().positive().max(24),
  note: z.string().max(2000).optional(),
  imageUrl: z.string().url().optional(),
});

export const payCareSchema = z.object({
  jobId: z.string().min(1),
  // Optional overrides; otherwise the job's agreed rate/hours are used.
  hours: z.number().positive().max(1000).optional(),
  hourlyRate: z.number().positive().optional(),
});

export const reviewSchema = z.object({
  jobId: z.string().min(1),
  targetId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
});

export const adminSettingsSchema = z.object({
  feeRateBps: z.number().int().min(0).max(5000).optional(),
  ticketPrice: z.number().int().min(0).optional(),
  ticketDurationDays: z.number().int().min(1).max(365).optional(),
  premiumMonthlyPrice: z.number().int().min(0).optional(),
  creditPackages: z
    .array(
      z.object({
        id: z.string().min(1),
        label: z.string().min(1),
        credits: z.number().int().positive(),
        price: z.number().int().min(0),
        bestValue: z.boolean().optional(),
      })
    )
    .optional(),
  actionCosts: z
    .object({
      INTERVIEW_PROPOSAL: z.number().int().min(0),
      ACCEPT_APPLICATION: z.number().int().min(0),
      START_CHAT: z.number().int().min(0),
    })
    .partial()
    .optional(),
});

export const settlementStatusSchema = z.object({
  status: z.enum(["PAID", "COMPLETED", "CANCELED"]),
});

export const verificationSubmitSchema = z.object({
  legalName: z.string().min(1).max(100).optional(),
  documentPath: z.string().min(1),
});

export const verificationReviewSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  rejectionReason: z.string().max(500).optional(),
});

export const messageSchema = z.object({
  body: z.string().min(1).max(4000),
});

export const createJobSchema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().max(2000).optional(),
  city: z.string().max(80).optional(),
  hoursPerSession: z.number().positive().max(24).optional(),
});

export const applyJobSchema = z.object({
  jobId: z.string().min(1),
  message: z.string().max(1000).optional(),
});
