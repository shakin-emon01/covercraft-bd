import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../api/auth";
import { CoverPage, THEMES, COLOR_PALETTES } from "./CoverDesigner";

export default function PrintView() {
  const { id } = useParams();
  const [cover, setCover] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCover = async () => {
      try {
        // Authorization is provided via axios interceptor in normal browser flow,
        // and via Puppeteer extra headers in server-side PDF generation flow.
        const res = await API.get(`/covers/${id}/download`);

        if (res.data?.cover) {
          setCover(res.data.cover);
        }
      } catch (error) {
        console.error("Failed to load cover for printing", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCover();
  }, [id]);

  if (loading) return null; // Keep page blank while loading
  if (!cover) return <div style={{ padding: 20, fontFamily: "sans-serif" }}>Cover not found</div>;

  const form = cover.coverData;
  const paletteId = form.paletteId || "blue";
  const palette = COLOR_PALETTES.find((x) => x.id === paletteId) || COLOR_PALETTES[0];
  const theme = THEMES[cover.templateId] || THEMES[1];
  const A4_WIDTH_PX = 794;
  const A4_HEIGHT_PX = 1123;
  const PAGE_MARGIN_Y_PX = 20;
  const printableHeight = A4_HEIGHT_PX - PAGE_MARGIN_Y_PX * 2;
  const printScale = printableHeight / A4_HEIGHT_PX;
  const scaledWidth = Math.round(A4_WIDTH_PX * printScale);

  return (
    <>
      <style>{`
        @page {
          size: A4 portrait;
          margin: 20px 0;
        }

        html, body, #root {
          margin: 0;
          padding: 0;
          background: #ffffff;
        }

        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        #print-cover-root {
          background: #ffffff;
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          padding: 16px 0;
          box-sizing: border-box;
        }

        @media print {
          html, body, #root {
            width: 210mm;
            height: 297mm;
            overflow: hidden;
          }

          #print-cover-root {
            min-height: auto;
            height: calc(297mm - 40px);
            padding: 0;
          }
        }
      `}</style>
      <div id="print-cover-root">
        <div style={{ width: scaledWidth, height: printableHeight, overflow: "hidden" }}>
          <div style={{ width: A4_WIDTH_PX, height: A4_HEIGHT_PX, transform: `scale(${printScale})`, transformOrigin: "top left" }}>
            <CoverPage form={form} palette={palette} theme={theme} />
          </div>
        </div>
      </div>
    </>
  );
}
