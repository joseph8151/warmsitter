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

export const interviewRespondSchema = z.object({
  action: z.enum(["ACCEPT", "DECLINE"]),
  scheduledFor: z.string().datetime().optional(),
});

export const workLogSchema = z.object({
  jobId: z.string().min(1),
  hours: z.number().positive().max(24),
  note: z.string().max(2000).optional(),
  imageUrl: z.string().url().optional(),
});

export const payCareSchema = z.object({
  jobId: z.string().min(1),
  // NOTE: rate & hours are resolved server-side from the job's agreed terms and
  // approved work logs — never from client input — so the paying parent can't
  // unilaterally set (and shortchange) the sitter's payout.
});

export const reviewSchema = z.object({
  jobId: z.string().min(1),
  targetId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
  photoUrl: z.string().url().max(2000).optional(),
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

export const reportSchema = z.object({
  reportedId: z.string().min(1),
  reason: z.enum(["INAPPROPRIATE", "HARASSMENT", "SPAM", "SAFETY", "OTHER"]),
  detail: z.string().max(2000).optional(),
});

export const blockSchema = z.object({
  userId: z.string().min(1),
});

export const preferencesSchema = z
  .object({
    emailNotifications: z.boolean().optional(),
    pushNotifications: z.boolean().optional(),
  })
  .refine((v) => v.emailNotifications !== undefined || v.pushNotifications !== undefined, {
    message: "No preference provided",
  });

export const createBookingSchema = z.object({
  counterpartyId: z.string().min(1),
  jobId: z.string().optional(),
  scheduledDate: z.string().datetime(),
  hours: z.number().positive().max(24),
  hourlyRate: z.number().int().positive().max(1_000_000),
  note: z.string().max(1000).optional(),
});

export const bookingRespondSchema = z.object({
  action: z.enum(["CONFIRM", "DECLINE"]),
});

export const sitterProfileSchema = z.object({
  bio: z.string().max(1000).optional(),
  hourlyRate: z.number().int().min(1000).max(1_000_000),
  yearsOfExp: z.number().int().min(0).max(60),
  city: z.string().max(80).optional(),
});

export const availabilitySchema = z.object({
  slots: z
    .array(
      z.object({
        dayOfWeek: z.number().int().min(0).max(6),
        slot: z.enum(["MORNING", "AFTERNOON", "EVENING", "NIGHT"]),
      })
    )
    .max(28),
});

export const reportStatusSchema = z.object({
  status: z.enum(["REVIEWING", "RESOLVED", "DISMISSED"]),
});

export const createJobSchema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().max(2000).optional(),
  city: z.string().max(80).optional(),
  hoursPerSession: z.number().positive().max(24).optional(),
  urgent: z.boolean().optional(),
});

export const applyJobSchema = z.object({
  jobId: z.string().min(1),
  message: z.string().max(1000).optional(),
});
