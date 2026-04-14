/**
 * Official Role to Display Name Mapping for St. Martin De Porres Portal.
 * Ensures consistent administrative and community identity across the application.
 */
export const ROLE_TO_DISPLAY_NAME: Record<string, string> = {
  'admin': 'St. Martin De Porres Admin',
  'chairman': 'St. Martin De Porres Chairman',
  'tech_dev': 'St. Martin De Porres Tech/Dev',
  'treasurer': 'St. Martin De Porres Treasurer',
  'secretary': 'St. Martin De Porres Secretary',
  'member': 'St. Martin De Porres Member',
};

/**
 * Resolves a display-friendly title from a internal role key.
 * @param role The internal role string (e.g., 'admin', 'tech_dev')
 * @returns A formatted title string
 */
export function getDisplayNameFromRole(role?: string): string {
  if (!role) return 'St. Martin De Porres Community';
  
  // Normalize key for lookup
  const normalized = role.toLowerCase().trim();
  
  return ROLE_TO_DISPLAY_NAME[normalized] || 'St. Martin De Porres Community';
}
