/**
 * Global validation helper for Invento Pro
 * ISSUE 2 — “All fields required” bug
 */
export const isEmpty = (v: any): boolean => 
  v === undefined || 
  v === null || 
  v === "";

export const isValid = (fields: Record<string, any>): boolean => {
  return !Object.values(fields).some(isEmpty);
};
