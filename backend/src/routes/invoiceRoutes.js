const express = require("express");
const router = express.Router();
const {
  downloadSellerInvoice,
  shareSellerInvoice,
  downloadShippingLabels,
  downloadCustomerInvoice,
  previewSellerInvoice,
  previewShippingLabels,
  previewCustomerInvoice
} = require("../controllers/invoiceController");
const { protect } = require("../middleware/auth");

// All routes require authentication
router.use(protect);

router.route("/preview/seller").get(previewSellerInvoice);
router.route("/preview/label").get(previewShippingLabels);
router.route("/preview/customer").get(previewCustomerInvoice);

router.route("/orders/:id/invoice/seller").get(downloadSellerInvoice);
router.route("/orders/:id/invoice/share").post(shareSellerInvoice);
router.route("/orders/:id/invoice/label").get(downloadShippingLabels);
router.route("/orders/:id/invoice/customer").get(downloadCustomerInvoice);

module.exports = router;
