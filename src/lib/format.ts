const DATE_FORMAT_MONTH_YEAR = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  year: 'numeric',
});

const DATE_FORMAT_SHORT_MONTH_YEAR = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  year: 'numeric',
});

export function formatMonthYear(dateStr: string): string {
  return DATE_FORMAT_MONTH_YEAR.format(new Date(dateStr));
}

export function formatDateRange(startDate: string, endDate: string): string {
  if (!startDate) return '';

  const [sy, sm] = startDate.split('-').map(Number);
  const startLabel = DATE_FORMAT_SHORT_MONTH_YEAR.format(new Date(sy, sm - 1));

  const now = new Date();
  const ey = endDate ? Number(endDate.split('-')[0]) : now.getFullYear();
  const em = endDate ? Number(endDate.split('-')[1]) : now.getMonth() + 1;
  const endLabel = endDate
    ? DATE_FORMAT_SHORT_MONTH_YEAR.format(new Date(ey, em - 1))
    : 'Present';

  let totalMonths = (ey - sy) * 12 + (em - sm) + 1;
  if (totalMonths < 1) totalMonths = 1;
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;

  const parts: string[] = [];
  if (years > 0) parts.push(`${years} yr${years > 1 ? 's' : ''}`);
  if (months > 0) parts.push(`${months} mo${months > 1 ? 's' : ''}`);

  return `${startLabel} – ${endLabel} · ${parts.join(' ')}`;
}

const BYTES_KB = 1024;
const BYTES_MB = 1024 * 1024;

export function formatFileSize(bytes: number): string {
  if (bytes < BYTES_KB) return `${bytes} B`;
  if (bytes < BYTES_MB) return `${(bytes / BYTES_KB).toFixed(1)} KB`;
  return `${(bytes / BYTES_MB).toFixed(1)} MB`;
}

export function stripMarkdown(text: string): string {
  return text
    .replace(/^#{1,3}\s+.+$/gm, '')
    .replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1')
    .replace(/^[-*]\s+/gm, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\n{2,}/g, ' ')
    .replace(/\n/g, ' ')
    .trim();
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).replace(/\s\S*$/, '…');
}
