// One-time helper: moves certificate files that are stored inside MongoDB to Cloudinary,
// then removes them from MongoDB to free Atlas space.
//   cd backend && npm run migrate:files
// Needs MONGO_URI and the three CLOUDINARY_* variables in backend/.env. Safe to re-run.
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Certificate = require('../models/Certificate');
const CertificateFile = require('../models/CertificateFile');
const fileStorage = require('../services/fileStorage');

(async () => {
  if (!fileStorage.isConfigured()) {
    console.error('Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in backend/.env first.');
    process.exit(1);
  }
  await connectDB();
  const files = await CertificateFile.find({});
  console.log(`Found ${files.length} file(s) stored in MongoDB.`);
  let moved = 0;
  let failed = 0;
  for (const f of files) {
    try {
      const cert = await Certificate.findById(f.certificate);
      if (!cert) { await CertificateFile.deleteOne({ _id: f._id }); continue; } // orphan
      const meta = await fileStorage.upload(f.data, { certId: cert._id });
      Object.assign(cert, {
        fileStore: 'cloudinary',
        cloudinaryPublicId: meta.publicId,
        cloudinaryResourceType: meta.resourceType,
        cloudinaryFormat: meta.format,
        cloudinaryType: meta.type,
        fileContentType: f.contentType,
        fileSize: f.size,
        hasFile: true,
        fileName: cert.fileName || f.filename,
      });
      await cert.save();
      await CertificateFile.deleteOne({ _id: f._id }); // only after the upload and save both succeeded
      moved += 1;
      console.log(`Moved: ${cert.name}`);
    } catch (err) {
      failed += 1;
      console.error(`Failed for certificate ${f.certificate}: ${err.message}`);
    }
  }
  console.log(`Done. Moved ${moved}, failed ${failed}.`);
  await mongoose.disconnect();
})().catch((e) => { console.error(e.message); process.exit(1); });
