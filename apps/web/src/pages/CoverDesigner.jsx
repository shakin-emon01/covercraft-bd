import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import API, { generateCover, getProfile, getTemplates, getUniversities, generateBatchCovers } from "../api/auth";
import { useViewport } from "../hooks/useViewport";
import html2canvas from "html2canvas";

export const TEMPLATES = [
  { id: 1, name: "Academic Precision", desc: "Formal serif cover inspired by classic printed style" },
  { id: 2, name: "Sophisticated Wave", desc: "Soft elegant wave and premium academic composition" },
  { id: 3, name: "Classic Scholarly Frame", desc: "Framed scholarly look with heritage aesthetics" },
  { id: 4, name: "Minimal Academic Prestige", desc: "Double-line minimal premium print layout" },
  { id: 5, name: "Organic Elegance", desc: "Nature-inspired smooth curves and soft structure" },
  { id: 6, name: "Southeast Ribbon", desc: "Bordered assignment style with bold title ribbon" },
  { id: 7, name: "Dhaka Heritage", desc: "Classic monochrome composition with center alignment" },
  { id: 8, name: "Rajshahi Panel", desc: "Two-column submitted-by/to table layout" },
  { id: 9, name: "Minimal Gray Print", desc: "Soft gray printable structure for lab reports" },
  { id: 10, name: "DU Official", desc: "Exact replica of Dhaka University formal standard format" },
  { id: 11, name: "DIU Official", desc: "Exact replica of Daffodil International University format" },
  { id: 12, name: "JU Official", desc: "Exact replica of Jahangirnagar University rounded format" },
  { id: 13, name: "Polished Modern Tech", desc: "Angled geometric overlays with sleek sans-serif typography" },
  { id: 14, name: "Modern Luxury", desc: "Minimalist layout with elegant fonts and gold accents" },
  { id: 15, name: "Bold Geometric", desc: "Strong colored geometric header and footer blocks" },
];

export const COLOR_PALETTES = [
  { id: "blue", name: "Royal Blue", primary: "#1a3a6b", secondary: "#2563eb", accent: "#60a5fa", bg: "#f0f5ff" },
  { id: "green", name: "Forest Green", primary: "#14532d", secondary: "#16a34a", accent: "#4ade80", bg: "#f0fdf4" },
  { id: "maroon", name: "Maroon Gold", primary: "#7f1d1d", secondary: "#b91c1c", accent: "#fbbf24", bg: "#fff7ed" },
  { id: "purple", name: "Deep Purple", primary: "#3b0764", secondary: "#7c3aed", accent: "#c084fc", bg: "#faf5ff" },
  { id: "teal", name: "Teal Steel", primary: "#134e4a", secondary: "#0d9488", accent: "#2dd4bf", bg: "#f0fdfa" },
  { id: "navy", name: "Navy Crimson", primary: "#0f172a", secondary: "#1e3a5f", accent: "#ef4444", bg: "#f8fafc" },
  { id: "brown", name: "Chocolate", primary: "#451a03", secondary: "#92400e", accent: "#f59e0b", bg: "#fffbeb" },
  { id: "slate", name: "Slate Gray", primary: "#1e293b", secondary: "#475569", accent: "#94a3b8", bg: "#f1f5f9" },
];

const defaultForm = {
  university: "University of Dhaka",
  shortName: "DU",
  logoUrl: "",
  department: "Computer Science and Engineering",
  coverType: "LAB REPORT",
  topicNo: "01",
  topicName: "Creation of Hospital Database with Primary Key and Foreign Key Constraints",
  courseCode: "CSE-312",
  courseTitle: "Database Management System Lab",
  teacherName: "Syed Eftasum Alam",
  teacherDesignation: "Lecturer",
  teacherDept: "Dept. of Computer Science & Engineering",
  submissionMode: "individual",
  studentName: "Shakin Ahammed Emon",
  studentId: "241-15-111",
  groupMembers: [
    { id: 1, name: "Shakin Ahammed Emon", studentId: "241-15-111" },
    { id: 2, name: "Member 2 Name", studentId: "ID-02" },
  ],
  section: "66 - L2",
  semester: "Spring '26",
  submissionDate: "02.02.2026",
};

const cleanFont = "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

const baseTheme = {
  font: "'Cormorant Garamond', Georgia, serif", 
  pageBg: "#f8f8f8", border: null, cardBg: "#ffffff", text: "#111827", mute: "#475569", 
  radius: 10, labelColor: null, boxBorder: null, dateBg: null, dateColor: null, headerOffset: 0,
};

export const THEMES = {
  1: { ...baseTheme, pageBg: "#f4f4f2", border: "2px solid", radius: 2, headerOffset: 6, deco: "classic" },
  2: { ...baseTheme, pageBg: "#f8faf8", radius: 14, cardBg: "#ffffffdb", deco: "wave" },
  3: { ...baseTheme, pageBg: "#f5f3ed", radius: 0, cardBg: "#fffdf7", boxBorder: "#d5b67d", labelColor: "#9a7c45", deco: "frame" },
  4: { ...baseTheme, pageBg: "#f9fafb", radius: 0, deco: "minimal" },
  5: { ...baseTheme, pageBg: "#f8fbf7", radius: 13, cardBg: "#ffffffd6", boxBorder: null, deco: "organic" },
  6: { ...baseTheme, pageBg: "#f3f5fb", border: "2px solid", radius: 14, headerOffset: 6, deco: "southeast" },
  7: { ...baseTheme, pageBg: "#f8f8f8", radius: 0, cardBg: "#ffffff", boxBorder: "#d6d6d6", deco: "dhaka" },
  8: { ...baseTheme, pageBg: "#f9fafb", radius: 0, cardBg: "#ffffff", labelColor: "#0f172a", boxBorder: "#b8b8b8", dateColor: "#0f172a", deco: "rajshahi" },
  9: { ...baseTheme, pageBg: "#f2f3f5", radius: 4, boxBorder: "#bfc4cf", labelColor: "#334155", deco: "print" },
  10: { ...baseTheme, deco: "du_official" },
  11: { ...baseTheme, deco: "diu_official" },
  12: { ...baseTheme, deco: "ju_official" },
  13: { ...baseTheme, deco: "modern_tech" },
  14: { ...baseTheme, deco: "modern_luxury" },
  15: { ...baseTheme, deco: "bold_geometric" },
};

const normalize = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");

// 🚀 FIXED: Collision Resolver - Exact Name match priority
const resolveUniversity = (name, shortName, universities) => {
  if (!universities.length) return null;
  const nName = normalize(name), nShort = normalize(shortName);
  if (!nName && !nShort) return null;
  
  // 1. Try Exact Name Match first (Protects Daffodil from Dhaka Int. Uni)
  const exactNameMatch = universities.find(uni => normalize(uni.name) === nName);
  if (exactNameMatch) return exactNameMatch;

  // 2. Fallback to Short Name Match
  return universities.find(uni => normalize(uni.shortName) === nShort) || null;
};

