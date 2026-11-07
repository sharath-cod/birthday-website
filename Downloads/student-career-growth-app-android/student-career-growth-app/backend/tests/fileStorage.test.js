const test = require('node:test');
const assert = require('node:assert');
const Module = require('module');

// Fake Cloudinary SDK so the test needs no network and no account.
const calls = { upload: null, download: null, destroy: null };
const fake = {
  v2: {
    config() {},
    uploader: {
      upload_stream(opts, cb) {
        calls.upload = opts;
        return { end: () => cb(null, { public_id: `${opts.folder}/${opts.public_id}`, resource_type: 'image', format: 'pdf', type: opts.type }) };
      },
      async destroy(id, opts) { calls.destroy = { id, opts }; return { result: 'ok' }; },
    },
    utils: {
      private_download_url(id, format, opts) { calls.download = { id, format, opts }; return 'https://example.test/file'; },
    },
  },
};
const origLoad = Module._load;
Module._load = function (request, ...rest) {
  return request === 'cloudinary' ? fake : origLoad.call(this, request, ...rest);
};
const storage = require('../services/fileStorage');

test('isConfigured needs all three Cloudinary variables', () => {
  ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'].forEach((k) => delete process.env[k]);
  assert.strictEqual(storage.isConfigured(), false);
  process.env.CLOUDINARY_CLOUD_NAME = 'demo';
  process.env.CLOUDINARY_API_KEY = 'key';
  assert.strictEqual(storage.isConfigured(), false);
  process.env.CLOUDINARY_API_SECRET = 'secret';
  assert.strictEqual(storage.isConfigured(), true);
});

test('upload is private (authenticated) and overwrites per certificate', async () => {
  const meta = await storage.upload(Buffer.from('x'), { certId: 'abc123' });
  assert.strictEqual(calls.upload.type, 'authenticated');
  assert.strictEqual(calls.upload.public_id, 'abc123');
  assert.strictEqual(calls.upload.overwrite, true);
  assert.deepStrictEqual(meta, { publicId: `${storage.FOLDER}/abc123`, resourceType: 'image', format: 'pdf', type: 'authenticated' });
});

test('download uses a signed, expiring link and returns the bytes', async () => {
  const realFetch = global.fetch;
  global.fetch = async () => ({ ok: true, arrayBuffer: async () => Uint8Array.from([1, 2, 3]).buffer });
  try {
    const buf = await storage.download({ publicId: 'p', resourceType: 'image', format: 'pdf', type: 'authenticated' });
    assert.deepStrictEqual([...buf], [1, 2, 3]);
    assert.strictEqual(calls.download.format, 'pdf');
    assert.ok(calls.download.opts.expires_at > Date.now() / 1000);
    global.fetch = async () => ({ ok: false, status: 404 });
    await assert.rejects(() => storage.download({ publicId: 'p' }), /404/);
  } finally {
    global.fetch = realFetch;
  }
});

test('destroy never throws, even when Cloudinary fails', async () => {
  await storage.destroy({ publicId: 'p', resourceType: 'image', type: 'authenticated' });
  assert.strictEqual(calls.destroy.id, 'p');
  fake.v2.uploader.destroy = async () => { throw new Error('boom'); };
  await storage.destroy({ publicId: 'p' }); // must resolve
});
