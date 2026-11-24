import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../shared/utils/api';

const ROTATE_MS = 6000;

// Live banner ads for a category page. The frame is a fixed 16:5 strip, the same shape sellers must
// upload, and media is shown with object-contain so nothing is ever cropped.
const SponsoredBanner = ({ categoryId }) => {
  const [ads, setAds] = useState([]);
  const [index, setIndex] = useState(0);
  const seen = useRef(new Set());

  useEffect(() => {
    let alive = true;
    setAds([]); setIndex(0); seen.current = new Set();
    if (!categoryId) return undefined;
    api.get('/category-banners/public', { params: { category: categoryId } })
      .then(r => { if (alive) setAds(r.data.data || []); })
      .catch(() => {});
    return () => { alive = false; };
  }, [categoryId]);

  useEffect(() => {
    if (ads.length < 2) return undefined;
    const t = setInterval(() => setIndex(i => (i + 1) % ads.length), ROTATE_MS);
    return () => clearInterval(t);
  }, [ads.length]);

  const current = ads[index];

  // Count one view per banner per page visit
  useEffect(() => {
    if (current && !seen.current.has(current._id)) {
      seen.current.add(current._id);
      api.post(`/category-banners/${current._id}/track`, { event: 'impression' }).catch(() => {});
    }
  }, [current]);

  if (!current) return null;

  const onClick = () => api.post(`/category-banners/${current._id}/track`, { event: 'click' }).catch(() => {});
  const media = current.media.type === 'video' ? (
    <video key={current._id} src={current.media.url} className="absolute inset-0 w-full h-full object-contain" autoPlay muted loop playsInline />
  ) : (
    <img key={current._id} src={current.media.url} alt={current.altText || 'Sponsored banner'} className="absolute inset-0 w-full h-full object-contain" />
  );
  const external = /^https?:\/\//i.test(current.linkUrl || '');
  const frameCls = 'relative block w-full aspect-[16/5] overflow-hidden bg-neutral-900';
  const inner = (
    <>
      {/* soft blurred copy fills any spare space if the file is a hair off ratio */}
      {current.media.type === 'image' && <img src={current.media.url} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-60" />}
      {media}
      <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/55 text-white text-[10px] font-bold tracking-wider uppercase">Sponsored</span>
    </>
  );

  return (
    <div className="relative w-full">
      {current.linkUrl
        ? (external
            ? <a href={current.linkUrl} target="_blank" rel="noopener noreferrer sponsored" onClick={onClick} className={frameCls}>{inner}</a>
            : <Link to={current.linkUrl} onClick={onClick} className={frameCls}>{inner}</Link>)
        : <div className={frameCls}>{inner}</div>}
      {ads.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
          {ads.map((a, i) => (
            <button key={a._id} aria-label={`Banner ${i + 1}`} onClick={() => setIndex(i)} className={`h-1.5 rounded-full transition-all ${i === index ? 'w-5 bg-white' : 'w-1.5 bg-white/50'}`} />
          ))}
        </div>
      )}
    </div>
  );
};

export default SponsoredBanner;
