import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Tạo thư mục uploads nếu chưa có
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, uploadDir); 
    },
    filename(req, file, cb) {
        // Đổi tên file: Thời gian hiện tại + Đuôi file gốc (VD: 1680000000-toathuoc.jpg)
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

// Chỉ cho phép upload file ảnh
const fileFilter = (req, file, cb) => {
    const filetypes = /jpg|jpeg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Lỗi: Chỉ cho phép tải lên định dạng hình ảnh (JPG, JPEG, PNG)!'));
    }
};

export const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // Giới hạn ảnh tối đa 5MB
});