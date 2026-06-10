import api from './api';

/**
 * Uploads a file to Cloudinary via the backend proxy
 * @param {File|Blob} file The file to upload
 * @returns {Promise<string>} The Cloudinary URL
 */
const base64ToBlob = (base64Data) => {
  const parts = base64Data.split(';base64,');
  const contentType = parts[0].split(':')[1];
  const raw = window.atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);
  
  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }
  
  return new Blob([uInt8Array], { type: contentType });
};

/**
 * Uploads a file to Cloudinary via the backend proxy
 * @param {File|Blob|string} file The file to upload (supports raw files or base64 data URLs)
 * @returns {Promise<string>} The Cloudinary URL
 */
export const uploadImage = async (file) => {
  if (!file) return null;
  
  // If it's already a URL, just return it
  if (typeof file === 'string' && file.startsWith('http')) {
    return file;
  }

  const formData = new FormData();
  
  // Handle base64 image strings from previews
  if (typeof file === 'string' && file.startsWith('data:image')) {
    const blob = base64ToBlob(file);
    const ext = blob.type.split('/')[1] || 'png';
    formData.append('image', blob, `upload_${Date.now()}.${ext}`);
  } else {
    formData.append('image', file);
  }
  
  const { data } = await api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  
  return data.url;
};

/**
 * Uploads a file to Cloudinary via the public backend registration document upload endpoint
 * @param {File|Blob|string} file The file to upload (supports raw files or base64 data URLs)
 * @returns {Promise<string>} The Cloudinary URL
 */
export const uploadRegistrationDocument = async (file) => {
  if (!file) return null;
  
  // If it's already a URL, just return it
  if (typeof file === 'string' && file.startsWith('http')) {
    return file;
  }

  const formData = new FormData();
  
  // Handle base64 image strings from previews
  if (typeof file === 'string' && file.startsWith('data:image')) {
    const blob = base64ToBlob(file);
    const ext = blob.type.split('/')[1] || 'png';
    formData.append('image', blob, `upload_${Date.now()}.${ext}`);
  } else {
    formData.append('image', file);
  }
  
  const { data } = await api.post('/upload/register-document', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  
  return data.url;
};
