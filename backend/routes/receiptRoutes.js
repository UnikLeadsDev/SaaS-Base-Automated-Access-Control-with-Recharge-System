// import express from "express";
// import { verifyToken } from "../middleware/auth.js";
// import { 
//   createReceipt, 
//   listReceipts,
//   sendReceipt
// } from "../controllers/receiptController.js";

// const router = express.Router();

// router.get("/receipts", verifyToken, listReceipts);
// router.post("/receipt", verifyToken, createReceipt);
// router.post("/send-receipt", verifyToken, sendReceipt);

// export default router;
// routes/receiptRoutes.js
import express from "express";
import { addReceipt, fetchReceipts } from "../controllers/receiptController.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

router.post("/add", verifyToken, addReceipt);
router.get("/my-receipts", verifyToken, fetchReceipts);

export default router;
