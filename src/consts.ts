export const SITE_TITLE = 'Pavlo Romanenko';
export const SITE_DESCRIPTION = 'Frontend engineer in Munich. Writing about architecture, tools, and home-lab tinkering.';

export const SITE_URL = 'https://pavloromanenko.com';

export const SOCIAL = {
  github: 'https://github.com/romanenkostud',
  linkedin: 'https://www.linkedin.com/in/pavlo-romanenko-aa3b4522a',
  email: 'vlm.9v.romanenko.pavlo@gmail.com',
};

export const NAV_LINKS = [
  { href: '/writing', label: 'writing' },
  { href: '/topics', label: 'topics' },
  { href: '/about', label: 'about' },
];

export const AREAS = ['architecture', 'devex', 'ai', 'cases', 'homelab'] as const;
export type Area = typeof AREAS[number];