const parseCsvLine = (line) => {
  const cells = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  cells.push(current.trim());
  return cells.map((cell) => cell.replace(/^["']|["']$/g, "").trim());
};

const parseCsvText = (rawText) => {
  const text = String(rawText || "").replace(/^\uFEFF/, "");
  const lines = text.split(/\r\n|\n|\r/).filter((line) => line.trim() !== "");
  return lines.map(parseCsvLine);
};

function OnlineLogoImage({ src, alt, style, fallback = null }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [src]);
  if (!src || failed) return fallback;
  return <img src={src} alt={alt} style={style} crossOrigin="anonymous" onError={() => setFailed(true)} />;
}

function Logo({ form, color, rounded = true, size = 88 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: rounded ? "50%" : 12, border: color ? `2px solid ${color}` : 'none', display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      {form.logoUrl ? <OnlineLogoImage src={form.logoUrl} alt="Logo" style={{ width: "82%", height: "82%", objectFit: "contain" }} fallback={<div style={{ fontSize: 9, fontWeight: 700, color }}>LOGO</div>} /> : <div style={{ fontSize: 9, fontWeight: 700, color }}>LOGO</div>}
    </div>
  );
}

function CenterWatermark({ form, palette }) {
  return (
    <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", userSelect: "none", zIndex: 0, display: "flex", justifyContent: "center", alignItems: "center", overflow: "hidden" }}>
      {form.logoUrl && <OnlineLogoImage src={form.logoUrl} alt="Watermark" style={{ width: "80%", maxWidth: 650, maxHeight: 750, objectFit: "contain", opacity: 0.05, filter: "grayscale(15%)" }} />}
    </div>
  );
}

// ==================== LAYOUTS ====================

function DUOfficialLayout({ form }) {
  return (
    <div style={{ width: 794, minHeight: 1123, padding: "50px", boxSizing: "border-box", background: "#fff", position: "relative", fontFamily: "'Times New Roman', Times, serif", color: "#000" }}>
       <div style={{ position: "absolute", inset: 20, border: "2px solid #000" }} />
       <div style={{ position: "absolute", inset: 24, border: "1px solid #000" }} />
       <CenterWatermark form={form} palette={{primary: '#000'}} />

       <div style={{ textAlign: "center", position: "relative", zIndex: 1, paddingTop: 10 }}>
          <div style={{ fontSize: 48, fontWeight: "bold", fontFamily: "'Old English Text MT', 'Times New Roman', serif", marginBottom: 20 }}>{form.university}</div>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}><Logo form={form} size={110} rounded={false} /></div>
          <div style={{ fontSize: 13, fontFamily: cleanFont, letterSpacing: 2, textTransform: "uppercase", color: "#475569", marginBottom: 8 }}>Assignment on</div>
          <div style={{ fontSize: 22, fontWeight: "bold", color: "#1e3a8a", marginBottom: 20, padding: "0 40px" }}>{form.topicName}</div>
          <div style={{ fontSize: 16, marginBottom: 5 }}><strong>Course Title:</strong> {form.courseTitle}</div>
          <div style={{ fontSize: 16, marginBottom: 25 }}><strong>Course Code:</strong> <span style={{ fontFamily: cleanFont, fontWeight: 600 }}>{form.courseCode}</span></div>
       </div>

       <div style={{ display: "flex", justifyContent: "space-between", marginTop: 40, padding: "0 40px", position: "relative", zIndex: 1, fontFamily: cleanFont }}>
          <div style={{ textAlign: "center", width: "45%" }}>
             <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: "#64748b", textTransform: "uppercase", marginBottom: 12 }}>Prepared For</div>
             <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>{form.teacherName}</div>
             <div style={{ fontSize: 14, color: "#334155" }}>{form.teacherDesignation}</div>
             <div style={{ fontSize: 13, color: "#475569", marginTop: 4 }}>{form.teacherDept}, {form.shortName}</div>
          </div>
          <div style={{ textAlign: "center", width: "45%" }}>
             <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: "#64748b", textTransform: "uppercase", marginBottom: 12 }}>{form.submissionMode === 'group' ? 'Prepared By (Group)' : 'Prepared By'}</div>
             {form.submissionMode === 'group' ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", textAlign: "left", background: "#f8fafc", padding: "12px", borderRadius: 8 }}>
                  {(form.groupMembers || []).map((m, idx) => (
                    <div key={m.id} style={{ fontSize: 13, color: "#0f172a", lineHeight: 1.3 }}>
                      <strong>{idx + 1}. {m.name}</strong><br/><span style={{ fontSize: 12, color: "#475569" }}>ID: {m.studentId}</span>
                    </div>
                  ))}
                  <div style={{ fontSize: 12, color: "#475569", marginTop: 4, paddingTop: 6, borderTop: "1px dashed #cbd5e1", textAlign: "center" }}>Sec: {form.section} | Sem: {form.semester}</div>
                </div>
             ) : (
                <>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>{form.studentName}</div>
                  <div style={{ fontSize: 14, color: "#334155" }}>ID: <span style={{ fontWeight: 600 }}>{form.studentId}</span> | Sec: {form.section}</div>
                  <div style={{ fontSize: 13, color: "#475569", marginTop: 4 }}>Semester: {form.semester}</div>
                </>
             )}
          </div>
       </div>

       <div style={{ textAlign: "center", marginTop: 40, fontSize: 15, fontFamily: cleanFont, position: "relative", zIndex: 1, borderTop: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0", padding: "12px 0", margin: "40px 60px 0" }}>
          <span style={{ fontWeight: 700, color: "#64748b", letterSpacing: 1, textTransform: "uppercase", marginRight: 8, fontSize: 11 }}>Date of Submission:</span> 
          <strong style={{ color: "#0f172a" }}>{form.submissionDate}</strong>
       </div>
       <div style={{ position: "absolute", bottom: 40, left: 0, right: 0, textAlign: "center", zIndex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: "bold", marginBottom: 8 }}>Department of {form.department}</div>
          <div style={{ fontSize: 16, fontWeight: "bold" }}>{form.university}</div>
       </div>
    </div>
  );
}

function DIUOfficialLayout({ form, palette }) {
  return (
    <div style={{ width: 794, minHeight: 1123, padding: "50px", boxSizing: "border-box", background: "#fff", position: "relative", fontFamily: "'Times New Roman', Times, serif", color: "#000" }}>
       <div style={{ position: "absolute", inset: 16, border: `3px solid ${palette.secondary}` }} />
       <div style={{ position: "absolute", inset: 22, border: `1px solid ${palette.secondary}` }} />
       <CenterWatermark form={form} palette={palette} />

       <div style={{ position: "relative", zIndex: 1, padding: "0 20px" }}>
           <div style={{ display: "flex", justifyContent: "center", marginBottom: 10, marginTop: 20 }}><Logo form={form} size={150} rounded={false} /></div>
           <div style={{ textAlign: "center", marginBottom: 25 }}>
              <div style={{ fontSize: 16, fontFamily: cleanFont, letterSpacing: 1, color: "#475569" }}>DEPARTMENT OF</div>
              <div style={{ fontWeight: "bold", fontSize: 20, marginTop: 4 }}>{form.department.toUpperCase()}</div>
           </div>
           <div style={{ textAlign: "center", fontSize: 42, fontWeight: "bold", letterSpacing: 3, marginBottom: 35, textTransform: "uppercase", color: palette.primary }}>{form.coverType}</div>

           <div style={{ fontFamily: cleanFont, display: "flex", flexDirection: "column", gap: 20 }}>
             <div style={{ border: "1px solid #cbd5e1", borderRadius: 6, display: "flex", background: "rgba(255,255,255,0.95)", overflow: "hidden" }}>
                <div style={{ background: "#f8fafc", borderRight: "1px solid #cbd5e1", padding: "16px", width: 60, textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#64748b", letterSpacing: 1 }}>NO.</span>
                  <span style={{ fontSize: 20, fontWeight: 800, color: palette.primary }}>{form.topicNo}</span>
                </div>
                <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", letterSpacing: 1.5, marginBottom: 4 }}>TOPIC NAME</div>
                  <div style={{ fontSize: 16, color: "#0f172a", fontWeight: 500, lineHeight: 1.4 }}>{form.topicName}</div>
                </div>
             </div>

             <div style={{ border: "1px solid #cbd5e1", borderRadius: 6, padding: "20px", background: "rgba(255,255,255,0.95)" }}>
                <div style={{ marginBottom: 12, display: "flex", alignItems: "baseline" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: 1.5, width: 130 }}>COURSE CODE:</span>
                  <span style={{ fontSize: 18, fontWeight: 800, color: palette.primary }}>{form.courseCode}</span>
                </div>
                <div style={{ display: "flex", alignItems: "baseline" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: 1.5, width: 130 }}>COURSE TITLE:</span>
                  <span style={{ fontSize: 16, fontWeight: 500, color: "#0f172a" }}>{form.courseTitle}</span>
                </div>
             </div>

             <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <div style={{ border: "1px solid #cbd5e1", borderRadius: 6, padding: "24px", background: "rgba(255,255,255,0.95)" }}>
                    <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, color: palette.secondary, textTransform: "uppercase", marginBottom: 16, borderBottom: "1px solid #e2e8f0", paddingBottom: 8 }}>Submitted To</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>{form.teacherName}</div>
                    <div style={{ fontSize: 14, color: "#475569", marginBottom: 4 }}>{form.teacherDesignation}</div>
                    <div style={{ fontSize: 13, color: "#64748b" }}>{form.teacherDept}</div>
                </div>
                <div style={{ border: "1px solid #cbd5e1", borderRadius: 6, padding: "24px", background: "rgba(255,255,255,0.95)" }}>
                    <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, color: palette.secondary, textTransform: "uppercase", marginBottom: 16, borderBottom: "1px solid #e2e8f0", paddingBottom: 8 }}>{form.submissionMode === 'group' ? 'Submitted By' : 'Submitted By'}</div>
                    {form.submissionMode === 'group' ? (
                       <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                         {(form.groupMembers || []).map((m, idx) => (
                           <div key={m.id} style={{ fontSize: 13, color: "#0f172a", lineHeight: 1.3 }}>
                             <strong style={{ fontWeight: 700 }}>{idx + 1}. {m.name}</strong> <span style={{ color: "#475569" }}>(ID: {m.studentId})</span>
                           </div>
                         ))}
                         <div style={{ fontSize: 12, color: "#64748b", marginTop: 6, paddingTop: 6, borderTop: "1px dashed #e2e8f0" }}>Sec: {form.section} &bull; Sem: {form.semester}</div>
                       </div>
                    ) : (
                       <>
                         <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>{form.studentName}</div>
                         <div style={{ fontSize: 14, color: "#475569", marginBottom: 4 }}>ID: <strong style={{ color: "#0f172a" }}>{form.studentId}</strong></div>
                         <div style={{ fontSize: 13, color: "#64748b", marginBottom: 2 }}>Sec: {form.section} &bull; Sem: {form.semester}</div>
                       </>
                    )}
                </div>
             </div>
             
             <div style={{ border: "1px solid #cbd5e1", borderRadius: 6, padding: "16px 24px", background: "rgba(255,255,255,0.95)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                 <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, color: "#64748b" }}>SUBMISSION DATE</span> 
                 <span style={{ fontSize: 18, fontWeight: 800, color: palette.primary }}>{form.submissionDate}</span>
             </div>
           </div>
       </div>
    </div>
  );
}

