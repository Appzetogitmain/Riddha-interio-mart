import React, { useRef, useState } from 'react';
import { LuUpload, LuImage, LuVideo, LuX, LuTriangleAlert } from 'react-icons/lu';
import api from '../utils/api';
import { BANNER_RECOMMENDED, BANNER_MAX_VIDEO_SECONDS, checkBannerSize } from '../utils/bannerSpec';

// Read the pixel size of an image / video file in the browser, before uploading anything
const readSize = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const done = (v) => { URL.revokeObjectURL(url); resolve(v); };
    const fail = () => { URL.revokeObjectURL(url); reject(new Error('Could not read this file.')); };
    if (file.type.startsWith('video/')) {
      const v = document.createElement('video');
      v.preload = 'metadata';
      v.onloadedmetadata = () => done({ width: v.videoWidth, height: v.videoHeight, duration: v.duration });
      v.onerror = fail;
      v.src = url;
    } else {
      const img = new Image();
      img.onload = () => done({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = fail;
      img.src = url;
    }
  });

/**
 * Banner artwork picker. `value` = { url, type, width, height } or null.
 * The preview frame uses the exact 16:5 shape of the live banner, so what you see is what shoppers get.
 */
const BannerMediaUpload = ({ value, onChange, allowVideo = false }) => {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const pick = async (file) => {
    if (!file) return;
    setError('');
    const isVideo = file.type.startsWith('video/');
    if (isVideo && !allowVideo) return setError('This plan supports images only.');
    if (!isVideo && !/^image\/(jpeg|png|webp)$/.test(file.type)) return setError('Use a JPG, PNG or WEBP image' + (allowVideo ? ', or an MP4/MOV video.' : '.'));
    try {
      const size = await readSize(file);
      const problem = checkBannerSize(size.width, size.height) ||
        (isVideo && size.duration > BANNER_MAX_VIDEO_SECONDS ? `Video is too long (${Math.round(size.duration)}s). Maximum is ${BANNER_MAX_VIDEO_SECONDS} seconds.` : '');
      if (problem) return setError(problem);

      setBusy(true);
      const form = new FormData();
      form.append('media', file);
      const { data } = await api.post('/upload/banner-media', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      onChange(data.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Upload failed.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <div className="relative w-full aspect-[16/5] rounded-xl overflow-hidden border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center">
        {value ? (
          <>
            {value.type === 'video'
              ? <video src={value.url} className="w-full h-full object-contain bg-black" muted loop autoPlay playsInline />
              : <img src={value.url} alt="Banner preview" className="w-full h-full object-contain" />}
            <button type="button" onClick={() => onChange(null)} className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80"><LuX size={14} /></button>
          </>
        ) : (
          <button type="button" onClick={() => inputRef.current?.click()} disabled={busy} className="flex flex-col items-center gap-1 text-gray-500 hover:text-teal-600 disabled:opacity-60">
            {busy ? <span className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" /> : (allowVideo ? <LuVideo size={22} /> : <LuImage size={22} />)}
            <span className="text-xs font-semibold">{busy ? 'Uploading…' : `Upload banner ${allowVideo ? 'image or video' : 'image'}`}</span>
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" className="hidden" accept={allowVideo ? 'image/jpeg,image/png,image/webp,video/mp4,video/quicktime' : 'image/jpeg,image/png,image/webp'} onChange={(e) => pick(e.target.files?.[0])} />
      <p className="text-[11px] text-gray-500">
        Required shape <b>16:5</b> (wide strip), recommended <b>{BANNER_RECOMMENDED}</b>. The frame above is exactly how it will appear, so keep logos and text away from the edges.
        {allowVideo && <> Videos: MP4/MOV, up to {BANNER_MAX_VIDEO_SECONDS}s, play muted on a loop.</>}
      </p>
      {value && (
        <button type="button" onClick={() => inputRef.current?.click()} disabled={busy} className="text-xs font-semibold text-teal-700 flex items-center gap-1"><LuUpload size={12} /> Replace file</button>
      )}
      {error && <p className="text-xs text-red-600 flex items-start gap-1"><LuTriangleAlert className="shrink-0 mt-0.5" size={13} />{error}</p>}
    </div>
  );
};

export default BannerMediaUpload;
