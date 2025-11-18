export function nameInitials(name?: string, max = 2): string {
  const n = (name || '').trim();
  if (!n) return '';
  const parts = n.split(/\s+/).filter(Boolean);
  const chars = parts.slice(0, max).map(p => p[0]).join('');
  return chars.toUpperCase();
}

const PALETTE = [
  '#EF4444','#F59E0B','#10B981','#3B82F6','#8B5CF6','#EC4899','#14B8A6','#84CC16','#F97316','#6366F1',
];
export function colorForName(name?: string): string {
  const s = (name || 'user').toLowerCase();
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}
