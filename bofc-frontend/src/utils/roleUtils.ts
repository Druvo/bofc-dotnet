/**
 * Role-based access control utilities
 * Centralizes role checking logic for consistent permissions across the application
 */

export interface UserRoles {
  roles: string[];
}

/**
 * Check if user has any of the specified roles
 */
export const hasAnyRole = (userRoles: string[], allowedRoles: string[]): boolean => {
  return allowedRoles.some(role => userRoles.includes(role));
};

/**
 * Check if user has all of the specified roles
 */
export const hasAllRoles = (userRoles: string[], requiredRoles: string[]): boolean => {
  return requiredRoles.every(role => userRoles.includes(role));
};

// Specific role checks
export const isAdmin = (userRoles: string[]): boolean => {
  return userRoles.includes("ADMIN") || userRoles.includes("SUPERADMIN");
};

export const isSuperAdmin = (userRoles: string[]): boolean => {
  return userRoles.includes("SUPERADMIN");
};

export const isCoordinator = (userRoles: string[]): boolean => {
  return userRoles.includes("COORDINATOR");
};

export const isPlayer = (userRoles: string[]): boolean => {
  return userRoles.includes("PLAYER");
};

// Permission-based checks (combining multiple roles)
export const canConductMatches = (userRoles: string[]): boolean => {
  return hasAnyRole(userRoles, ["ADMIN", "SUPERADMIN", "COORDINATOR"]);
};

export const canManageTeams = (userRoles: string[]): boolean => {
  return hasAnyRole(userRoles, ["ADMIN", "SUPERADMIN", "COORDINATOR"]);
};

export const canManageTournaments = (userRoles: string[]): boolean => {
  return hasAnyRole(userRoles, ["ADMIN", "SUPERADMIN", "COORDINATOR"]);
};

export const canManageFixtures = (userRoles: string[]): boolean => {
  return hasAnyRole(userRoles, ["ADMIN", "SUPERADMIN", "COORDINATOR"]);
};

export const canManageRoles = (userRoles: string[]): boolean => {
  return isSuperAdmin(userRoles);
};

export const canManageAccounting = (userRoles: string[]): boolean => {
  return isAdmin(userRoles);
};

export const canViewAccounting = (userRoles: string[]): boolean => {
  // All authenticated users can view accounting
  return true;
};

export const canManageClubRules = (userRoles: string[]): boolean => {
  return isAdmin(userRoles);
};

export const canManageVenues = (userRoles: string[]): boolean => {
  return isAdmin(userRoles);
};

export const canManagePlayers = (userRoles: string[]): boolean => {
  return isAdmin(userRoles);
};

export const canResetPasswords = (userRoles: string[]): boolean => {
  return isAdmin(userRoles);
};
