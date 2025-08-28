import multer from "multer";

// Store file in memory or disk
const storage = multer.memoryStorage(); // memoryStorage for simplicity
const upload = multer({ storage });

export default upload;
