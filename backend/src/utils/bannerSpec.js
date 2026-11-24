// Single source of truth for category banner artwork. Keep in sync with
// frontend/src/shared/utils/bannerSpec.js
module.exports = {
  RATIO: 16 / 5,          // width : height  (3.2 : 1)  e.g. 1920 x 600
  RATIO_TOLERANCE: 0.06,  // +/- 6 %
  MIN_WIDTH: 1280,
  RECOMMENDED: '1920 x 600 px',
  MAX_VIDEO_SECONDS: 20
};
