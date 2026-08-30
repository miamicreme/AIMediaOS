// Hardening Passes #19-20: Role-Based Access Control & Permission Validation

export enum UserRole {
  FREE = "free",
  PRO_MONTHLY = "pro-monthly",
  PRO_ANNUAL = "pro-annual",
  ADMIN = "admin",
}

export enum FeaturePermission {
  CREATE_JOB = "create_job",
  VIEW_GALLERY = "view_gallery",
  PURCHASE_CREDITS = "purchase_credits",
  MANAGE_API_KEYS = "manage_api_keys",
  VIEW_ANALYTICS = "view_analytics",
  CANCEL_JOB = "cancel_job",
  REQUEST_REFUND = "request_refund",
}

interface RolePermissions {
  [key: string]: FeaturePermission[];
}

const rolePermissions: RolePermissions = {
  [UserRole.FREE]: [
    FeaturePermission.CREATE_JOB,
    FeaturePermission.VIEW_GALLERY,
    FeaturePermission.PURCHASE_CREDITS,
    FeaturePermission.CANCEL_JOB,
    FeaturePermission.REQUEST_REFUND,
  ],
  [UserRole.PRO_MONTHLY]: [
    FeaturePermission.CREATE_JOB,
    FeaturePermission.VIEW_GALLERY,
    FeaturePermission.PURCHASE_CREDITS,
    FeaturePermission.MANAGE_API_KEYS,
    FeaturePermission.VIEW_ANALYTICS,
    FeaturePermission.CANCEL_JOB,
    FeaturePermission.REQUEST_REFUND,
  ],
  [UserRole.PRO_ANNUAL]: [
    FeaturePermission.CREATE_JOB,
    FeaturePermission.VIEW_GALLERY,
    FeaturePermission.PURCHASE_CREDITS,
    FeaturePermission.MANAGE_API_KEYS,
    FeaturePermission.VIEW_ANALYTICS,
    FeaturePermission.CANCEL_JOB,
    FeaturePermission.REQUEST_REFUND,
  ],
  [UserRole.ADMIN]: [
    FeaturePermission.CREATE_JOB,
    FeaturePermission.VIEW_GALLERY,
    FeaturePermission.PURCHASE_CREDITS,
    FeaturePermission.MANAGE_API_KEYS,
    FeaturePermission.VIEW_ANALYTICS,
    FeaturePermission.CANCEL_JOB,
    FeaturePermission.REQUEST_REFUND,
  ],
};

// Hardening Pass #19: Role-Based Permission Checking
export function hasPermission(role: string, permission: FeaturePermission): boolean {
  const permissions = rolePermissions[role];
  if (!permissions) {
    return false;
  }
  return permissions.includes(permission);
}

export function getPermissions(role: string): FeaturePermission[] {
  return rolePermissions[role] || [];
}

export function validateRole(role: string): boolean {
  return Object.values(UserRole).includes(role as UserRole);
}

// Hardening Pass #20: Resource Ownership Validation
export interface ResourceOwnershipCheck {
  resourceId: string;
  ownerId: string;
  resourceType: string;
}

const resourceOwnershipCache = new Map<string, string>();
const CACHE_EXPIRY = 300000; // 5 minutes
const resourceCacheTime = new Map<string, number>();

export function setCacheResourceOwnership(resourceId: string, ownerId: string): void {
  const cacheKey = `ownership:${resourceId}`;
  resourceOwnershipCache.set(cacheKey, ownerId);
  resourceCacheTime.set(cacheKey, Date.now() + CACHE_EXPIRY);
}

export function getCachedResourceOwnership(resourceId: string): string | null {
  const cacheKey = `ownership:${resourceId}`;
  const owner = resourceOwnershipCache.get(cacheKey);
  const expiry = resourceCacheTime.get(cacheKey);

  if (!owner || !expiry || expiry < Date.now()) {
    resourceOwnershipCache.delete(cacheKey);
    resourceCacheTime.delete(cacheKey);
    return null;
  }

  return owner;
}

export function clearResourceOwnershipCache(resourceId: string): void {
  const cacheKey = `ownership:${resourceId}`;
  resourceOwnershipCache.delete(cacheKey);
  resourceCacheTime.delete(cacheKey);
}

export function verifyResourceOwnership(resourceId: string, userId: string, cachedOwnerId?: string): boolean {
  if (cachedOwnerId) {
    return cachedOwnerId === userId;
  }

  const cached = getCachedResourceOwnership(resourceId);
  return cached === userId;
}

// Cleanup expired cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, expiry] of resourceCacheTime.entries()) {
    if (expiry < now) {
      resourceOwnershipCache.delete(key);
      resourceCacheTime.delete(key);
    }
  }
}, 300000); // Every 5 minutes
