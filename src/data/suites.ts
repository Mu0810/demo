import type { Suite } from '../types';

const img = (id: string, w = 1600) =>
  `https://images.unsplash.com/${id}?w=${w}&q=80&auto=format&fit=crop`;

export const SUITES: readonly Suite[] = [
  {
    id: 'atrium-loft',
    name: 'Atrium Loft',
    rate: 760,
    maxGuests: 2,
    size: 48,
    description:
      'A double-height loft above the central atrium, where morning light crosses the room twice before it settles.',
    amenities: ['Atrium view', 'Rain shower', 'Nespresso bar', 'Writing desk'],
    hero: img('photo-1566073771259-6a8506099945'),
    gallery: [
      img('photo-1571003123894-1f0594d2b5d9'),
      img('photo-1582719508461-905c673771fd'),
      img('photo-1618773928121-c32242e63f39'),
    ],
  },
  {
    id: 'aurelia',
    name: 'Aurelia Suite',
    rate: 850,
    maxGuests: 2,
    size: 55,
    description:
      'Warm brass, deep walnut, and a bathtub set against the window. Quiet on every side.',
    amenities: ['Freestanding bath', 'Turndown service', 'Silk robes', 'Record player'],
    hero: img('photo-1590490360182-c33d57733427'),
    gallery: [
      img('photo-1445019980597-93fa8acb246c'),
      img('photo-1551882547-ff40c63fe5fa'),
      img('photo-1631049307264-da0ec9d70304'),
    ],
  },
  {
    id: 'garden-pavilion',
    name: 'Garden Pavilion',
    rate: 980,
    maxGuests: 3,
    size: 68,
    description:
      'A ground-floor pavilion opening onto its own walled garden, planted for evening scent.',
    amenities: ['Private garden', 'Outdoor shower', 'Daybed', 'Breakfast terrace'],
    hero: img('photo-1611892440504-42a792e24d32'),
    gallery: [
      img('photo-1595576508898-0ad5c879a061'),
      img('photo-1560448204-e02f11c3d0e2'),
      img('photo-1522708323590-d24dbb6b0267'),
    ],
  },
  {
    id: 'meridian',
    name: 'The Meridian',
    rate: 1150,
    maxGuests: 2,
    size: 72,
    description:
      'The corner suite the hotel is named for, with windows on the long axis of the building.',
    amenities: ['Corner aspect', 'Library alcove', 'Butler service', 'Marble bath'],
    hero: img('photo-1616594039964-ae9021a400a0'),
    gallery: [
      img('photo-1600210492486-724fe5c67fb0'),
      img('photo-1600607687939-ce8a6c25118c'),
      img('photo-1600566753086-00f18fb6b3ea'),
    ],
  },
  {
    id: 'observatory',
    name: 'The Observatory',
    rate: 1850,
    maxGuests: 4,
    size: 96,
    description:
      'Top-floor rooms under a glazed roof, with a brass telescope kept trained on the harbour.',
    amenities: ['Glazed roof', 'Telescope', 'Dining for six', 'Private lift'],
    hero: img('photo-1584132967334-10e028bd69f7'),
    gallery: [
      img('photo-1540518614846-7eded433c457'),
      img('photo-1505693416388-ac5ce068fe85'),
      img('photo-1522771739844-6a9f6d5f14af'),
    ],
  },
  {
    id: 'celeste',
    name: 'Celeste Penthouse',
    rate: 2400,
    maxGuests: 4,
    size: 145,
    description:
      'The whole of the ninth floor, wrapped in terrace. Closed on Sundays for maintenance.',
    amenities: ['Wraparound terrace', 'Private chef', 'Steam room', 'Grand piano'],
    hero: img('photo-1578683010236-d716f9a3f461'),
    gallery: [
      img('photo-1512918728675-ed5a9ecdebfd'),
      img('photo-1613490493576-7fde63acd811'),
      img('photo-1590073242678-70ee3fc28e8e'),
    ],
  },
];

export function getSuite(id: string): Suite | undefined {
  return SUITES.find((s) => s.id === id);
}