function JUOfficialLayout({ form, palette }) {
  return (
    <div style={{ width: 794, minHeight: 1123, padding: "50px 60px", boxSizing: "border-box", background: "#fdfdfd", position: "relative", fontFamily: "'Georgia', serif", color: "#333" }}>
       <CenterWatermark form={form} palette={palette} />
       <div style={{ position: "relative", zIndex: 1 }}>
           <div style={{ display: "flex", justifyContent: "center", position: "relative", marginBottom: 25 }}>
               <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 1, background: "#e2e8f0", zIndex: -1 }}/>
               <Logo form={form} color="#cbd5e1" rounded={true} size={90} />
           </div>
           <div style={{ textAlign: "center", fontSize: 40, fontWeight: "bold", color: "#1e293b", marginBottom: 8 }}>{form.university}</div>
           <div style={{ textAlign: "center", fontStyle: "italic", color: "#64748b", marginBottom: 30, fontSize: 18 }}>Department of {form.department}</div>
           <div style={{ textAlign: "center", fontSize: 46, fontWeight: "bold", letterSpacing: 5, color: "#0f172a", marginBottom: 40, textTransform: "uppercase" }}>{form.coverType}</div>

           <div style={{ fontFamily: cleanFont }}>
             <div style={{ border: `1px solid #cbd5e1`, borderRadius: 10, display: "flex", marginBottom: 16, background: "#fff", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                <div style={{ borderRight: `1px solid #cbd5e1`, padding: "16px", width: 60, textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: 1 }}>NO.</span>
                  <span style={{ fontSize: 22, fontWeight: 800, color: "#0f172a" }}>{form.topicNo}</span>
                </div>
                <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                   <strong style={{ fontSize: 10, letterSpacing: 1.5, color: "#64748b", textTransform: "uppercase", marginBottom: 6 }}>Topic Name</strong>
                   <div style={{ fontSize: 16, color: "#1e293b", fontWeight: 500 }}>{form.topicName}</div>
                </div>
             </div>

             <div style={{ border: `1px solid #cbd5e1`, borderRadius: 10, padding: "20px 24px", marginBottom: 24, background: "#fff", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                <div style={{ marginBottom: 10, display: "flex", alignItems: "baseline" }}>
                  <strong style={{ fontSize: 10, letterSpacing: 1.5, color: "#64748b", textTransform: "uppercase", width: 140 }}>Course Code</strong>
                  <span style={{ fontSize: 20, fontWeight: 800, color: "#0f172a" }}>{form.courseCode}</span>
                </div>
                <div style={{ display: "flex", alignItems: "baseline" }}>
                  <strong style={{ fontSize: 10, letterSpacing: 1.5, color: "#64748b", textTransform: "uppercase", width: 140 }}>Course Title</strong>
                  <span style={{ fontSize: 16, color: "#1e293b", fontWeight: 500 }}>{form.courseTitle}</span>
                </div>
             </div>

             <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
                <div style={{ border: `1px solid #cbd5e1`, borderRadius: 10, padding: "24px", background: "#fff", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: "#64748b", textTransform: "uppercase", marginBottom: 16 }}>Submitted To</div>
                    <div style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>{form.teacherName}</div>
                    <div style={{ fontSize: 14, color: "#475569", marginBottom: 12 }}>{form.teacherDesignation}</div>
                    <div style={{ fontSize: 13, color: "#64748b" }}>{form.teacherDept}</div>
                </div>
                <div style={{ border: `1px solid #cbd5e1`, borderRadius: 10, padding: "24px", background: "#fff", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: "#64748b", textTransform: "uppercase", marginBottom: 16 }}>Submitted By</div>
                    {form.submissionMode === 'group' ? (
                       <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                         {(form.groupMembers || []).map((m, idx) => (
                           <div key={m.id} style={{ fontSize: 13, color: "#0f172a", lineHeight: 1.2 }}>
                             <strong style={{ fontSize: 14, fontWeight: 700 }}>{idx + 1}. {m.name}</strong> <span style={{ color: "#475569" }}>(ID: {m.studentId})</span>
                           </div>
                         ))}
                         <div style={{ fontSize: 12, color: "#64748b", marginTop: 4, paddingTop: 6, borderTop: "1px dashed #cbd5e1" }}>Sec: {form.section} &bull; Sem: {form.semester}</div>
                       </div>
                    ) : (
                       <>
                         <div style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>{form.studentName}</div>
                         <div style={{ fontSize: 14, color: "#475569", marginBottom: 4 }}>ID: <strong style={{color:"#0f172a"}}>{form.studentId}</strong></div>
                         <div style={{ fontSize: 14, color: "#475569", marginBottom: 12 }}>Section: {form.section} &bull; Sem: {form.semester}</div>
                       </>
                    )}
                </div>
             </div>
             <div style={{ border: `1px solid #cbd5e1`, borderRadius: 10, padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                 <strong style={{ fontSize: 11, letterSpacing: 2, color: "#64748b", textTransform: "uppercase" }}>Submission Date</strong>
                 <span style={{ fontSize: 20, fontWeight: 800, color: "#0f172a" }}>{form.submissionDate}</span>
             </div>
           </div>
       </div>
    </div>
  );
}

function PolishedModernLayout({ form, palette }) {
  return (
    <div style={{ width: 794, minHeight: 1123, padding: "70px 60px", boxSizing: "border-box", background: "#fafafa", position: "relative", fontFamily: cleanFont, color: "#1e293b", overflow: "hidden" }}>
       <div style={{ position: "absolute", top: 0, left: 0, width: 350, height: 250, background: `linear-gradient(135deg, ${palette.primary}, ${palette.secondary})`, clipPath: "polygon(0 0, 100% 0, 0 100%)", opacity: 0.95 }}/>
       <div style={{ position: "absolute", bottom: 0, right: 0, width: 350, height: 250, background: `linear-gradient(135deg, ${palette.secondary}, ${palette.primary})`, clipPath: "polygon(100% 100%, 100% 0, 0 100%)", opacity: 0.95 }}/>
       <CenterWatermark form={form} palette={palette} />

       <div style={{ position: "relative", zIndex: 1 }}>
           <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 40, background: "#fff", padding: "15px 25px", borderRadius: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
               <Logo form={form} rounded={false} size={64} />
               <div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: palette.primary, fontFamily: baseTheme.font }}>{form.university}</div>
                  <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, letterSpacing: 1 }}>DEPARTMENT OF {form.department.toUpperCase()}</div>
               </div>
           </div>
           <div style={{ textAlign: "center", fontSize: 52, fontWeight: 900, color: palette.primary, marginBottom: 40, textTransform: "uppercase", letterSpacing: 2, fontFamily: baseTheme.font }}>{form.coverType}</div>

           <div style={{ background: "#fff", borderRadius: 10, boxShadow: "0 4px 20px rgba(0,0,0,0.04)", display: "flex", marginBottom: 20, overflow: "hidden" }}>
              <div style={{ background: palette.primary, color: "#fff", padding: "20px", width: 60, textAlign: "center", display:"flex", flexDirection:"column", justifyContent:"center" }}>
                <span style={{fontSize: 10, fontWeight: 700, opacity: 0.8, letterSpacing: 1}}>NO.</span>
                <span style={{ fontSize: 24, fontWeight: 800 }}>{form.topicNo}</span>
              </div>
              <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                 <strong style={{ fontSize: 10, letterSpacing: 1.5, color: palette.secondary, textTransform: "uppercase", marginBottom: 6 }}>Topic Name</strong>
                 <div style={{ fontSize: 16, fontWeight: 600, color: "#0f172a" }}>{form.topicName}</div>
              </div>
           </div>

           <div style={{ background: "#fff", borderRadius: 10, boxShadow: "0 4px 20px rgba(0,0,0,0.04)", padding: "24px", marginBottom: 24, borderLeft: `6px solid ${palette.secondary}` }}>
              <div style={{ marginBottom: 12, display: "flex", alignItems: "center" }}><strong style={{ fontSize: 11, letterSpacing: 1.5, color: "#64748b", textTransform: "uppercase", width: 140 }}>Course Code</strong><span style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>{form.courseCode}</span></div>
              <div style={{ display: "flex", alignItems: "center" }}><strong style={{ fontSize: 11, letterSpacing: 1.5, color: "#64748b", textTransform: "uppercase", width: 140 }}>Course Title</strong><span style={{ fontSize: 16, fontWeight: 600, color: "#1e293b" }}>{form.courseTitle}</span></div>
           </div>

           <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
              <div style={{ background: "#fff", borderRadius: 10, boxShadow: "0 4px 20px rgba(0,0,0,0.04)", padding: "24px", borderTop: `4px solid ${palette.primary}` }}>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, color: palette.secondary, textTransform: "uppercase", marginBottom: 16 }}>Submitted To</div>
                  <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 6, color: "#0f172a" }}>{form.teacherName}</div>
                  <div style={{ fontSize: 14, color: "#475569", marginBottom: 4 }}>{form.teacherDesignation}</div>
                  <div style={{ fontSize: 13, color: "#94a3b8" }}>{form.teacherDept}</div>
              </div>
              <div style={{ background: "#fff", borderRadius: 10, boxShadow: "0 4px 20px rgba(0,0,0,0.04)", padding: "24px", borderTop: `4px solid ${palette.primary}` }}>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, color: palette.secondary, textTransform: "uppercase", marginBottom: 16 }}>Submitted By</div>
                  {form.submissionMode === 'group' ? (
                     <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                       {(form.groupMembers || []).map((m, idx) => (
                         <div key={m.id} style={{ fontSize: 13, color: "#0f172a", lineHeight: 1.2 }}>
                           <strong style={{ fontWeight: 700 }}>{idx + 1}. {m.name}</strong> <span style={{ color: "#64748b" }}>(ID: {m.studentId})</span>
                         </div>
                       ))}
                       <div style={{ fontSize: 12, color: "#64748b", marginTop: 4, paddingTop: 6, borderTop: "1px dashed #e2e8f0" }}>Sec: {form.section} &bull; Sem: {form.semester}</div>
                     </div>
                  ) : (
                     <>
                       <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 6, color: "#0f172a" }}>{form.studentName}</div>
                       <div style={{ fontSize: 14, color: "#475569", marginBottom: 4 }}><strong style={{color:"#0f172a"}}>ID:</strong> {form.studentId}</div>
                       <div style={{ fontSize: 14, color: "#475569" }}>Sec: {form.section} &bull; Sem: {form.semester}</div>
                     </>
                  )}
              </div>
           </div>
           <div style={{ background: palette.primary, borderRadius: 10, padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", color: "#fff", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
               <strong style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", opacity: 0.8 }}>Submission Date</strong>
               <span style={{ fontSize: 20, fontWeight: 800 }}>{form.submissionDate}</span>
           </div>
       </div>
    </div>
  );
}

