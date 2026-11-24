// Keep in sync with backend/src/utils/bannerSpec.js
export const BANNER_RATIO = 16 / 5; // width : height (3.2 : 1)
export const BANNER_TOLERANCE = 0.06;
export const BANNER_MIN_WIDTH = 1280;
export const BANNER_RECOMMENDED = '1920 x 600 px';
export const BANNER_MAX_VIDEO_SECONDS = 20;

// Returns an error message, or '' when the artwork is the right shape and size
export const checkBannerSize = (width, height) => {
  if (!width || !height) return 'Could not read the file size.';
  const off = Math.abs(width / height - BANNER_RATIO) / BANNER_RATIO;
  if (off > BANNER_TOLERANCE) return `Wrong shape (${width} x ${height}). Banners must be ${BANNER_RECOMMENDED} (16:5) so nothing is cut off.`;
  if (width < BANNER_MIN_WIDTH) return `Too small (${width}px wide). Minimum width is ${BANNER_MIN_WIDTH}px; recommended ${BANNER_RECOMMENDED}.`;
  return '';
};
