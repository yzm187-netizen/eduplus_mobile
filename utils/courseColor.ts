// Central helpers for course color normalization and image asset selection.
// We now store literal color names (red|green|purple|blue) in the database.
// These helpers defensively map any legacy hex values to the canonical names.

export type CourseColorName = 'red' | 'green' | 'purple' | 'blue';

export function normalizeCourseColor(input: string | null | undefined): CourseColorName {
  if (!input) return 'blue';
  const v = String(input).toLowerCase();
  if (v.includes('red') || v.includes('ef4444')) return 'red';
  if (v.includes('green') || v.includes('22c55e') || v.includes('10b981')) return 'green';
  if (v.includes('purple') || v.includes('a855f7') || v.includes('8b5cf6')) return 'purple';
  if (v.includes('blue') || v.includes('3b82f6') || v.includes('2563eb')) return 'blue';
  return 'blue';
}

export function courseColorBannerImage(color: string | null | undefined) {
  const name = normalizeCourseColor(color);
  switch (name) {
    case 'red':
      return require('@/assets/images/EduPlus_Banner_background_red.png');
    case 'green':
      return require('@/assets/images/EduPlus_Banner_background_green.png');
    case 'purple':
      return require('@/assets/images/EduPlus_Banner_background_purple.png');
    case 'blue':
    default:
      return require('@/assets/images/EduPlus_Banner_background.png');
  }
}

// Provide a lighter accent color (used for buttons, progress bars, highlights) derived from banner base color.
// Chosen for adequate contrast on white/dark backgrounds while visually related to banner.
export function courseAccentColor(color: string | null | undefined): string {
  const name = normalizeCourseColor(color);
  switch (name) {
    case 'red':
      return '#fb6a6a'; // light red accent
    case 'green':
      return '#34d399'; // emerald/light green
    case 'purple':
      return '#c084fc'; // light purple
    case 'blue':
    default:
      return '#00AFC8'; // existing teal accent
  }
}

