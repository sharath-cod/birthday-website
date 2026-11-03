// Certificate file storage on Cloudinary (free tier).
//
// Files are uploaded as type "authenticated", so they have NO public URL. The API
// downloads them with a signed, short-lived link and streams them to the logged-in
// user. That keeps the existing rule: only the owner student or an admin can open a file.
//
// If the three CLOUDINARY_* variables are not set, isConfigured() is false and the app
// falls back to the old behaviour (file stored inside MongoDB). Handy for local dev.

const FOLDER = 'student-career-tracker/certificates';

let sdk = null;

function isConfigured() {
  return Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
}

function client() {
  if (!sdk) {
    // Loaded lazily so the app still starts (and tests run) when Cloudinary is not used.
    sdk = require('cloudinary').v2;
    sdk.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
  }
  return sdk;
}

// Uploads a Buffer. Re-uploading for the same certificate overwrites the old file.
function upload(buffer, { certId }) {
  const cld = client();
  return new Promise((resolve, reject) => {
    const stream = cld.uploader.upload_stream(
      {
        folder: FOLDER,
        public_id: String(certId),
        resource_type: 'auto',
        type: 'authenticated',
        overwrite: true,
        invalidate: true,
      },
      (err, result) => {
        if (err) return reject(err);
        resolve({
          publicId: result.public_id,
          resourceType: result.resource_type,
          format: result.format || '',
          type: result.type || 'authenticated',
        });
      }
    );
    stream.end(buffer);
  });
}

// Fetches the original file bytes using a signed link that expires in 5 minutes.
async function download({ publicId, resourceType, format, type }) {
  const cld = client();
  const url = cld.utils.private_download_url(publicId, format || '', {
    resource_type: resourceType || 'image',
    type: type || 'authenticated',
    expires_at: Math.floor(Date.now() / 1000) + 300,
  });
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Cloudinary download failed with status ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

// Best-effort delete. A failure here must never block deleting the certificate record.
async function destroy({ publicId, resourceType, type }) {
  try {
    await client().uploader.destroy(publicId, {
      resource_type: resourceType || 'image',
      type: type || 'authenticated',
      invalidate: true,
    });
  } catch (err) {
    console.error('Cloudinary delete failed:', err.message);
  }
}

module.exports = { isConfigured, upload, download, destroy, FOLDER };
