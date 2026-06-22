export const SITE_TITLE = 'Pavlo Romanenko';
export const SITE_DESCRIPTION = 'Frontend engineer in Munich. Writing about architecture, tools, and home-lab tinkering.';

export const SITE_URL = 'https://pavloromanenko.com';

export const SOCIAL = {
  github: 'https://github.com/pavloromanenko',
  linkedin: 'https://linkedin.com/in/pavloromanenko',
  email: 'vlm.9v.romanenko.pavlo@gmail.com',
};

export const NAV_LINKS = [
  { href: '/writing', label: 'writing' },
  { href: '/garden', label: 'garden' },
  { href: '/about', label: 'about' },
];

export const AREAS = ['architecture', 'devex', 'ai', 'cases', 'homelab'] as const;
export type Area = typeof AREAS[number];
