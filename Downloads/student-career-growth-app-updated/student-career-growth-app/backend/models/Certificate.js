const mongoose = require('mongoose');
const { CERT_CATEGORIES } = require('../utils/techCatalog');

const schema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    key: { type: String, required: true }, // name|organization, lowercase
    name: { type: String, required: true, trim: true, maxlength: 150 },
    organization: { type: String, required: true, trim: true, maxlength: 150 },
    category: { type: String, enum: CERT_CATEGORIES, required: true },
    issueDate: { type: Date, required: true },
    expiryDate: { type: Date, default: null },
    credentialId: { type: String, trim: true, maxlength: 100, default: '' },
    url: { type: String, trim: true, maxlength: 500, default: '' },
    description: { type: String, trim: true, maxlength: 500, default: '' },
    hasFile: { type: Boolean, default: false },
    fileName: { type: String, default: '' },
    // Where the file lives: '' / 'mongo' = inside MongoDB (CertificateFile), 'cloudinary' = Cloudinary.
    fileStore: { type: String, enum: ['', 'mongo', 'cloudinary'], default: '' },
    fileContentType: { type: String, default: '' },
    fileSize: { type: Number, default: 0 },
    cloudinaryPublicId: { type: String, default: '' },
    cloudinaryResourceType: { type: String, default: '' },
    cloudinaryFormat: { type: String, default: '' },
    cloudinaryType: { type: String, default: '' },
  },
  {
    timestamps: true,
    toJSON: {
      // Storage internals are not sent to the browser.
      transform(doc, ret) {
        delete ret.cloudinaryPublicId;
        delete ret.cloudinaryResourceType;
        delete ret.cloudinaryFormat;
        delete ret.cloudinaryType;
        return ret;
      },
    },
  }
);
schema.index({ student: 1, key: 1 }, { unique: true });
module.exports = mongoose.model('Certificate', schema);