function ModernLuxuryLayout({ form, palette }) {
  return (
    <div style={{ width: 794, minHeight: 1123, padding: "60px", boxSizing: "border-box", background: "#fffdfa", position: "relative", color: "#1c1917" }}>
       <CenterWatermark form={form} palette={palette} />
       <div style={{ position: "relative", zIndex: 1 }}>
           <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderBottom: `2px solid ${palette.accent}`, paddingBottom: 20, marginBottom: 40 }}>
               <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
                  <Logo form={form} rounded={false} size={64} />
                  <div style={{ fontSize: 26, fontWeight: "bold", color: palette.primary, maxWidth: 300, fontFamily: baseTheme.font }}>{form.university}</div>
               </div>
               <div style={{ textAlign: "right", color: "#57534e", maxWidth: 250 }}>
                   <div style={{ fontSize: 10, fontFamily: cleanFont, letterSpacing: 1.5, textTransform: "uppercase", color: "#a8a29e", marginBottom: 4 }}>Department Of</div>
                   <div style={{ fontSize: 15, fontWeight: "600", fontFamily: cleanFont }}>{form.department}</div>
               </div>
           </div>

           <div style={{ textAlign: "center", fontSize: 46, fontWeight: "bold", color: palette.primary, marginBottom: 20, letterSpacing: 3, fontFamily: baseTheme.font }}>{form.coverType}</div>
           <div style={{ display: "flex", justifyContent: "center", marginBottom: 40 }}><div style={{ width: 40, height: 2, background: palette.accent }}/></div>

           <div style={{ fontFamily: cleanFont }}>
             <div style={{ border: `1px solid ${palette.accent}60`, padding: "20px", marginBottom: 20, display: "flex", background: "#fff" }}>
                <div style={{ borderRight: `1px solid ${palette.accent}60`, paddingRight: "20px", width: 40, textAlign: "center", display:"flex", flexDirection:"column", justifyContent:"center" }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: "#a8a29e", letterSpacing: 1 }}>NO.</span>
                  <span style={{ fontSize: 20, fontWeight: 800, color: palette.primary }}>{form.topicNo}</span>
                </div>
                <div style={{ paddingLeft: "24px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#78716c", letterSpacing: 1.5, marginBottom: 6 }}>TOPIC NAME</span>
                  <span style={{ fontSize: 16, fontWeight: 500 }}>{form.topicName}</span>
                </div>
             </div>

             <div style={{ border: `1px solid ${palette.accent}60`, padding: "20px 24px", marginBottom: 30, background: "#fff" }}>
                <div style={{ marginBottom: 12, display: "flex", alignItems: "center" }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#78716c", letterSpacing: 1.5, width: 140 }}>COURSE CODE</span>
                  <span style={{ color: palette.primary, fontWeight: 800, fontSize: 18 }}>{form.courseCode}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#78716c", letterSpacing: 1.5, width: 140 }}>COURSE TITLE</span>
                  <span style={{ fontSize: 16, fontWeight: 500 }}>{form.courseTitle}</span>
                </div>
             </div>

             <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 40 }}>
                <div style={{ border: `1px solid ${palette.accent}60`, padding: "24px", background: "#fff" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: "#a8a29e", textTransform: "uppercase", marginBottom: 16 }}>Submitted To</div>
                    <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 6, color: palette.primary }}>{form.teacherName}</div>
                    <div style={{ fontSize: 14, color: "#57534e", marginBottom: 4 }}>{form.teacherDesignation}</div>
                    <div style={{ fontSize: 13, color: "#78716c" }}>{form.teacherDept}</div>
                </div>
                <div style={{ border: `1px solid ${palette.accent}60`, padding: "24px", background: "#fff" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: "#a8a29e", textTransform: "uppercase", marginBottom: 16 }}>Submitted By</div>
                    {form.submissionMode === 'group' ? (
                       <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                         {(form.groupMembers || []).map((m, idx) => (
                           <div key={m.id} style={{ fontSize: 13, color: "#1c1917", lineHeight: 1.2 }}>
                             <strong style={{ fontWeight: 700 }}>{idx + 1}. {m.name}</strong> <span style={{ color: "#78716c" }}>(ID: {m.studentId})</span>
                           </div>
                         ))}
                         <div style={{ fontSize: 12, color: "#78716c", marginTop: 4, paddingTop: 6, borderTop: `1px dashed ${palette.accent}60` }}>Sec: {form.section} &bull; Sem: {form.semester}</div>
                       </div>
                    ) : (
                       <>
                         <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 6, color: palette.primary }}>{form.studentName}</div>
                         <div style={{ fontSize: 14, color: "#57534e", marginBottom: 4 }}>ID: <strong style={{color:"#1c1917"}}>{form.studentId}</strong></div>
                         <div style={{ fontSize: 14, color: "#57534e" }}>Sec: {form.section} &bull; Sem: {form.semester}</div>
                       </>
                    )}
                </div>
             </div>
             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${palette.accent}60`, paddingTop: 20 }}>
                 <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: "#78716c" }}>SUBMISSION DATE</span>
                 <span style={{ fontSize: 18, fontWeight: 800, color: palette.primary }}>{form.submissionDate}</span>
             </div>
           </div>
       </div>
    </div>
  );
}

function BoldGeometricLayout({ form, palette }) {
  return (
    <div style={{ width: 794, minHeight: 1123, padding: "0", boxSizing: "border-box", background: "#f8fafc", position: "relative", color: "#0f172a", overflow: "hidden" }}>
       <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 180, background: palette.primary, clipPath: "polygon(0 0, 100% 0, 100% 40%, 0 100%)", zIndex: 0 }} />
       <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 180, background: palette.secondary, clipPath: "polygon(0 0, 60% 0, 0 80%)", zIndex: 0 }} />
       <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 140, background: palette.primary, clipPath: "polygon(0 100%, 100% 100%, 100% 0, 0 60%)", zIndex: 0 }} />
       <CenterWatermark form={form} palette={palette} />

       <div style={{ padding: "50px 60px", paddingTop: 140, position: "relative", zIndex: 1 }}>
           <div style={{ display: "flex", alignItems: "center", gap: 15, marginBottom: 30, background: "rgba(255,255,255,0.9)", padding: "10px 20px", borderRadius: 8, width: "fit-content", boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }}>
              <Logo form={form} rounded={false} size={50} />
              <div style={{ fontSize: 20, fontWeight: 800, color: palette.primary, fontFamily: baseTheme.font }}>{form.university}</div>
           </div>

           <div style={{ textAlign: "center", fontSize: 56, fontWeight: 900, color: palette.primary, marginBottom: 35, textTransform: "uppercase", letterSpacing: 2, fontFamily: baseTheme.font }}>{form.coverType}</div>

           <div style={{ fontFamily: cleanFont }}>
             <div style={{ background: "#fff", border: `1px solid ${palette.secondary}40`, borderRadius: 8, display: "flex", marginBottom: 20, overflow: "hidden" }}>
                <div style={{ borderRight: `1px solid ${palette.secondary}40`, padding: "16px", width: 60, textAlign: "center", background: `${palette.secondary}08`, display: "flex", flexDirection:"column", justifyContent:"center" }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: "#64748b", letterSpacing: 1 }}>NO.</span>
                  <span style={{ fontSize: 22, color: palette.primary, fontWeight: 800 }}>{form.topicNo}</span>
                </div>
                <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: palette.secondary, letterSpacing: 1.5, marginBottom: 4 }}>TOPIC NAME</span>
                  <span style={{ fontSize: 16, fontWeight: 600, color: "#0f172a" }}>{form.topicName}</span>
                </div>
             </div>

             <div style={{ background: "#fff", border: `1px solid ${palette.secondary}40`, borderRadius: 8, padding: "20px 24px", marginBottom: 24 }}>
                <div style={{ marginBottom: 12, display: "flex", alignItems: "center" }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: palette.secondary, letterSpacing: 1.5, width: 130 }}>COURSE CODE</span>
                  <span style={{ fontWeight: 800, color: palette.primary, fontSize: 18 }}>{form.courseCode}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: palette.secondary, letterSpacing: 1.5, width: 130 }}>COURSE TITLE</span>
                  <span style={{ fontSize: 16, fontWeight: 600, color: "#0f172a" }}>{form.courseTitle}</span>
                </div>
             </div>

             <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 30 }}>
                <div style={{ background: "#fff", border: `1px solid ${palette.secondary}40`, borderRadius: 8, padding: "24px" }}>
                    <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.5, color: palette.secondary, textTransform: "uppercase", marginBottom: 16, borderBottom: `1px solid ${palette.secondary}20`, paddingBottom: 8 }}>Submitted To</div>
                    <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 6, color: "#0f172a" }}>{form.teacherName}</div>
                    <div style={{ fontSize: 14, color: "#475569", marginBottom: 4 }}>{form.teacherDesignation}</div>
                    <div style={{ fontSize: 13, color: "#64748b" }}>{form.teacherDept}</div>
                </div>
                <div style={{ background: "#fff", border: `1px solid ${palette.secondary}40`, borderRadius: 8, padding: "24px" }}>
                    <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.5, color: palette.secondary, textTransform: "uppercase", marginBottom: 16, borderBottom: `1px solid ${palette.secondary}20`, paddingBottom: 8 }}>Submitted By</div>
                    {form.submissionMode === 'group' ? (
                       <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                         {(form.groupMembers || []).map((m, idx) => (
                           <div key={m.id} style={{ fontSize: 13, color: "#0f172a", lineHeight: 1.2 }}>
                             <strong style={{ fontWeight: 700 }}>{idx + 1}. {m.name}</strong> <span style={{ color: "#64748b" }}>(ID: {m.studentId})</span>
                           </div>
                         ))}
                         <div style={{ fontSize: 12, color: "#64748b", marginTop: 4, paddingTop: 6, borderTop: `1px dashed ${palette.secondary}40` }}>Sec: {form.section} &bull; Sem: {form.semester}</div>
                       </div>
                    ) : (
                       <>
                         <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 6, color: "#0f172a" }}>{form.studentName}</div>
                         <div style={{ fontSize: 14, color: "#475569", marginBottom: 4 }}><strong style={{color:"#0f172a"}}>ID:</strong> {form.studentId}</div>
                         <div style={{ fontSize: 14, color: "#475569" }}>Sec: {form.section} &bull; Sem: {form.semester}</div>
                       </>
                    )}
                </div>
             </div>
             
             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", padding: "16px 24px", borderRadius: 8, border: `1px solid ${palette.secondary}40` }}>
                 <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: palette.secondary }}>SUBMISSION DATE</span>
                 <span style={{ fontSize: 18, fontWeight: 800, color: palette.primary }}>{form.submissionDate}</span>
             </div>
           </div>
       </div>
    </div>
  );
}

function ContentBlocks({ form: f, palette: p, theme }) {
  const border = theme.boxBorder || `${p.primary}40`;
  const labelColor = theme.labelColor || p.primary;
  const dateBg = theme.dateBg === "sidebar" ? `linear-gradient(90deg, ${p.primary}, #334155)` : theme.dateBg || theme.cardBg;
  const dateColor = theme.dateBg === "sidebar" ? "#fff" : theme.dateColor || p.primary;
  const dateLabel = theme.dateBg === "sidebar" ? "rgba(255,255,255,0.72)" : theme.mute;

  return (
    <div style={{ fontFamily: cleanFont }}>
      <div style={{ display: "grid", gridTemplateColumns: "66px 1fr", border: `1px solid ${border}`, borderRadius: theme.radius, overflow: "hidden", marginBottom: 16, background: theme.cardBg }}>
        <div style={{ borderRight: `1px solid ${border}`, padding: "16px 8px", textAlign: "center", background: p.bg, display:"flex", flexDirection:"column", justifyContent:"center" }}>
          <div style={{ fontSize: 9, letterSpacing: 1.5, color: theme.mute, fontWeight: 700, marginBottom: 2 }}>NO.</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: p.primary }}>{f.topicNo}</div>
        </div>
        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ fontSize: 10, letterSpacing: 1.5, fontWeight: 700, color: labelColor, marginBottom: 6, textTransform: "uppercase" }}>Topic Name</div>
          <div style={{ fontSize: 15, fontWeight: 500, color: "#0f172a", lineHeight: 1.5 }}>{f.topicName}</div>
        </div>
      </div>
      
      <div style={{ border: `1px solid ${border}`, borderRadius: theme.radius, padding: "20px 20px", marginBottom: 20, background: theme.cardBg }}>
        <div style={{ marginBottom: 12, display: "flex", alignItems: "center" }}>
          <span style={{ fontSize: 10, letterSpacing: 1.5, fontWeight: 700, color: labelColor, width: 130, textTransform: "uppercase" }}>Course Code</span>
          <span style={{ color: "#0f172a", fontWeight: 800, fontSize: 18 }}>{f.courseCode}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center" }}>
          <span style={{ fontSize: 10, letterSpacing: 1.5, fontWeight: 700, color: labelColor, width: 130, textTransform: "uppercase" }}>Course Title</span>
          <span style={{ color: "#1e293b", fontSize: 15, fontWeight: 500 }}>{f.courseTitle}</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        <div style={{ border: `1px solid ${border}`, borderRadius: theme.radius, padding: "20px", background: theme.cardBg }}>
          <div style={{ fontSize: 10, marginBottom: 12, letterSpacing: 1.5, color: labelColor, fontWeight: 700, textTransform: "uppercase", borderBottom: `1px solid ${border}`, paddingBottom: 8 }}>Submitted To</div>
          <div style={{ color: "#0f172a", fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{f.teacherName}</div>
          <div style={{ color: theme.mute, fontSize: 13, marginBottom: 4 }}>{f.teacherDesignation}</div>
          <div style={{ color: theme.mute, fontSize: 13, marginBottom: 4 }}>{f.teacherDept}</div>
          <div style={{ color: theme.mute, fontSize: 13 }}>{f.university}</div>
        </div>

        <div style={{ border: `1px solid ${border}`, borderRadius: theme.radius, padding: "20px", background: theme.cardBg }}>
          <div style={{ fontSize: 10, marginBottom: 12, letterSpacing: 1.5, color: labelColor, fontWeight: 700, textTransform: "uppercase", borderBottom: `1px solid ${border}`, paddingBottom: 8 }}>Submitted By</div>
          {f.submissionMode === 'group' ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {(f.groupMembers || []).map((m, i) => (
                <div key={m.id} style={{ color: "#0f172a", fontSize: 13, lineHeight: 1.2 }}>
                  <strong style={{ fontWeight: 700 }}>{i + 1}. {m.name}</strong> <span style={{ color: theme.mute }}>(ID: {m.studentId})</span>
                </div>
              ))}
              <div style={{ color: theme.mute, fontSize: 12, marginTop: 4, paddingTop: 6, borderTop: `1px dashed ${border}` }}>Sec: {f.section} &bull; Sem: {f.semester}</div>
            </div>
          ) : (
            <>
              <div style={{ color: "#0f172a", fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{f.studentName}</div>
              <div style={{ color: theme.mute, fontSize: 13, marginBottom: 4 }}>ID: {f.studentId}</div>
              <div style={{ color: theme.mute, fontSize: 13, marginBottom: 4 }}>Sec: {f.section} &bull; Sem: {f.semester}</div>
              <div style={{ color: theme.mute, fontSize: 13 }}>{f.department}</div>
            </>
          )}
        </div>
      </div>

      <div style={{ border: `1px solid ${border}`, borderRadius: theme.radius, background: dateBg, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 10, letterSpacing: 2, color: dateLabel, fontWeight: 700, textTransform: "uppercase" }}>Submission Date</span>
        <span style={{ fontSize: 18, color: dateColor, fontWeight: 800 }}>{f.submissionDate}</span>
      </div>
    </div>
  );
}

function CenterHeader({ form: f, palette: p, theme }) {
  return (
    <div style={{ textAlign: "center", marginBottom: 24, marginTop: theme.headerOffset, fontFamily: baseTheme.font }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}><Logo form={f} color={p.primary} size={96} /></div>
      <div style={{ fontSize: 42, color: p.primary, fontWeight: 700 }}>{f.university}</div>
      <div style={{ marginTop: 4, fontSize: 18, color: "#64748b", fontStyle: "italic", fontFamily: cleanFont }}>Department of <span style={{fontWeight: 600}}>{f.department}</span></div>
      <div style={{ marginTop: 16, fontSize: 52, letterSpacing: 4, color: p.primary, fontWeight: 700 }}>{f.coverType}</div>
    </div>
  );
}

export function CoverPage({ form, palette, theme }) {
  if (theme.deco === "du_official") return <DUOfficialLayout form={form} palette={palette} />;
  if (theme.deco === "diu_official") return <DIUOfficialLayout form={form} palette={palette} />;
  if (theme.deco === "ju_official") return <JUOfficialLayout form={form} palette={palette} />;
  if (theme.deco === "modern_tech") return <PolishedModernLayout form={form} palette={palette} />;
  if (theme.deco === "modern_luxury") return <ModernLuxuryLayout form={form} palette={palette} />;
  if (theme.deco === "bold_geometric") return <BoldGeometricLayout form={form} palette={palette} />;

  if (theme.deco === "rajshahi") {
    return (
      <div style={{ width: 794, minHeight: 1123, background: theme.pageBg, fontFamily: baseTheme.font, position: "relative", overflow: "hidden", boxSizing: "border-box" }}>
        <CenterWatermark form={form} palette={palette} />
        <div style={{ padding: "40px 48px", position: "relative", zIndex: 1 }}>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ marginBottom: 12, display:"flex", justifyContent:"center" }}><Logo form={form} color={palette.primary} size={100} /></div>
            <div style={{ fontSize: 48, color: palette.primary, fontWeight: 700 }}>{form.university}</div>
            <div style={{ fontSize: 36, color: "#0f172a", marginTop: 12, fontWeight: 700 }}>{form.coverType}</div>
            <div style={{ marginTop: 16, fontSize: 18, fontFamily: cleanFont, color: "#475569" }}><strong style={{color:"#0f172a", marginRight: 8}}>Course Name:</strong> {form.courseTitle}</div>
            <div style={{ marginTop: 6, fontSize: 16, fontFamily: cleanFont, color: "#475569" }}><strong style={{color:"#0f172a", marginRight: 8}}>Course No:</strong> {form.courseCode}</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", marginTop: 32, border: "1px solid #cbd5e1", borderRadius: 8, overflow: "hidden", fontFamily: cleanFont }}>
            <div style={{ padding: "24px", background: "#fff" }}>
              <div style={{ textAlign: "center", fontSize: 11, letterSpacing: 1.5, color: "#64748b", textTransform: "uppercase", marginBottom: 16, fontWeight: 700 }}>Submitted To</div>
              <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8, textAlign: "center", color: "#0f172a" }}>{form.teacherName}</div>
              <div style={{textAlign: "center"}}>
                <div style={{ fontSize: 13, color: "#475569", marginBottom: 4 }}>{form.teacherDesignation}</div>
                <div style={{ fontSize: 13, color: "#475569", marginBottom: 4 }}>{form.teacherDept}</div>
                <div style={{ fontSize: 13, color: "#475569", marginBottom: 4 }}>{form.university}</div>
              </div>
            </div>
            <div style={{ padding: "24px", borderLeft: "1px solid #cbd5e1", background: "#fff" }}>
              <div style={{ textAlign: "center", fontSize: 11, letterSpacing: 1.5, color: "#64748b", textTransform: "uppercase", marginBottom: 16, fontWeight: 700 }}>Submitted By</div>
              {form.submissionMode === 'group' ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", textAlign: "left", paddingLeft: "12px" }}>
                  {(form.groupMembers || []).map((m, idx) => (
                    <div key={m.id} style={{ fontSize: 13, color: "#0f172a", lineHeight: 1.2 }}>
                      <strong style={{ fontWeight: 700 }}>{idx + 1}. {m.name}</strong> <span style={{ color: "#64748b" }}>(ID: {m.studentId})</span>
                    </div>
                  ))}
                  <div style={{ fontSize: 12, color: "#475569", marginTop: 4, paddingTop: 6, borderTop: "1px dashed #cbd5e1", textAlign: "center", marginLeft: "-12px" }}>Sec: {form.section} &bull; Sem: {form.semester}</div>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8, textAlign: "center", color: "#0f172a" }}>{form.studentName}</div>
                  <div style={{textAlign: "center"}}>
                    <div style={{ fontSize: 13, color: "#475569", marginBottom: 4 }}>ID: {form.studentId}</div>
                    <div style={{ fontSize: 13, color: "#475569", marginBottom: 4 }}>Sec: {form.section} &bull; Sem: {form.semester}</div>
                    <div style={{ fontSize: 13, color: "#475569", marginBottom: 4 }}>{form.department}</div>
                  </div>
                </>
              )}
            </div>
          </div>
          <div style={{ marginTop: 30, fontSize: 16, color: "#0f172a", fontWeight: "bold", textAlign: "center", fontFamily: cleanFont }}>Date of Submission: <span style={{color: palette.primary}}>{form.submissionDate}</span></div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: 794, minHeight: 1123, background: theme.pageBg, fontFamily: baseTheme.font, position: "relative", overflow: "hidden", border: theme.border ? `${theme.border} ${palette.primary}` : "none", boxSizing: "border-box" }}>
      {theme.deco === "classic" && <div style={{ height: 16, background: `linear-gradient(90deg, ${palette.primary} 0%, ${palette.primary} 62%, ${palette.accent} 62%, ${palette.accent} 70%, #d6b16a 70%, #d6b16a 100%)` }} />}
      {theme.deco === "southeast" && (
        <><div style={{ height: 10, background: palette.primary }} /><div style={{ display: "flex", justifyContent: "center", marginTop: 24 }}><div style={{ background: palette.primary, color: "#fff", borderRadius: 8, fontSize: 18, padding: "12px 32px", fontWeight: 700, fontFamily: cleanFont, letterSpacing: 1 }}>Assignment On {form.courseTitle}</div></div></>
      )}
      {theme.deco === "dhaka" && (
        <><div style={{ position: "absolute", inset: 24, border: "1px solid #bcbcbc" }} /><div style={{ position: "absolute", top: 220, left: 70, right: 70, height: 1, background: "#cbd5e1" }} /></>
      )}
      {theme.deco === "wave" && (
        <><div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 170, background: "linear-gradient(160deg, #dfece3 0%, #eef6f0 58%, #f8faf8 100%)" }} /><div style={{ position: "absolute", top: 110, left: -40, width: 920, height: 78, borderRadius: "50%", borderTop: `4px solid ${palette.accent}55` }} /></>
      )}
      {theme.deco === "frame" && (
        <div style={{ position: "absolute", inset: 22, border: `12px solid ${palette.primary}`, padding: 16, boxSizing: "border-box" }}><div style={{ height: "100%", border: "1px solid #c7a96b" }} /></div>
      )}
      {theme.deco === "minimal" && (
        <div style={{ position: "absolute", inset: 24, border: `2px solid ${palette.primary}`, padding: 6, boxSizing: "border-box" }}><div style={{ height: "100%", border: `1px solid ${palette.primary}40` }} /></div>
      )}
      {theme.deco === "print" && <div style={{ position: "absolute", inset: 18, border: "1px solid #cbd5e1", boxSizing: "border-box", borderRadius: 6 }} />}
      {theme.deco === "organic" && (
        <><div style={{ position: "absolute", top: -120, left: -80, width: 980, height: 280, borderRadius: "50%", background: `radial-gradient(ellipse at center, ${palette.accent}28 0%, ${palette.accent}10 45%, transparent 80%)` }} /><div style={{ position: "absolute", top: 40, left: 0, right: 0, height: 90, borderRadius: "50%", borderTop: `2px solid ${palette.secondary}2f` }} /></>
      )}
      <CenterWatermark form={form} palette={palette} />

      <div style={{ padding: "40px 50px", position: "relative", zIndex: 1 }}>
        {theme.deco === "dhaka" ? (
          <div style={{ textAlign: "center", marginTop: 24, marginBottom: 30 }}>
            <div style={{ fontSize: 50, fontWeight: 700, marginBottom: 16 }}>{form.university}</div>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}><Logo form={form} color={palette.primary} size={96} /></div>
            <div style={{ fontSize: 13, letterSpacing: 2, marginBottom: 8, fontFamily: cleanFont, color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Assignment on</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: palette.primary }}>{form.topicName}</div>
          </div>
        ) : (
          <CenterHeader form={form} palette={palette} theme={theme} />
        )}
        <ContentBlocks form={form} palette={palette} theme={theme} />
      </div>
    </div>
  );
}

