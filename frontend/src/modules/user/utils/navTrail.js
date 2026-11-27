import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const KEY = 'userNavTrail';
const MAX = 12;

const STATIC_LABELS = {
  '/': 'Home',
  '/products': 'Products',
  '/categories': 'Categories',
  '/cart': 'Cart',
  '/wishlist': 'Wishlist',
  '/orders': 'My Orders',
  '/profile': 'Profile',
  '/shop': 'Shop',
  '/stores': 'Stores',
  '/samples': 'Samples',
  '/notifications': 'Notifications',
};

const titleCase = (s) => s.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export const labelForPath = (pathname, search = '') => {
  if (pathname === '/products' && new URLSearchParams(search).get('search')) return 'Search Results';
  if (STATIC_LABELS[pathname]) return STATIC_LABELS[pathname];
  const segs = pathname.split('/').filter(Boolean);
  if (segs.length === 0) return 'Home';
  // detail-style routes such as /products/:id get a placeholder until the page sets its real name
  return titleCase(segs[0]);
};

const read = () => {
  try { return JSON.parse(sessionStorage.getItem(KEY)) || []; } catch { return []; }
};
const write = (v) => {
  try { sessionStorage.setItem(KEY, JSON.stringify(v.slice(-MAX))); } catch { /* ignore */ }
};

export const getTrail = () => read();

// Lets a detail page replace the placeholder label (e.g. with the product name).
export const setTrailLabel = (path, label) => {
  if (!label) return;
  const trail = read();
  const last = trail[trail.length - 1];
  if (last?.path === path) last.label = label;
  else trail.push({ path, label }); // child effects run before the tracker, so register the page here
  write(trail);
};

// Records every page visited in this tab; mounted once inside the user routes.
export const useNavTrailTracker = () => {
  const { pathname, search } = useLocation();
  useEffect(() => {
    const path = pathname + search;
    const trail = read();
    if (trail[trail.length - 1]?.path === path) return;
    trail.push({ path, label: labelForPath(pathname, search) });
    write(trail);
  }, [pathname, search]);
};

// The last `count` distinct pages visited before `currentPath`.
export const getPreviousPages = (currentPath, count = 2) => {
  const trail = read();
  const out = [];
  for (let i = trail.length - 1; i >= 0 && out.length < count; i--) {
    const e = trail[i];
    if (e.path === currentPath || e.path.split('?')[0] === currentPath.split('?')[0]) continue;
    if (out.some((o) => o.path === e.path)) continue;
    out.unshift(e);
  }
  return out;
};
