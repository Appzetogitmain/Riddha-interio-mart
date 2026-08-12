const express = require("express");
const router = express.Router();
const {
  downloadSellerInvoice,
  shareSellerInvoice,
  downloadShippingLabels,
  downloadCustomerInvoice
} = require("../controllers/invoiceController");
const { protect } = require("../middleware/auth");

// All routes require authentication
router.use(protect);

router.route("/orders/:id/invoice/seller").get(downloadSellerInvoice);
router.route("/orders/:id/invoice/share").post(shareSellerInvoice);
router.route("/orders/:id/invoice/label").get(downloadShippingLabels);
router.route("/orders/:id/invoice/customer").get(downloadCustomerInvoice);

module.exports = router;
