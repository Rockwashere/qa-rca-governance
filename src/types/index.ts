export type SiteType = 'UAE' | 'EG' | 'KSA';
export type RoleType = 'QA_MEMBER' | 'QA_LEAD' | 'MANAGER' | 'ADMIN';
export type MainRCAType = 'AGENT' | 'PROCESS' | 'TECHNOLOGY' | 'CUSTOMER';
export type CodeScopeType = 'GLOBAL' | 'SITE';
export type CodeStatusType = 'PENDING' | 'APPROVED' | 'REJECTED' | 'DEPRECATED' | 'MERGED';
export type DecisionTypeEnum = 'APPROVED' | 'APPROVED_WITH_EDITS' | 'REJECTED' | 'MERGED' | 'DEPRECATED';
export type ReactionTypeEnum = 'AGREE' | 'DISAGREE' | 'SUGGEST_EXISTING' | 'SUGGEST_RENAME' | 'SUGGEST_MERGE';

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  site: SiteType;
  role: RoleType;
  isActive: boolean;
}

export interface RcaCodeRecord {
  id: string;
  scope: CodeScopeType;
  site: SiteType | null;
  status: CodeStatusType;
  mainRca: MainRCAType;
  rca1: string | null;
  rca2: string | null;
  rca3: string | null;
  rca4: string | null;
  rca5: string | null;
  definition: string;
  useWhen: string | null;
  dontUseWhen: string | null;
  examples: string[];
  tags: string[];
  rejectReason: string | null;
  version: number;
  createdById: string;
  approvedById: string | null;
  rejectedById: string | null;
  mergedIntoId: string | null;
  deprecatedReplacedById: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: { id: string; fullName: string; email: string; site: SiteType };
  approvedBy?: { id: string; fullName: string } | null;
  rejectedBy?: { id: string; fullName: string } | null;
}

export interface CommentRecord {
  id: string;
  entityType: string;
  entityId: string;
  content: string;
  reaction: ReactionTypeEnum | null;
  userId: string;
  createdAt: string;
  user: { id: string; fullName: string; site: SiteType; role: RoleType };
}

export interface DecisionRecord {
  id: string;
  decisionType: DecisionTypeEnum;
  reason: string | null;
  proposalId: string;
  decidedById: string;
  editedFields: Record<string, unknown> | null;
  mergeTargetId: string | null;
  createdAt: string;
  decidedBy: { id: string; fullName: string };
}

export interface AuditLogRecord {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  actorId: string;
  createdAt: string;
  actor: { id: string; fullName: string; email: string };
}

export interface UserRecord {
  id: string;
  fullName: string;
  email: string;
  site: SiteType;
  role: RoleType;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const MAIN_RCA_OPTIONS: { value: MainRCAType; label: string; color: string }[] = [
  { value: 'AGENT', label: 'Agent', color: 'bg-orange-100 text-orange-800' },
  { value: 'PROCESS', label: 'Process', color: 'bg-blue-100 text-blue-800' },
  { value: 'TECHNOLOGY', label: 'Technology', color: 'bg-purple-100 text-purple-800' },
  { value: 'CUSTOMER', label: 'Customer', color: 'bg-green-100 text-green-800' },
];

export const SITE_OPTIONS: { value: SiteType; label: string }[] = [
  { value: 'UAE', label: 'UAE' },
  { value: 'EG', label: 'Egypt' },
  { value: 'KSA', label: 'KSA' },
];

export const ROLE_OPTIONS: { value: RoleType; label: string }[] = [
  { value: 'QA_MEMBER', label: 'QA Member' },
  { value: 'QA_LEAD', label: 'QA Lead' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'ADMIN', label: 'Admin' },
];

export const STATUS_OPTIONS: { value: CodeStatusType; label: string; color: string }[] = [
  { value: 'PENDING', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'APPROVED', label: 'Approved', color: 'bg-green-100 text-green-800' },
  { value: 'REJECTED', label: 'Rejected', color: 'bg-red-100 text-red-800' },
  { value: 'DEPRECATED', label: 'Deprecated', color: 'bg-gray-100 text-gray-800' },
  { value: 'MERGED', label: 'Merged', color: 'bg-indigo-100 text-indigo-800' },
];

export const REACTION_OPTIONS: { value: ReactionTypeEnum; label: string; emoji: string }[] = [
  { value: 'AGREE', label: 'Agree', emoji: '👍' },
  { value: 'DISAGREE', label: 'Disagree', emoji: '👎' },
  { value: 'SUGGEST_EXISTING', label: 'Suggest Existing Code', emoji: '🔗' },
  { value: 'SUGGEST_RENAME', label: 'Suggest Rename', emoji: '✏️' },
  { value: 'SUGGEST_MERGE', label: 'Suggest Merge', emoji: '🔀' },
];
