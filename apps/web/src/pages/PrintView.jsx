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

  return (
    <div style={{ background: "#ffffff", minHeight: "100vh", display: "flex" }}>
      <CoverPage form={form} palette={palette} theme={theme} />
    </div>
  );
}
