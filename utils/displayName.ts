export function displayNameFromEmail(email?: string): string {
  if (!email) return 'Student';
  const local = email.split('@')[0] || '';
  if (!local) return 'Student';
  // Split on dot, underscore, dash and collapse empties
  const parts = local.split(/[-._]+/).filter(Boolean);
  if (!parts.length) return 'Student';
  return parts
    .map(p => p.length ? p[0].toUpperCase() + p.slice(1).toLowerCase() : p)
    .join(' ');
}