"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// apps/server/src/routes/cover.routes.ts
const express_1 = require("express");
const cover_controller_1 = require("../controllers/cover.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Public route for shared covers (before authentication middleware)
router.get('/shared/:id', cover_controller_1.getSharedCover);
router.get('/', auth_middleware_1.authenticate, cover_controller_1.getUserCovers);
router.get('/:id/download', auth_middleware_1.authenticate, cover_controller_1.getCoverDownloadInfo);
router.post('/generate', auth_middleware_1.authenticate, cover_controller_1.generateCover);
router.post('/batch', auth_middleware_1.authenticate, cover_controller_1.generateBatchCovers);
router.post('/', auth_middleware_1.authenticate, cover_controller_1.createCover);
router.delete('/:id', auth_middleware_1.authenticate, cover_controller_1.deleteCover);
exports.default = router;
