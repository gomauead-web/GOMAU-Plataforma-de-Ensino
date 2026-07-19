/**
 * Helper to dynamically get the correct app logo based on the user's lodge / prefix.
 * For the lodge "Fraternidade Universa 7" (prefix "7"), we display "/logoeua.png".
 * Otherwise, we default to the traditional GOMAU logo "/logotrad.png".
 */
export function getAppLogo(user?: { cim?: string | number; loja?: string } | null): string {
  if (!user) return '/logotrad.png';
  
  const cimStr = user.cim?.toString().trim() || '';
  const lojaStr = user.loja?.toString().toLowerCase() || '';

  // Prefix "7" lodge matches if:
  // - CIM starts with "7" but not with "77" (since 77 is a different lodge)
  // - Or the lodge name explicitly mentions "universa 7", "fraternidade universa 7" or is simply "7"
  const matchesPrefix7 = 
    (cimStr.startsWith('7') && !cimStr.startsWith('77')) ||
    lojaStr.includes('universa 7') ||
    lojaStr.includes('loja 7') ||
    lojaStr === '7';

  if (matchesPrefix7) {
    return '/logoeua.png';
  }
  return '/logotrad.png';
}
