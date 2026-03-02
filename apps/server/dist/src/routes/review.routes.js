"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const review_controller_1 = require("../controllers/review.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.get('/', review_controller_1.getReviews);
router.post('/', auth_middleware_1.authenticate, review_controller_1.createReview);
exports.default = router;
