import { db } from "./db";
import { AuditAction, AuditEntity } from "@/types";

export async function createAuditLog(params: {
  userId: string;
  action: AuditAction;
  entity: AuditEntity;
  entityId?: string;
}) {
  try {
    await db.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
      },
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
  }
}
