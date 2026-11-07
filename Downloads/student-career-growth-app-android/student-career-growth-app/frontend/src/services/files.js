import api, { parseError } from './api.js';
import toast from 'react-hot-toast';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { isNative } from '../utils/native.js';

function nameFrom(res, fallback) {
  const cd = res.headers['content-disposition'] || '';
  const m = /filename="?([^";]+)"?/i.exec(cd);
  return m ? decodeURIComponent(m[1]) : fallback;
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

// Android app: a WebView cannot save blob links, so the file is written to app storage and handed to the
// system share sheet (Save to Drive / Files, open in a PDF or Excel app, WhatsApp, and so on).
async function shareBlob(blob, fileName) {
  const safeName = fileName.replace(/[^\w.\- ]+/g, '_');
  const written = await Filesystem.writeFile({
    path: safeName,
    data: await blobToBase64(blob),
    directory: Directory.Cache,
  });
  await Share.share({ title: safeName, url: written.uri, dialogTitle: 'Save or open file' });
}

// Authenticated download (the token is sent in the header, so plain <a href> links would not work).
export async function downloadFile(url, fallbackName) {
  const t = toast.loading('Preparing file…');
  try {
    const res = await api.get(url, { responseType: 'blob', timeout: 120000 });
    const name = nameFrom(res, fallbackName);
    if (isNative) {
      await shareBlob(res.data, name);
      toast.dismiss(t);
      return;
    }
    const href = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = href;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(href), 10000);
    toast.success('Downloaded', { id: t });
  } catch (err) {
    if (isNative && /cancel/i.test(String(err && err.message))) return toast.dismiss(t);
    toast.error(await blobError(err), { id: t });
  }
}

// Opens a PDF or image in a new tab (in the Android app: the share sheet, which includes "open with").
export async function openFile(url) {
  const t = toast.loading('Opening…');
  if (isNative) {
    try {
      const res = await api.get(url, { responseType: 'blob', timeout: 120000 });
      const ext = res.data.type === 'application/pdf' ? '.pdf' : res.data.type.startsWith('image/') ? `.${res.data.type.split('/')[1]}` : '';
      await shareBlob(res.data, nameFrom(res, `file${ext}`));
      toast.dismiss(t);
    } catch (err) {
      if (/cancel/i.test(String(err && err.message))) return toast.dismiss(t);
      toast.error(await blobError(err), { id: t });
    }
    return;
  }

  const w = window.open('', '_blank');
  try {
    const res = await api.get(url, { responseType: 'blob', timeout: 120000 });
    const href = URL.createObjectURL(res.data);
    if (w) w.location.href = href;
    else window.location.href = href;
    toast.dismiss(t);
  } catch (err) {
    if (w) w.close();
    toast.error(await blobError(err), { id: t });
  }
}

async function blobError(err) {
  try {
    if (err.response?.data instanceof Blob) {
      const j = JSON.parse(await err.response.data.text());
      return j.message || 'Something went wrong.';
    }
  } catch (e) { /* fall through */ }
  return parseError(err).message;
}
