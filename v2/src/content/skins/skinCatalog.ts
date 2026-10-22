import type { SnakeSkin } from './SnakeSkin';

export const skinCatalog: readonly SnakeSkin[] = [
  { id: 'lime', name: 'Neon Lime', pattern: 'solid', colors: ['#7CFF4F'], stripeLength: 1, glow: '#B6FF8F' },
  { id: 'volt', name: 'Volt', pattern: 'solid', colors: ['#2FD8FF'], stripeLength: 1, glow: '#8FEAFF' },
  { id: 'bubblegum', name: 'Bubblegum', pattern: 'solid', colors: ['#FF5FC8'], stripeLength: 1, glow: '#FFA6E2' },
  {
    id: 'tiger',
    name: 'Tiger',
    pattern: 'stripes',
    colors: ['#FF9A1F', '#FF9A1F', '#1A1A1A'],
    stripeLength: 3,
    glow: '#FFC06B',
  },
  { id: 'zebra', name: 'Zebra', pattern: 'stripes', colors: ['#F5F5F5', '#202020'], stripeLength: 4, glow: '#FFFFFF' },
  {
    id: 'candy',
    name: 'Candy Cane',
    pattern: 'stripes',
    colors: ['#FF3B5C', '#FFF4F6'],
    stripeLength: 3,
    glow: '#FF8FA3',
  },
  {
    id: 'rainbow',
    name: 'Rainbow',
    pattern: 'stripes',
    colors: ['#FF3B3B', '#FF9A1F', '#FFE43B', '#4CFF6A', '#2FD8FF', '#5B6CFF', '#B24BFF'],
    stripeLength: 3,
    glow: '#FFFFFF',
  },
  {
    id: 'sunset',
    name: 'Sunset',
    pattern: 'gradient',
    colors: ['#FFE259', '#FF8A3D', '#FF3D6E', '#8E2DE2'],
    stripeLength: 1,
    glow: '#FF9F7A',
  },
  {
    id: 'ocean',
    name: 'Deep Ocean',
    pattern: 'gradient',
    colors: ['#7CF7FF', '#2F80FF', '#1B2BA8'],
    stripeLength: 1,
    glow: '#7CC8FF',
  },
  {
    id: 'galaxy',
    name: 'Galaxy',
    pattern: 'gradient',
    colors: ['#F7A8FF', '#9B5CFF', '#3A1C8F', '#0E0B3A'],
    stripeLength: 1,
    glow: '#C79BFF',
  },
  {
    id: 'toxic',
    name: 'Toxic',
    pattern: 'stripes',
    colors: ['#A6FF00', '#6A00FF'],
    stripeLength: 5,
    glow: '#C8FF5C',
  },
  {
    id: 'gold',
    name: 'Midas',
    pattern: 'gradient',
    colors: ['#FFF3B0', '#FFC93C', '#C7861A'],
    stripeLength: 1,
    glow: '#FFE08A',
  },
  {
    id: 'stars',
    name: 'Stars & Stripes',
    pattern: 'stripes',
    colors: ['#E8283C', '#F5F5F5', '#2A4BD7'],
    stripeLength: 3,
    glow: '#9FB2FF',
  },
  {
    id: 'mint',
    name: 'Mint Chip',
    pattern: 'stripes',
    colors: ['#9CFFD9', '#9CFFD9', '#9CFFD9', '#4A2C1D'],
    stripeLength: 2,
    glow: '#C9FFEC',
  },
  {
    id: 'ember',
    name: 'Ember',
    pattern: 'gradient',
    colors: ['#FFD000', '#FF4D00', '#7A0000'],
    stripeLength: 1,
    glow: '#FF7A3D',
  },
  { id: 'ghost', name: 'Ghost', pattern: 'solid', colors: ['#E6E9FF'], stripeLength: 1, glow: '#FFFFFF' },
];

export const defaultSkin: SnakeSkin = skinCatalog[0] as SnakeSkin;

export function findSkin(id: string | null | undefined): SnakeSkin {
  return skinCatalog.find((skin) => skin.id === id) ?? defaultSkin;
}
