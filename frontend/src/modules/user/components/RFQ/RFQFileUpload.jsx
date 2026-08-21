import React, { useRef, useState } from 'react';
import { FiUploadCloud, FiFile, FiX, FiImage } from 'react-icons/fi';
import toast from 'react-hot-toast';

// Mirrors the extensions rfqRoutes.js accepts.
const ACCEPTED_EXTENSIONS = ['.pdf', '.xlsx', '.xlsm', '.xls', '.csv', '.jpg', '.jpeg', '.png', '.dwg', '.dxf'];
const ACCEPTED = ACCEPTED_EXTENSIONS.join(',');
const MAX_FILE_BYTES = 25 * 1024 * 1024;
const MAX_FILES = 5;

const humanSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * Drawing / BOQ upload for the RFQ form. Enforces the same limits the API does
 * (5 files, 25MB each, PDF / XLSX / JPG / PNG / DWG) so the customer is told
 * before a 25MB upload is wasted. Works with the mobile camera roll and file
 * picker — the input is a plain file input, tapped through the drop zone.
 */
const RFQFileUpload = ({ files = [], onChange, disabled = false }) => {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const accept = (incoming) => {
    const candidates = Array.from(incoming || []);
    if (candidates.length === 0) return;

    const room = MAX_FILES - files.length;
    if (room <= 0) {
      toast.error(`You can attach at most ${MAX_FILES} files.`);
      return;
    }

    const accepted = [];
    for (const file of candidates.slice(0, room)) {
      const ext = `.${file.name.split('.').pop().toLowerCase()}`;
      if (!ACCEPTED_EXTENSIONS.includes(ext)) {
        toast.error(`${file.name}: only PDF, XLSX, JPG, PNG and DWG files are accepted.`);
        continue;
      }
      if (file.size > MAX_FILE_BYTES) {
        toast.error(`${file.name} is ${humanSize(file.size)} — the limit is 25MB.`);
        continue;
      }
      accepted.push(file);
    }

    if (candidates.length > room) {
      toast.error(`Only ${room} more file(s) can be attached.`);
    }
    if (accepted.length) onChange([...files, ...accepted]);
  };

  const remove = (index) => onChange(files.filter((_, i) => i !== index));

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!disabled) accept(e.dataTransfer.files);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
          dragging ? 'border-warm-sand bg-soft-oatmeal' : 'border-soft-oatmeal bg-white hover:border-warm-sand/60'
        } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
      >
        <FiUploadCloud className="mb-2 h-8 w-8 text-warm-sand" />
        <p className="text-sm font-semibold text-deep-espresso">Upload drawing or BOQ</p>
        <p className="mt-1 text-xs text-dusty-cocoa">
          PDF, XLSX, JPG, PNG or DWG — up to {MAX_FILES} files, 25MB each
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED}
          disabled={disabled}
          className="hidden"
          onChange={(e) => {
            accept(e.target.files);
            // Reset so re-picking the same file still fires a change event.
            e.target.value = '';
          }}
        />
      </div>

      {files.length > 0 && (
        <ul className="mt-3 space-y-2">
          {files.map((file, index) => {
            const isImage = /\.(jpe?g|png)$/i.test(file.name);
            return (
              <li
                key={`${file.name}-${index}`}
                className="flex items-center gap-3 rounded-lg border border-soft-oatmeal bg-white px-3 py-2"
              >
                {isImage ? <FiImage className="h-4 w-4 shrink-0 text-warm-sand" /> : <FiFile className="h-4 w-4 shrink-0 text-warm-sand" />}
                <span className="min-w-0 flex-1 truncate text-sm text-deep-espresso">{file.name}</span>
                <span className="shrink-0 text-xs text-dusty-cocoa">{humanSize(file.size)}</span>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="shrink-0 rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  aria-label={`Remove ${file.name}`}
                >
                  <FiX className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default RFQFileUpload;
