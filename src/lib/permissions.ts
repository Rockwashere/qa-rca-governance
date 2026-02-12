import { RoleType, SiteType, CodeScopeType } from '@/types';

export function canViewCode(
  userRole: RoleType,
  userSite: SiteType,
  codeScope: CodeScopeType,
  codeSite: SiteType | null
): boolean {
  // Managers and Admins can see all codes
  if (userRole === 'MANAGER' || userRole === 'ADMIN') {
    return true;
  }
  
  // Global codes are visible to everyone
  if (codeScope === 'GLOBAL') {
    return true;
  }
  
  // Site-scoped codes are only visible to users from that site
  return codeSite === userSite;
}

export function canCreateProposal(role: RoleType): boolean {
  return ['QA_MEMBER', 'QA_LEAD', 'MANAGER', 'ADMIN'].includes(role);
}

export function canEditPendingProposal(role: RoleType, isCreator: boolean): boolean {
  // QA_LEAD can edit any pending proposal
  // Creator can edit their own pending proposal
  // Manager/Admin can edit any pending proposal
  if (role === 'QA_LEAD' || role === 'MANAGER' || role === 'ADMIN') {
    return true;
  }
  return isCreator;
}

export function canApproveReject(role: RoleType): boolean {
  return role === 'MANAGER' || role === 'ADMIN';
}

export function canMergeCode(role: RoleType): boolean {
  return role === 'MANAGER' || role === 'ADMIN';
}

export function canDeprecateCode(role: RoleType): boolean {
  return role === 'MANAGER' || role === 'ADMIN';
}

export function canEditApprovedCode(role: RoleType): boolean {
  return role === 'MANAGER' || role === 'ADMIN';
}

export function canManageUsers(role: RoleType): boolean {
  return role === 'ADMIN';
}

export function canViewAuditLogs(role: RoleType): boolean {
  return role === 'MANAGER' || role === 'ADMIN';
}

export function canViewAllSites(role: RoleType): boolean {
  return role === 'MANAGER' || role === 'ADMIN';
}

export function canComment(role: RoleType): boolean {
  return ['QA_MEMBER', 'QA_LEAD', 'MANAGER', 'ADMIN'].includes(role);
}

export function canSuggestMerge(role: RoleType): boolean {
  return ['QA_LEAD', 'MANAGER', 'ADMIN'].includes(role);
}

export function canEditProposal(role: RoleType, isCreator: boolean, status: string): boolean {
  if (role === 'ADMIN') return true;
  if (role === 'MANAGER') return status === 'PENDING' || status === 'APPROVED';
  return isCreator && status === 'PENDING';
}

export function canDeleteProposal(role: RoleType, isCreator: boolean, status: string): boolean {
  return canEditProposal(role, isCreator, status);
}

export function getRoleLevel(role: RoleType): number {
  const levels: Record<RoleType, number> = {
    QA_MEMBER: 1,
    QA_LEAD: 2,
    MANAGER: 3,
    ADMIN: 4,
  };
  return levels[role];
}

export function canManageRole(actorRole: RoleType, targetRole: RoleType): boolean {
  // Can only manage roles lower than your own
  // Admin can manage all roles
  if (actorRole === 'ADMIN') return true;
  return getRoleLevel(actorRole) > getRoleLevel(targetRole);
}
