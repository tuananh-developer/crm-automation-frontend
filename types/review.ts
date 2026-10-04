/**
 * UC07 - Human Review contracts.
 *
 * Shapes mirror the NestJS entities returned by ReviewController
 * (global prefix /api/v1). Nullable columns are typed as `| null`
 * because TypeORM serialises them that way.
 */

/** `ReviewStatus` enum - src/modules/review/enums/review.enum.ts */
export type ReviewStatus =
  | "PENDING"
  | "IN_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "RESOLVED";

/** `ReviewDecision` enum - src/modules/review/enums/review.enum.ts */
export type ReviewDecision = "APPROVE" | "REJECT" | "MODIFY";

/** `LeadStatus` enum - src/modules/leads/enums/lead.enum.ts */
export type LeadStatus =
  | "NEW"
  | "QUALIFYING"
  | "QUALIFIED"
  | "NURTURING"
  | "CONVERTED"
  | "LOST";

/** `UserRole` / `UserStatus` enums - src/modules/users/enums/user.enum.ts */
export type ReviewerRole = "ADMIN" | "SALES";
export type ReviewerStatus = "ACTIVE" | "INACTIVE" | "LOCKED";

/** `Assignee` relation. `passwordHash` is stripped by ReviewService. */
export type ReviewReviewer = {
  id: string;
  name: string;
  email: string;
  role: ReviewerRole;
  status: ReviewerStatus;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
};

/** `Lead` relation returned by `GET /review-tasks`. */
export type ReviewLead = {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string;
  phone: string | null;
  companyName: string | null;
  companyWebsite: string | null;
  jobTitle: string | null;
  companySize: number | null;
  industry: string | null;
  status: LeadStatus;
  sourceId: string;
  ownerId: string | null;
  convertedCustomerId?: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

/** `WorkflowRun` relation (nullable on ReviewTask). */
export type ReviewWorkflowRun = {
  id: string;
  workflowName: string;
  status: string;
  inputPayload: Record<string, unknown> | null;
  outputPayload: Record<string, unknown> | null;
  errorMessage: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
};

/** Notification entity as returned on `GET /review-tasks/:id`. */
export type ReviewNotification = {
  id: string;
  userId: string;
  type: string;
  title: string;
  content: string | null;
  leadId: string | null;
  customerId: string | null;
  reviewTaskId: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
};

/** ReviewTask entity - src/modules/review/entities/review-task.entity.ts */
export type ReviewTask = {
  id: string;
  leadId: string;
  workflowRunId: string | null;
  assignedTo: string | null;
  status: ReviewStatus;
  reason: string | null;
  decision: ReviewDecision | null;
  reviewComment: string | null;
  createdAt: string;
  startedAt: string | null;
  resolvedAt: string | null;
  lead?: ReviewLead | null;
  workflowRun?: ReviewWorkflowRun | null;
  assignee?: ReviewReviewer | null;
  /** Only populated by `GET /review-tasks/:id`. */
  notifications?: ReviewNotification[];
};

/** `LeadQualification` - src/modules/lead-intelligence/entities */
export type LeadQualificationStatus =
  | "QUALIFIED"
  | "DISQUALIFIED"
  | "NEEDS_REVIEW";

export type LeadQualification = {
  id: string;
  leadId: string;
  status: LeadQualificationStatus;
  intent: string | null;
  confidence: number | null;
  reason: string | null;
  modelProvider: string | null;
  modelName: string | null;
  modelVersion: string | null;
  inputSnapshot: Record<string, unknown> | null;
  outputSnapshot: Record<string, unknown> | null;
  createdAt: string;
  workflowRunId: string | null;
};

export type CreateReviewTaskPayload = {
  leadId: string;
  workflowRunId?: string;
  reason?: string;
};

export type AssignReviewTaskPayload = {
  reviewerId: string;
};

export type ResolveReviewTaskPayload = {
  decision: ReviewDecision;
  reviewComment?: string;
};