function InputField({ label, field, multiline = false, form, updateForm }) {
  return (
    <div style={{ marginBottom: 13 }}>
      <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#64748b", letterSpacing: 1.2, marginBottom: 5 }}>{label}</label>
      {multiline ? (
        <textarea value={form[field]} onChange={(e) => updateForm(field, e.target.value)} rows={3} style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1.5px solid #dbe2ea", fontSize: 12.5, resize: "vertical", boxSizing: "border-box", background: "#f8fafc" }} />
      ) : (
        <input type="text" value={form[field]} onChange={(e) => updateForm(field, e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1.5px solid #dbe2ea", fontSize: 12.5, boxSizing: "border-box", background: "#f8fafc" }} />
      )}
    </div>
  );
}

const getSavedDraft = () => {
  try {
    const saved = localStorage.getItem("covercraft_draft");
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error("Failed to load draft", e);
  }
  return null;
};

export default function CoverDesigner() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { width, isMobile, isTablet } = useViewport();
  const exportRef = useRef(null);
  const csvInputRef = useRef(null);
  
  const draft = getSavedDraft();
  const safeForm = draft?.form ? {
    ...defaultForm,
    ...draft.form,
    submissionMode: draft.form.submissionMode || "individual",
    groupMembers: draft.form.groupMembers && draft.form.groupMembers.length > 0 ? draft.form.groupMembers : defaultForm.groupMembers
  } : defaultForm;

  const [form, setForm] = useState(safeForm);
  const [templates, setTemplates] = useState(TEMPLATES);
  const [palettes, setPalettes] = useState(COLOR_PALETTES);
  const [selectedTemplate, setSelectedTemplate] = useState(draft?.selectedTemplate || 1);
  const [selectedPalette, setSelectedPalette] = useState(draft?.selectedPalette || "blue");
  
  const [activeTab, setActiveTab] = useState("university"); 
  const [universities, setUniversities] = useState([]);
  const [statusMessage, setStatusMessage] = useState(draft ? "Draft restored automatically." : "");
  const [isSaving, setIsSaving] = useState(false);
  const [batchStudents, setBatchStudents] = useState([]); 

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem("covercraft_draft", JSON.stringify({ form, selectedTemplate, selectedPalette }));
    }, 1000);
    return () => clearTimeout(timeoutId);
  }, [form, selectedTemplate, selectedPalette]);

  useEffect(() => {
    const boot = async () => {
      try {
        const [profileRes, templateRes, universityRes] = await Promise.all([getProfile(), getTemplates(), getUniversities()]);
        if (profileRes?.data) {
          const profile = profileRes.data;
          setForm((prev) => {
            const currentMembers = prev.groupMembers && prev.groupMembers.length > 0 ? prev.groupMembers : defaultForm.groupMembers;
            
            // 🚀 FIXED: Array spreading bug (changed currentMembers to currentMembers)
            const seededGroupMembers = [
              { ...currentMembers, name: profile.user?.name || user?.name || currentMembers.name, studentId: profile.studentId || currentMembers.studentId },
              ...currentMembers.slice(1)
            ];
            
            return {
              ...prev,
              studentName: profile.user?.name || user?.name || prev.studentName,
              studentId: profile.studentId || prev.studentId,
              department: profile.department || prev.department,
              semester: profile.semester || prev.semester,
              university: profile.university?.name || prev.university,
              shortName: profile.university?.shortName || prev.shortName,
              logoUrl: profile.university?.logoUrl || prev.logoUrl,
              groupMembers: seededGroupMembers,
            };
          });
        }
        if (templateRes?.data?.palettes?.length) {
          const normalized = templateRes.data.palettes.map((p) => ({
            id: String(p.id || "").trim(), name: p.name || "Custom", primary: p.primary || "#1a3a6b", secondary: p.secondary || "#2563eb", accent: p.accent || "#60a5fa", bg: p.bg || p.background || "#f0f5ff",
          }));
          if (normalized.length) setPalettes(normalized);
        }
        if (Array.isArray(universityRes?.data)) setUniversities(universityRes.data);
      } catch { 
        // fallback
      }
    };
    boot();
  }, [user?.name]);

  useEffect(() => {
    if (!universities.length) return;
    const matched = resolveUniversity(form.university, form.shortName, universities);
    if (!matched) return;
    setForm((prev) => {
      const nextU = matched.name || prev.university;
      const nextS = matched.shortName || prev.shortName;
      const nextL = matched.logoUrl || prev.logoUrl;
      if (prev.university === nextU && prev.shortName === nextS && prev.logoUrl === nextL) return prev;
      return { ...prev, university: nextU, shortName: nextS, logoUrl: nextL };
    });
  }, [form.university, form.shortName, universities]);

  // 🚀 FIXED: Fallback array/object bug
  const palette = palettes.find((x) => x.id === selectedPalette) || palettes;
  const theme = THEMES[selectedTemplate] || THEMES;
  
  const sidebarWidth = isMobile ? "100%" : 326;
  const previewAvailableWidth = Math.max(320, width - (isMobile ? 24 : isTablet ? 380 : 420));
  const rawScale = previewAvailableWidth / 794;
  const previewScale = isMobile ? Math.min(1, rawScale) : isTablet ? Math.min(0.64, rawScale) : Math.min(0.71, rawScale);

  const updateForm = (key, value) => { setForm((prev) => ({ ...prev, [key]: value })); setStatusMessage(""); };

  const updateGroupMember = (id, field, value) => {
    setForm(prev => ({ ...prev, groupMembers: (prev.groupMembers || []).map(m => m.id === id ? { ...m, [field]: value } : m) }));
  };
  const addGroupMember = () => {
    setForm(prev => {
      const members = prev.groupMembers || [];
      if(members.length >= 5) return prev;
      return { ...prev, groupMembers: [...members, { id: Date.now(), name: "", studentId: "" }] };
    });
  };
  const removeGroupMember = (id) => {
    setForm(prev => ({ ...prev, groupMembers: (prev.groupMembers || []).filter(m => m.id !== id) }));
  };

  const handleClearDraft = () => {
    if(window.confirm("Are you sure you want to clear your current progress and start fresh?")) {
      localStorage.removeItem("covercraft_draft");
      setForm(defaultForm);
      setSelectedTemplate(1);
      setSelectedPalette("blue");
      setStatusMessage("Draft cleared. Started fresh.");
    }
  };

  const handleCsvSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setStatusMessage("❌ No file selected.");
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => setStatusMessage("❌ Failed to read CSV file.");

    reader.onload = (event) => {
      try {
        const rows = parseCsvText(event.target?.result);

        if (rows.length < 2) {
           setStatusMessage("❌ CSV is empty or missing data rows.");
           return;
        }

        const headers = (rows || []).map((h) =>
          String(h || "")
            .replace(/^\uFEFF/, "")
            .toLowerCase()
            .trim()
        );

        const nameIdx = headers.findIndex((h) => h.includes("name") || h.includes("student"));
        const idIdx = headers.findIndex((h) => h.includes("id") || h.includes("roll"));
        const secIdx = headers.findIndex((h) => h.includes("sec"));

        if (nameIdx === -1 || idIdx === -1) {
           setStatusMessage("❌ ERROR: CSV must have 'Name' and 'ID' columns.");
           return;
        }

        const students = [];
        for (let i = 1; i < rows.length; i++) {
           const cols = rows[i] || [];
           if ((cols[nameIdx] || "").trim() && (cols[idIdx] || "").trim()) {
              students.push({
                 studentName: String(cols[nameIdx] || "").trim(),
                 studentId: String(cols[idIdx] || "").trim(),
                 section: secIdx !== -1 && (cols[secIdx] || "").trim() ? String(cols[secIdx]).trim() : form.section
              });
           }
        }

        if (students.length === 0) {
           setStatusMessage("❌ No valid student data found in CSV.");
           return;
        }
        if (students.length > 30) {
           setStatusMessage(`⚠️ Found ${students.length} students. Max 30 allowed per batch!`);
           return;
        }

        setBatchStudents(students);
        setStatusMessage(`✅ ${students.length} students loaded!`);
        
      } catch (err) {
        console.error(err);
        setStatusMessage("❌ Failed to parse CSV file.");
      }
    };
    reader.readAsText(file);
  };

  const handleBatchDownload = async () => {
    if (batchStudents.length === 0) return;
    
    setIsSaving(true);
    setStatusMessage(`📦 Processing ${batchStudents.length} covers... This will take a minute!`);
    
    try {
       const payload = {
          templateId: String(selectedTemplate),
          paletteId: selectedPalette,
          baseData: form,
          students: batchStudents
       };
       const response = await generateBatchCovers(payload);

       const contentType = String(response?.headers?.["content-type"] || "");
       const isZip = contentType.includes("application/zip");

       if (!isZip && response?.data instanceof Blob) {
         const errText = await response.data.text();
         try {
           const parsed = JSON.parse(errText);
           throw new Error(parsed?.message || "Batch generation failed.");
         } catch {
           throw new Error(errText || "Batch generation failed.");
         }
       }

       const blob = response?.data instanceof Blob ? response.data : new Blob([response.data], { type: "application/zip" });
       const url = window.URL.createObjectURL(blob);
       const a = document.createElement("a");
       a.href = url;
       a.download = `Batch_Covers_${form.courseCode || "Course"}.zip`;
       document.body.appendChild(a);
       a.click();
       a.remove();
       setTimeout(() => window.URL.revokeObjectURL(url), 1000);
       
       setStatusMessage(`✅ Successfully downloaded ${batchStudents.length} covers in a ZIP!`);
       setBatchStudents([]); 
    } catch(err) {
       const reason = err?.message || "Batch generation failed. Server might have timed out.";
       setStatusMessage(`❌ ${reason}`);
    } finally {
       setIsSaving(false);
    }
  };

  const downloadSampleCsv = () => {
    const csvContent = "Name, ID, Section\nShakin Ahammed, 241-15-111, 66 - L2\nJohn Doe, 241-15-112, 66 - L2";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "CoverCraft_Batch_Sample.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleShareLink = async () => {
    setIsSaving(true);
    setStatusMessage("Generating shareable link...");
    try {
      const res = await generateCover({ templateId: String(selectedTemplate), paletteId: selectedPalette, coverData: form });
      const coverId = res.data?.cover?.id;
      if (!coverId) throw new Error("Could not retrieve Cover ID");
      const shareUrl = `${window.location.origin}/share/${coverId}`;
      await navigator.clipboard.writeText(shareUrl);
      setStatusMessage("✅ Link copied to clipboard! Share it with your friends.");
    } catch (error) {
      setStatusMessage("❌ Failed to generate link.");
    } finally { setIsSaving(false); }
  };

  const handleDownloadPdf = async () => {
    setIsSaving(true);
    setStatusMessage("Saving cover data...");
    try {
      const res = await generateCover({ templateId: String(selectedTemplate), paletteId: selectedPalette, coverData: form });
      const coverId = res.data?.cover?.id;
      if (!coverId) throw new Error("Could not retrieve Cover ID");
      setStatusMessage("Generating high-quality PDF on server... Please wait.");
      const response = await API.get(`/covers/${coverId}/download?format=pdf`, {
        responseType: "blob",
      });
      const blob = response.data instanceof Blob ? response.data : new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `CoverCraft-${form.courseCode || 'Cover'}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setStatusMessage("PDF downloaded successfully!");
    } catch (error) {
      setStatusMessage("PDF export failed. Check server logs.");
    } finally { setIsSaving(false); }
  };

  const handleDownloadPng = async () => {
    if (!exportRef.current) return;
    setIsSaving(true);
    try {
      await generateCover({ templateId: String(selectedTemplate), paletteId: selectedPalette, coverData: form });
      const canvas = await html2canvas(exportRef.current, { scale: 2, useCORS: true, allowTaint: true, backgroundColor: "#ffffff", width: 794, height: 1123 });
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `cover-${Date.now()}.png`;
          a.click();
          URL.revokeObjectURL(url);
          setStatusMessage("PNG downloaded successfully.");
        } else { setStatusMessage("PNG export failed."); }
        setIsSaving(false);
      }, "image/png");
    } catch (error) {
      setStatusMessage("PNG export failed.");
      setIsSaving(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: isMobile ? "column-reverse" : "row", minHeight: "100vh", fontFamily: "'Segoe UI', sans-serif", background: "#edf1f5", overflowX: "hidden" }}>
      <div style={{ width: sidebarWidth, background: "#fff", boxShadow: "2px 0 14px rgba(15, 23, 42, 0.08)", display: "flex", flexDirection: "column", overflow: "hidden", borderTop: isMobile ? "1px solid #e2e8f0" : "none" }}>
        <div style={{ padding: "16px", background: `linear-gradient(135deg, ${palette.primary}, ${palette.secondary})`, color: "#fff", position: "relative" }}>
          <button type="button" onClick={() => navigate("/dashboard")} style={{ border: "1px solid rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.14)", color: "#fff", fontSize: 11, fontWeight: 700, borderRadius: 999, padding: "6px 10px", cursor: "pointer", marginBottom: 10 }}>← Back to Home</button>
          
          <button type="button" onClick={handleClearDraft} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", color: "rgba(255,255,255,0.7)", fontSize: 18, cursor: "pointer" }} title="Reset Design & Clear Draft">🔄</button>

          <div style={{ fontSize: 17, fontWeight: 800 }}>CoverCraft BD</div>
          <div style={{ fontSize: 9.5, opacity: 0.76 }}>15 Academic Templates (Auto-saving...)</div>
        </div>
        <div style={{ padding: "13px 14px", borderBottom: "1px solid #eef2f6" }}>
          <div style={{ fontSize: 9.5, fontWeight: 700, color: "#7c8da1", letterSpacing: 1.4, marginBottom: 8 }}>TEMPLATE</div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(5,1fr)" : "repeat(5,1fr)", gap: 5 }}>
            {templates.map((t) => (
              <button key={t.id} onClick={() => { setSelectedTemplate(t.id); setStatusMessage(""); }} style={{ padding: "7px 0", borderRadius: 6, border: "none", cursor: "pointer", background: selectedTemplate === t.id ? palette.primary : "#eef2f7", color: selectedTemplate === t.id ? "#fff" : "#64748b", fontSize: 11, fontWeight: 700 }}>T{t.id}</button>
            ))}
          </div>
          <div style={{ fontSize: 10, color: "#64748b", marginTop: 6 }}>
            <strong style={{ color: palette.primary }}>{templates.find((x) => x.id === selectedTemplate)?.name}</strong>
            <div>{templates.find((x) => x.id === selectedTemplate)?.desc}</div>
          </div>
        </div>
        <div style={{ padding: "12px 14px", borderBottom: "1px solid #eef2f6" }}>
          <div style={{ fontSize: 9.5, fontWeight: 700, color: "#7c8da1", letterSpacing: 1.4, marginBottom: 8 }}>COLOR PALETTE</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {palettes.map((x) => (
              <button key={x.id} onClick={() => { setSelectedPalette(x.id); setStatusMessage(""); }} style={{ width: 27, height: 27, borderRadius: "50%", border: selectedPalette === x.id ? "2px solid #0f172a" : "2px solid transparent", background: `linear-gradient(135deg, ${x.primary}, ${x.secondary})`, cursor: "pointer" }} />
            ))}
          </div>
        </div>
        <div style={{ display: "flex", borderBottom: "1px solid #eef2f6" }}>
          {[["university", "University"], ["course", "Course"], ["people", "People"]].map(([id, label]) => (
            <button key={id} onClick={() => setActiveTab(id)} style={{ flex: 1, padding: "9px 3px", border: "none", cursor: "pointer", background: activeTab === id ? "#fff" : "#f8fafc", color: activeTab === id ? palette.primary : "#7c8da1", fontSize: 10.8, fontWeight: activeTab === id ? 800 : 600 }}>{label}</button>
          ))}
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "13px 14px" }}>
          {activeTab === "university" && (<><InputField label="UNIVERSITY NAME" field="university" form={form} updateForm={updateForm} /><InputField label="SHORT NAME" field="shortName" form={form} updateForm={updateForm} /><InputField label="DEPARTMENT" field="department" form={form} updateForm={updateForm} /><InputField label="COVER TYPE" field="coverType" form={form} updateForm={updateForm} /></>)}
          {activeTab === "course" && (<><InputField label="TOPIC NO." field="topicNo" form={form} updateForm={updateForm} /><InputField label="TOPIC NAME" field="topicName" multiline form={form} updateForm={updateForm} /><InputField label="COURSE CODE" field="courseCode" form={form} updateForm={updateForm} /><InputField label="COURSE TITLE" field="courseTitle" form={form} updateForm={updateForm} /><InputField label="SUBMISSION DATE" field="submissionDate" form={form} updateForm={updateForm} /></>)}
          {activeTab === "people" && (
            <>
              <InputField label="TEACHER NAME" field="teacherName" form={form} updateForm={updateForm} />
              <InputField label="TEACHER DESIGNATION" field="teacherDesignation" form={form} updateForm={updateForm} />
              <InputField label="TEACHER DEPARTMENT" field="teacherDept" form={form} updateForm={updateForm} />
              
              <div style={{ margin: "24px 0 16px", borderBottom: "1px solid #e2e8f0" }} />

              <div style={{ display: "flex", background: "#f1f5f9", borderRadius: 8, padding: 4, marginBottom: 16 }}>
                <button onClick={() => updateForm("submissionMode", "individual")} style={{ flex: 1, padding: "8px", border: "none", borderRadius: 6, background: form.submissionMode === "individual" ? "#fff" : "transparent", boxShadow: form.submissionMode === "individual" ? "0 2px 4px rgba(0,0,0,0.05)" : "none", color: form.submissionMode === "individual" ? palette.primary : "#64748b", fontWeight: 700, fontSize: 11, cursor: "pointer", transition: "all 0.2s" }}>👤 Individual</button>
                <button onClick={() => updateForm("submissionMode", "group")} style={{ flex: 1, padding: "8px", border: "none", borderRadius: 6, background: form.submissionMode === "group" ? "#fff" : "transparent", boxShadow: form.submissionMode === "group" ? "0 2px 4px rgba(0,0,0,0.05)" : "none", color: form.submissionMode === "group" ? palette.primary : "#64748b", fontWeight: 700, fontSize: 11, cursor: "pointer", transition: "all 0.2s" }}>👥 Group</button>
              </div>

              {form.submissionMode === "group" ? (
                <div style={{ marginBottom: 16, background: "#f8fafc", padding: "12px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 10, letterSpacing: 1 }}>GROUP MEMBERS (MAX 5)</div>
                  {(form.groupMembers || []).map((m, i) => (
                    <div key={m.id} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                      <div style={{ flex: 2 }}>
                        <input type="text" placeholder="Name" value={m.name} onChange={(e) => updateGroupMember(m.id, 'name', e.target.value)} style={{ width: "100%", padding: "8px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 11, boxSizing: "border-box" }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <input type="text" placeholder="ID" value={m.studentId} onChange={(e) => updateGroupMember(m.id, 'studentId', e.target.value)} style={{ width: "100%", padding: "8px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 11, boxSizing: "border-box" }} />
                      </div>
                      {(form.groupMembers || []).length > 1 && (
                        <button onClick={() => removeGroupMember(m.id)} style={{ width: 28, height: 32, background: "#fee2e2", color: "#ef4444", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                      )}
                    </div>
                  ))}
                  {(form.groupMembers || []).length < 5 && (
                    <button onClick={addGroupMember} style={{ width: "100%", padding: "8px", background: "#e0e7ff", color: palette.primary, border: `1px dashed ${palette.primary}60`, borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 700, marginTop: 4 }}>+ Add New Member</button>
                  )}
                </div>
              ) : (
                <>
                  <InputField label="STUDENT NAME" field="studentName" form={form} updateForm={updateForm} />
                  <InputField label="STUDENT ID" field="studentId" form={form} updateForm={updateForm} />
                </>
              )}

              <InputField label="SECTION" field="section" form={form} updateForm={updateForm} />
              <InputField label="SEMESTER" field="semester" form={form} updateForm={updateForm} />
            </>
          )}
        </div>
        
        <div style={{ padding: "12px 14px", borderTop: "1px solid #eef2f6", display: "flex", flexDirection: "column", gap: 8 }}>
          <button onClick={handleShareLink} disabled={isSaving} style={{ width: "100%", padding: 10, borderRadius: 7, border: `2px dashed ${palette.primary}`, background: "#f8fafc", color: palette.primary, fontWeight: 800, cursor: isSaving ? "not-allowed" : "pointer" }}>
            {isSaving ? "Wait..." : "🔗 Copy Share Link"}
          </button>
          
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleDownloadPdf} disabled={isSaving} style={{ flex: 1, padding: 10, borderRadius: 7, border: "none", background: `linear-gradient(135deg, ${palette.primary}, ${palette.secondary})`, color: "#fff", fontWeight: 700, cursor: isSaving ? "not-allowed" : "pointer" }}>Download PDF</button>
            <button onClick={handleDownloadPng} disabled={isSaving} style={{ flex: 1, padding: 10, borderRadius: 7, border: `2px solid ${palette.primary}`, background: "#fff", color: palette.primary, fontWeight: 700, cursor: isSaving ? "not-allowed" : "pointer" }}>Save PNG</button>
          </div>

          <div style={{ marginTop: 6, padding: 12, background: "#f8fafc", borderRadius: 8, border: "1px dashed #cbd5e1" }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: "#64748b", marginBottom: 8, letterSpacing: 1.5 }}>CR SPECIAL (BATCH MODE)</div>
            
            {batchStudents.length === 0 ? (
              <button onClick={() => {
                if (csvInputRef.current) csvInputRef.current.value = ""; 
                csvInputRef.current?.click();
              }} disabled={isSaving} style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #0f172a", background: "#fff", color: "#0f172a", fontSize: 12, fontWeight: 700, cursor: isSaving ? "not-allowed" : "pointer" }}>
                📁 1. Upload CSV File
              </button>
            ) : (
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setBatchStudents([])} disabled={isSaving} style={{ width: "30%", padding: 10, borderRadius: 6, border: "1px solid #ef4444", background: "#fff", color: "#ef4444", fontSize: 12, fontWeight: 700, cursor: isSaving ? "not-allowed" : "pointer" }}>
                  Cancel
                </button>
                <button onClick={handleBatchDownload} disabled={isSaving} style={{ width: "70%", padding: 10, borderRadius: 6, border: "none", background: "#0f172a", color: "#fff", fontSize: 12, fontWeight: 700, cursor: isSaving ? "not-allowed" : "pointer", boxShadow: "0 4px 6px rgba(15, 23, 42, 0.2)" }}>
                  📦 2. Get ZIP ({batchStudents.length})
                </button>
              </div>
            )}

            <button onClick={downloadSampleCsv} style={{ background: "none", border: "none", color: palette.primary, fontSize: 11, cursor: "pointer", marginTop: 8, width: "100%", textDecoration: "underline" }}>Download Sample CSV</button>
            <input type="file" accept=".csv" ref={csvInputRef} style={{ display: "none" }} onChange={handleCsvSelect} />
          </div>
        </div>
        
        {statusMessage && <div style={{ padding: "8px 14px 12px", fontSize: 11, color: statusMessage.includes("❌") ? "#ef4444" : "#0f172a", fontWeight: "bold", borderTop: "1px solid #f5f5f5", textAlign: "center" }}>{statusMessage}</div>}
      </div>

      <div style={{ flex: 1, minWidth: 0, overflow: "auto", padding: isMobile ? "14px 8px 12px" : "22px 28px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ marginBottom: 14, fontSize: 10.5, color: "#9aa7b7", letterSpacing: 2, fontWeight: 700 }}>LIVE PREVIEW - A4 FORMAT</div>
        <div style={{ transform: `scale(${previewScale})`, transformOrigin: "top center", boxShadow: "0 24px 70px rgba(0,0,0,0.16)", marginBottom: isMobile ? 14 : -320, transition: "transform 0.15s ease" }}>
          <CoverPage form={form} palette={palette} theme={theme} />
        </div>
      </div>

      <div style={{ position: "fixed", top: -9999, left: -9999, width: 794, height: 1123, overflow: "hidden" }}>
        <div ref={exportRef} xmlns="http://www.w3.org/1999/xhtml">
          <CoverPage form={form} palette={palette} theme={theme} />
        </div>
      </div>
    </div>
  );
}
