import type { ProfileData } from '@/types/content';
import { getPage } from '@/server/repositories/pages';
import { PAGE_SLUG } from '@/config';

export async function getProfile(d1: D1Database): Promise<ProfileData | null> {
  const page = await getPage(d1, PAGE_SLUG.ABOUT);
  if (!page) return null;
  try {
    const raw = JSON.parse(page.body);
    return { socials: [], ...raw } as ProfileData;
  } catch {
    return null;
  }
}

export function profileToReadme(profile: ProfileData): string {
  const lines: string[] = [];

  if (profile.heroName) {
    lines.push(`# ${profile.heroName}`);
  }

  if (profile.heroTagline) {
    lines.push('', `**${profile.heroTagline}**`);
  }

  if (profile.bio) {
    lines.push('', profile.bio);
  }

  if (profile.whatIDo.length > 0) {
    lines.push('', '## What I Do', '');
    for (const item of profile.whatIDo) {
      lines.push(`- ${item}`);
    }
  }

  if (profile.experience.length > 0) {
    lines.push('', '## Experience', '');
    for (const exp of profile.experience) {
      const period = formatRange(exp.startDate, exp.endDate);
      const loc = exp.location ? ` · ${exp.location}` : '';
      lines.push(`- **${exp.title}** — ${period}${loc}`);
    }
  }

  if (profile.education.length > 0) {
    lines.push('', '## Education', '');
    for (const edu of profile.education) {
      const period = formatRange(edu.startDate, edu.endDate);
      const loc = edu.location ? ` · ${edu.location}` : '';
      lines.push(`- **${edu.title}** — ${period}${loc}`);
    }
  }

  if (profile.tech.length > 0) {
    lines.push('', '## Tech', '');
    lines.push(profile.tech.map(t => `\`${t}\``).join(' · '));
  }

  const socials = profile.socials.filter(s => s.label.toLowerCase() !== 'email');
  const email = profile.socials.find(s => s.label.toLowerCase() === 'email');

  if (socials.length > 0 || email) {
    lines.push('', '## Connect', '');
    if (email) {
      lines.push(`- [${email.url}](mailto:${email.url})`);
    }
    for (const s of socials) {
      lines.push(`- [${s.label}](${s.url})`);
    }
  }

  if (profile.cta) {
    lines.push('', '---', '', `*${profile.cta}*`);
  }

  lines.push('');
  return lines.join('\n');
}

function formatRange(start: string, end: string): string {
  if (!start) return '';
  const s = formatMonth(start);
  const e = end ? formatMonth(end) : 'Present';
  return `${s} – ${e}`;
}

function formatMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[m - 1]} ${y}`;
}
