"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const profile_controller_1 = require("../controllers/profile.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.get('/', auth_middleware_1.authenticate, profile_controller_1.getProfile);
router.put('/', auth_middleware_1.authenticate, profile_controller_1.upsertProfile);
exports.default = router;
