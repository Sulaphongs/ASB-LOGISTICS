import multer from 'multer';

/**
 * ການຕັ້ງຄ່າອັບໂຫລດຮູບພາບແບບໃຊ້ຮ່ວມກັນ (package photos, company logo, ...)
 * ແຍກອອກມາຈາກ packages.routes.js ເພື່ອບໍ່ໃຫ້ duplicate ລະຫວ່າງ route ຕ່າງໆ
 */
export const ALLOWED_IMAGE_MIME = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

export function createImageUpload({ maxSizeMb = 5 } = {}) {
  return multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxSizeMb * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (!ALLOWED_IMAGE_MIME[file.mimetype]) {
        return cb(new Error('ຮອງຮັບສະເພາະ JPG, PNG, WEBP'));
      }
      cb(null, true);
    },
  });
}

export function handleUploadErrors(multerMiddleware) {
  return (req, res, next) => {
    multerMiddleware(req, res, (err) => {
      if (err) {
        return res.status(400).json({ success: false, error: err.message || 'ອັບໂຫລດຮູບບໍ່ສຳເລັດ' });
      }
      next();
    });
  };
}
