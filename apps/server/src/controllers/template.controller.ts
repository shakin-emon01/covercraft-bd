import type { Request, Response } from 'express';
import { COLOR_PALETTES, TEMPLATE_CATALOG } from '../constants/template-catalog';

export const getTemplates = async (_req: Request, res: Response) => {
  return res.json({
    page: {
      size: 'A4',
      widthPxAt96Dpi: 794,
      heightPxAt96Dpi: 1123,
    },
    templates: TEMPLATE_CATALOG,
    palettes: COLOR_PALETTES,
  });
};
