"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const university_controller_1 = require("../controllers/university.controller");
const router = (0, express_1.Router)();
router.get('/', university_controller_1.getAllUniversities);
router.get('/:id', university_controller_1.getUniversityById);
exports.default = router;
