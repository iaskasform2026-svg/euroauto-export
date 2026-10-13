import { isStaff } from "./auth";

export function canAccessAdmin(role: string) {
  return isStaff(role);
}

export function canManageSettings(role: string) {
  return role === "ADMIN";
}

export function canSeeVendorPii(role: string) {
  return isStaff(role);
}

export function assertClientOwns(userId: string, ownerId: string, role: string) {
  if (isStaff(role)) return;
  if (userId !== ownerId) {
    const err = new Error("FORBIDDEN");
    throw err;
  }
}

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrateur",
  COMMERCIAL: "Commercial",
  GESTIONNAIRE: "Gestionnaire",
  CLIENT: "Client",
};
