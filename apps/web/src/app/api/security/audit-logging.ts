// Hardening Passes #13-14: Audit Logging & Threat Detection

interface AuditLog {
  timestamp: string;
  userId?: string;
  action: string;
  resource: string;
  method: string;
  status: number;
  ipAddress?: string;
  userAgent?: string;
  error?: string;
  details?: Record<string, unknown>;
}

interface ThreatIndicator {
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  timestamp: string;
  userId?: string;
  ipAddress?: string;
}

const auditLogs: AuditLog[] = [];
const threatIndicators: ThreatIndicator[] = [];
const suspiciousUsers = new Map<string, number>();

const MAX_LOGS = 10000;
const MAX_THREATS = 5000;
const THREAT_THRESHOLD = 5;

// Hardening Pass #13: Comprehensive Audit Logging
export function logAuditEvent(log: Omit<AuditLog, "timestamp">): void {
  const auditEntry: AuditLog = {
    ...log,
    timestamp: new Date().toISOString(),
  };

  auditLogs.push(auditEntry);

  // Prevent memory overflow
  if (auditLogs.length > MAX_LOGS) {
    auditLogs.shift();
  }

  // Log to console in development
  if (process.env.NODE_ENV === "development") {
    console.log("[AUDIT]", auditEntry);
  }
}

// Hardening Pass #14: Threat Detection
export function detectThreat(indicator: Omit<ThreatIndicator, "timestamp">): void {
  const threat: ThreatIndicator = {
    ...indicator,
    timestamp: new Date().toISOString(),
  };

  threatIndicators.push(threat);

  if (threatIndicators.length > MAX_THREATS) {
    threatIndicators.shift();
  }

  // Track suspicious users
  if (indicator.userId) {
    const count = (suspiciousUsers.get(indicator.userId) || 0) + 1;
    suspiciousUsers.set(indicator.userId, count);

    // Alert if threshold exceeded
    if (count >= THREAT_THRESHOLD) {
      console.error(`[SECURITY ALERT] User ${indicator.userId} exceeded threat threshold (${count})`);
    }
  }

  console.warn("[THREAT DETECTED]", threat);
}

export function getAuditLogs(filters?: { userId?: string; action?: string; limit?: number }): AuditLog[] {
  let logs = auditLogs;

  if (filters?.userId) {
    logs = logs.filter(log => log.userId === filters.userId);
  }

  if (filters?.action) {
    logs = logs.filter(log => log.action === filters.action);
  }

  const limit = filters?.limit || 100;
  return logs.slice(-limit);
}

export function getThreatIndicators(limit: number = 50): ThreatIndicator[] {
  return threatIndicators.slice(-limit);
}

export function clearAuditLogs(): void {
  auditLogs.length = 0;
}

export function clearThreatIndicators(): void {
  threatIndicators.length = 0;
  suspiciousUsers.clear();
}

export function isSuspiciousUser(userId: string): boolean {
  return (suspiciousUsers.get(userId) || 0) >= THREAT_THRESHOLD;
}

export function getSuspiciousUserCount(userId: string): number {
  return suspiciousUsers.get(userId) || 0;
}
