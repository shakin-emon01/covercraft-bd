"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTemplates = void 0;
const template_catalog_1 = require("../constants/template-catalog");
const getTemplates = async (_req, res) => {
    return res.json({
        page: {
            size: 'A4',
            widthPxAt96Dpi: 794,
            heightPxAt96Dpi: 1123,
        },
        templates: template_catalog_1.TEMPLATE_CATALOG,
        palettes: template_catalog_1.COLOR_PALETTES,
    });
};
exports.getTemplates = getTemplates;
