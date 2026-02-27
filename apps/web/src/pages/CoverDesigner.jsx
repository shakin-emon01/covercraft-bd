import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { generateCover, getProfile, getTemplates, getUniversities } from "../api/auth";
import { useViewport } from "../hooks/useViewport";
import html2canvas from "html2canvas";

const TEMPLATES = [
  { id: 1, name: "Academic Precision", desc: "Formal serif cover inspired by classic sample style" },
  { id: 2, name: "Sophisticated Student", desc: "Soft elegant wave and premium academic composition" },
  { id: 3, name: "Polished Modern Tech", desc: "Modern sidebar + card-based system" },
  { id: 4, name: "Classic Scholarly Frame", desc: "Framed scholarly look with heritage aesthetics" },
  { id: 5, name: "Minimal Academic Prestige", desc: "Double-line minimal premium print layout" },
  { id: 6, name: "Modern Luxury Academic", desc: "Clean luxury heading with refined section spacing" },
  { id: 7, name: "Bold Geometric Academic", desc: "Strong geometric accents and modern hierarchy" },
  { id: 8, name: "Organic Academic Elegance", desc: "Nature-inspired smooth curves and soft structure" },
  { id: 9, name: "Southeast Ribbon", desc: "Blue bordered assignment style with bold title ribbon and clean subject boxes" },
  { id: 10, name: "Dhaka Heritage", desc: "Classic monochrome composition with center alignment and formal typography" },
  { id: 11, name: "Rajshahi Split Panel", desc: "Two-column submitted-by/submitted-to table layout with compact hierarchy" },
  { id: 12, name: "Leading Emerald", desc: "Green framed layout with alternating information cards and bright title badge" },
  { id: 13, name: "Minimal Gray Print", desc: "Soft gray printable structure for assignment and lab report covers" },
];

const COLOR_PALETTES = [
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
  university: "Daffodil International University",
  shortName: "DIU",
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
  studentName: "Shakin Ahammed Emon",
  studentId: "241-15-111",
  section: "66 - L2",
  semester: "Spring '26",
  submissionDate: "02.02.2026",
};

const baseTheme = {
  font: "'Cormorant Garamond', Georgia, serif",
  pageBg: "#f8f8f8",
  border: null,
  cardBg: "#ffffff",
  text: "#111827",
  mute: "#334155",
  radius: 10,
  labelColor: null,
  boxBorder: null,
  dateBg: null,
  dateColor: null,
  headerOffset: 0,
};

const THEMES = {
  1: {
    ...baseTheme,
    pageBg: "#f4f4f2",
    border: "2px solid",
    radius: 2,
    headerOffset: 6,
    deco: "classic",
  },
  2: {
    ...baseTheme,
    pageBg: "#f8faf8",
    radius: 14,
    cardBg: "#ffffffdb",
    deco: "wave",
  },
  3: {
    ...baseTheme,
    font: "'Manrope', 'Segoe UI', sans-serif",
    pageBg: "#f6f8fc",
    cardBg: "#eef3fa",
    labelColor: "#64748b",
    boxBorder: "#dbe3ef",
    dateBg: "sidebar",
    deco: "sidebar",
  },
  4: {
    ...baseTheme,
    pageBg: "#f5f3ed",
    radius: 0,
    cardBg: "#fffdf7",
    boxBorder: "#d5b67d",
    labelColor: "#9a7c45",
    deco: "frame",
  },
  5: {
    ...baseTheme,
    pageBg: "#f9fafb",
    radius: 0,
    deco: "minimal",
  },
  6: {
    ...baseTheme,
    pageBg: "#fcfbf8",
    radius: 0,
    boxBorder: "#dcc6a1",
    labelColor: "#8b6d3d",
    cardBg: "#fffdfa",
    deco: "luxury",
  },
  7: {
    ...baseTheme,
    font: "'Manrope', 'Segoe UI', sans-serif",
    pageBg: "#f7f9fb",
    radius: 6,
    cardBg: "#ffffffec",
    boxBorder: "#cbd5e1",
    deco: "geometric",
  },
  8: {
    ...baseTheme,
    pageBg: "#f8fbf7",
    radius: 13,
    cardBg: "#ffffffd6",
    boxBorder: null,
    deco: "organic",
  },
  9: {
    ...baseTheme,
    pageBg: "#f3f5fb",
    border: "2px solid",
    radius: 14,
    headerOffset: 6,
    deco: "southeast",
  },
  10: {
    ...baseTheme,
    pageBg: "#f8f8f8",
    radius: 0,
    cardBg: "#ffffff",
    boxBorder: "#d6d6d6",
    deco: "dhaka",
  },
  11: {
    ...baseTheme,
    pageBg: "#f9fafb",
    radius: 0,
    cardBg: "#ffffff",
    labelColor: "#0f172a",
    boxBorder: "#b8b8b8",
    dateColor: "#0f172a",
    deco: "rajshahi",
  },
  12: {
    ...baseTheme,
    font: "'Times New Roman', Georgia, serif",
    pageBg: "#f9fcf9",
    border: "3px solid",
    radius: 0,
    cardBg: "#ffffff",
    boxBorder: "#00000066",
    labelColor: "#0f8a4b",
    deco: "leading",
  },
  13: {
    ...baseTheme,
    pageBg: "#f2f3f5",
    radius: 4,
    boxBorder: "#bfc4cf",
    labelColor: "#334155",
    deco: "print",
  },
};

const normalize = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");

const resolveUniversity = (name, shortName, universities) => {
  if (!universities.length) return null;

  const normalizedName = normalize(name);
  const normalizedShort = normalize(shortName);

  if (!normalizedName && !normalizedShort) return null;

  const exactMatch = universities.find((uni) => normalize(uni.name) === normalizedName || normalize(uni.shortName) === normalizedShort);
  if (exactMatch) return exactMatch;

  if (normalizedName) {
    const possible = universities.filter((uni) => normalize(uni.name).includes(normalizedName) || normalizedName.includes(normalize(uni.name)));
    if (possible.length === 1) return possible[0];
  }

  if (normalizedShort) {
    const possible = universities.filter((uni) => normalize(uni.shortName) === normalizedShort || normalize(uni.shortName).includes(normalizedShort));
    if (possible.length === 1) return possible[0];
  }

  return null;
};

function OnlineLogoImage({ src, alt, style, fallback = null }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) return fallback;

  return <img src={src} alt={alt} style={style} crossOrigin="anonymous" onError={() => setFailed(true)} />;
}

function Logo({ form, color, rounded = true, size = 88 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: rounded ? "50%" : 12, border: `2px solid ${color}`, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      {form.logoUrl ? (
        <OnlineLogoImage
          src={form.logoUrl}
          alt="University logo"
          style={{ width: "82%", height: "82%", objectFit: "contain" }}
          fallback={<div style={{ fontSize: 9, fontWeight: 700, textAlign: "center", color }}>UNIVERSITY<br />LOGO</div>}
        />
      ) : (
        <div style={{ fontSize: 9, fontWeight: 700, textAlign: "center", color }}>UNIVERSITY<br />LOGO</div>
      )}
    </div>
  );
}

function CenterWatermark({ form, palette, offsetLeft = "50%", offsetTop = "56%" }) {
  return (
    <div
      style={{
        position: "absolute",
        left: offsetLeft,
        top: offsetTop,
        transform: "translate(-50%, -50%)",
        pointerEvents: "none",
        userSelect: "none",
        zIndex: 0,
      }}
    >
      {form.logoUrl ? (
        <OnlineLogoImage
          src={form.logoUrl}
          alt="Watermark university logo"
          style={{ width: 430, height: 430, objectFit: "contain", opacity: 0.085, filter: "grayscale(20%)" }}
          fallback={<div style={{ fontSize: 190, color: `${palette.primary}08`, fontWeight: 800 }}>{form.shortName}</div>}
        />
      ) : (
        <div style={{ fontSize: 190, color: `${palette.primary}08`, fontWeight: 800 }}>{form.shortName}</div>
      )}
    </div>
  );
}

function ContentBlocks({ form: f, palette: p, theme }) {
  const border = theme.boxBorder || `${p.primary}66`;
  const labelColor = theme.labelColor || p.primary;
  const dateBg = theme.dateBg === "sidebar" ? `linear-gradient(90deg, ${p.primary}, #334155)` : theme.dateBg || theme.cardBg;
  const dateColor = theme.dateBg === "sidebar" ? "#fff" : theme.dateColor || p.primary;
  const dateLabel = theme.dateBg === "sidebar" ? "rgba(255,255,255,0.72)" : theme.mute;

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "66px 1fr", border: `1.6px solid ${border}`, borderRadius: theme.radius, overflow: "hidden", marginBottom: 14, background: theme.cardBg }}>
        <div style={{ borderRight: `1.6px solid ${border}`, padding: "12px 8px", textAlign: "center", background: p.bg }}>
          <div style={{ fontSize: 10, letterSpacing: 1.4, color: theme.mute }}>No.</div>
          <div style={{ fontSize: 23, fontWeight: 800, color: p.primary }}>{f.topicNo}</div>
        </div>
        <div style={{ padding: "12px 16px" }}>
          <div style={{ fontSize: 10, letterSpacing: 2.4, fontWeight: 700, color: labelColor, marginBottom: 6 }}>TOPIC NAME</div>
          <div style={{ fontSize: 14.2, lineHeight: 1.52, color: theme.text }}>{f.topicName}</div>
        </div>
      </div>

      <div style={{ border: `1.6px solid ${border}`, borderRadius: theme.radius, padding: "12px 16px", marginBottom: 14, background: theme.cardBg }}>
        <div style={{ marginBottom: 6 }}>
          <span style={{ fontSize: 10, letterSpacing: 2.4, fontWeight: 700, color: labelColor, marginRight: 8 }}>COURSE CODE</span>
          <span style={{ color: theme.text, fontWeight: 700, fontSize: 25 }}>{f.courseCode}</span>
        </div>
        <div>
          <span style={{ fontSize: 10, letterSpacing: 2.4, fontWeight: 700, color: labelColor, marginRight: 8 }}>COURSE TITLE</span>
          <span style={{ color: theme.text, fontSize: 17 }}>{f.courseTitle}</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        {[
          ["Submitted to:", f.teacherName, [`${f.teacherDesignation}`, f.teacherDept, f.university]],
          ["Submitted by:", f.studentName, [`ID: ${f.studentId}`, `Section: ${f.section}`, `Semester: ${f.semester}`, f.teacherDept]],
        ].map((item, i) => (
          <div key={i} style={{ border: `1.6px solid ${border}`, borderRadius: theme.radius, padding: "12px 14px", background: theme.cardBg }}>
            <div style={{ fontSize: 28, marginBottom: 8, fontStyle: "italic", color: p.primary }}>{item[0]}</div>
            <div style={{ color: theme.text, fontSize: 17, fontWeight: 700, marginBottom: 4 }}>{item[1]}</div>
            {item[2].map((line, idx) => (
              <div key={idx} style={{ color: theme.mute, fontSize: 13.5, marginBottom: 3 }}>{line}</div>
            ))}
          </div>
        ))}
      </div>

      <div style={{ border: `1.6px solid ${border}`, borderRadius: theme.radius, background: dateBg, padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 10.5, letterSpacing: 3, color: dateLabel, fontWeight: 700 }}>SUBMISSION DATE</span>
        <span style={{ fontSize: 24, color: dateColor, fontWeight: 800 }}>{f.submissionDate}</span>
      </div>
    </>
  );
}

function CenterHeader({ form: f, palette: p, theme }) {
  return (
    <div style={{ textAlign: "center", marginBottom: 18, marginTop: theme.headerOffset }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}><Logo form={f} color={p.primary} /></div>
      <div style={{ fontSize: 45, color: p.primary, fontWeight: 700 }}>{f.university}</div>
      <div style={{ marginTop: 3, fontSize: 20, color: "#4b5563", fontStyle: "italic" }}>Department of {f.department}</div>
      <div style={{ marginTop: 12, fontSize: 58, letterSpacing: 3, color: p.primary, fontWeight: 700 }}>{f.coverType}</div>
    </div>
  );
}

function CoverPage({ form, palette, theme }) {
  const borderColor = palette.primary;

  if (theme.deco === "sidebar") {
    return (
      <div style={{ width: 794, minHeight: 1123, display: "flex", background: theme.pageBg, fontFamily: theme.font, overflow: "hidden", position: "relative" }}>
        <CenterWatermark form={form} palette={palette} offsetLeft="64%" offsetTop="58%" />
        <div style={{ width: 184, background: `linear-gradient(180deg, ${palette.primary} 0%, #334155 100%)`, color: "#fff", padding: "34px 16px", position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}><Logo form={form} color="rgba(255,255,255,0.35)" size={98} /></div>
          <div style={{ textAlign: "center", fontSize: 26, fontWeight: 800, letterSpacing: 2 }}>{form.shortName}</div>
          <div style={{ width: 38, height: 2, background: "rgba(255,255,255,0.5)", margin: "9px auto" }} />
          <div style={{ textAlign: "center", fontSize: 14, color: "rgba(255,255,255,0.75)" }}>{form.department}</div>
          <div style={{ position: "absolute", bottom: 40, left: "50%", transform: "translateX(-50%) rotate(-90deg)", fontSize: 16, letterSpacing: 7, color: "rgba(255,255,255,0.2)", fontWeight: 700 }}>{form.coverType}</div>
        </div>
        <div style={{ flex: 1, padding: "38px 32px 30px" }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 40, fontWeight: 800, color: palette.primary }}>{form.university}</div>
            <div style={{ marginTop: 5, width: 82, height: 5, borderRadius: 4, background: `linear-gradient(90deg, ${palette.primary}, ${palette.accent})` }} />
          </div>
          <div style={{ marginBottom: 14, display: "inline-block", background: palette.primary, color: "#fff", borderRadius: 6, padding: "8px 22px", fontSize: 35, fontWeight: 800, letterSpacing: 4 }}>{form.coverType}</div>
          <ContentBlocks form={form} palette={palette} theme={theme} />
        </div>
      </div>
    );
  }

  if (theme.deco === "rajshahi") {
    return (
      <div style={{ width: 794, minHeight: 1123, background: theme.pageBg, fontFamily: "'Times New Roman', Georgia, serif", position: "relative", overflow: "hidden", boxSizing: "border-box" }}>
        <div style={{ padding: "34px 42px 36px", position: "relative", zIndex: 1 }}>
          <div style={{ textAlign: "center", marginBottom: 14 }}>
            <div style={{ marginBottom: 8 }}><Logo form={form} color={palette.primary} size={95} /></div>
            <div style={{ fontSize: 56, color: palette.primary, fontWeight: 700 }}>{form.university}</div>
            <div style={{ fontSize: 38, color: "#0f172a", marginTop: 8, fontWeight: 700 }}>{form.coverType}</div>
            <div style={{ marginTop: 8, fontSize: 26 }}><strong>Course Name:</strong> {form.courseTitle}</div>
            <div style={{ marginTop: 4, fontSize: 24 }}><strong>Course No:</strong> {form.courseCode}</div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", marginTop: 24, border: "1.6px solid #b8b8b8" }}>
            {[
              ["Submitted By", form.studentName, [`Student ID: ${form.studentId}`, `Year: ${form.semester}`, `Section: ${form.section}`, form.department, form.university]],
              ["Submitted To", form.teacherName, [form.teacherDesignation, form.teacherDept, form.university]],
            ].map((item, idx) => (
              <div key={idx} style={{ padding: "16px 14px", borderLeft: idx ? "1.6px solid #b8b8b8" : "none" }}>
                <div style={{ textAlign: "center", fontSize: 29, marginBottom: 10, fontWeight: 700 }}>{item[0]}</div>
                <div style={{ fontSize: 31, fontWeight: 700, marginBottom: 8 }}>{item[1]}</div>
                {item[2].map((line, lineIdx) => (
                  <div key={lineIdx} style={{ fontSize: 22, lineHeight: 1.28 }}>{line}</div>
                ))}
              </div>
            ))}
          </div>

          <div style={{ marginTop: 24, fontSize: 28, color: "#0f172a" }}>Date of Submission: {form.submissionDate}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: 794, minHeight: 1123, background: theme.pageBg, fontFamily: theme.font, position: "relative", overflow: "hidden", border: theme.border ? `${theme.border} ${borderColor}` : "none", boxSizing: "border-box" }}>
      {theme.deco === "classic" && <div style={{ height: 16, background: `linear-gradient(90deg, ${palette.primary} 0%, ${palette.primary} 62%, ${palette.accent} 62%, ${palette.accent} 70%, #d6b16a 70%, #d6b16a 100%)` }} />}
      {theme.deco === "southeast" && (
        <>
          <div style={{ height: 10, background: palette.primary }} />
          <div style={{ display: "flex", justifyContent: "center", marginTop: 18 }}>
            <div style={{ background: palette.primary, color: "#fff", borderRadius: 9, fontSize: 22, padding: "10px 26px", fontWeight: 700, boxShadow: "0 4px 10px rgba(0,0,0,0.12)" }}>Assignment On {form.courseTitle}</div>
          </div>
        </>
      )}
      {theme.deco === "dhaka" && (
        <>
          <div style={{ position: "absolute", inset: 24, border: "1px solid #bcbcbc" }} />
          <div style={{ position: "absolute", top: 208, left: 70, right: 70, height: 2, background: "#a9a9a9" }} />
        </>
      )}
      {theme.deco === "wave" && (
        <>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 170, background: "linear-gradient(160deg, #dfece3 0%, #eef6f0 58%, #f8faf8 100%)" }} />
          <div style={{ position: "absolute", top: 110, left: -40, width: 920, height: 78, borderRadius: "50%", borderTop: `4px solid ${palette.accent}55` }} />
        </>
      )}
      {theme.deco === "frame" && (
        <div style={{ position: "absolute", inset: 22, border: `14px solid ${palette.primary}`, padding: 16, boxSizing: "border-box" }}>
          <div style={{ height: "100%", border: "2px solid #c7a96b" }} />
        </div>
      )}
      {theme.deco === "minimal" && (
        <div style={{ position: "absolute", inset: 24, border: `2px solid ${palette.primary}`, padding: 6, boxSizing: "border-box" }}>
          <div style={{ height: "100%", border: `1px solid ${palette.primary}80` }} />
        </div>
      )}
      {theme.deco === "leading" && (
        <>
          <div style={{ position: "absolute", inset: 14, border: `3px solid ${palette.secondary}`, boxSizing: "border-box" }} />
          <div style={{ position: "absolute", top: 122, left: 28, right: 28, height: 2, background: `${palette.primary}55` }} />
        </>
      )}
      {theme.deco === "print" && <div style={{ position: "absolute", inset: 18, border: "1px solid #c8ccd6", boxSizing: "border-box" }} />}
      {theme.deco === "luxury" && <div style={{ position: "absolute", top: 112, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, #d9c39b 0%, #eadfca 70%, transparent 100%)" }} />}
      {theme.deco === "geometric" && (
        <>
          <div style={{ position: "absolute", top: 0, left: 0, width: 270, height: 170, clipPath: "polygon(0 0, 100% 0, 72% 100%, 0 100%)", background: `linear-gradient(130deg, ${palette.primary}, #2f855a)` }} />
          <div style={{ position: "absolute", top: 0, left: 0, width: 170, height: 116, clipPath: "polygon(0 0, 100% 0, 70% 100%, 0 100%)", background: `${palette.secondary}` }} />
          <div style={{ position: "absolute", bottom: 0, right: 0, width: 250, height: 170, clipPath: "polygon(28% 0, 100% 0, 100% 100%, 0 100%)", background: `linear-gradient(320deg, ${palette.primary}, #2f855a)` }} />
        </>
      )}
      {theme.deco === "organic" && (
        <>
          <div style={{ position: "absolute", top: -120, left: -80, width: 980, height: 280, borderRadius: "50%", background: `radial-gradient(ellipse at center, ${palette.accent}28 0%, ${palette.accent}10 45%, transparent 80%)` }} />
          <div style={{ position: "absolute", top: 40, left: 0, right: 0, height: 90, borderRadius: "50%", borderTop: `3px solid ${palette.secondary}2f` }} />
        </>
      )}
      <CenterWatermark form={form} palette={palette} />

      <div style={{ padding: theme.deco === "luxury" ? "28px 46px 34px" : "34px 44px 36px", position: "relative", zIndex: 1 }}>
        {theme.deco === "luxury" ? (
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
            <Logo form={form} color={`${palette.primary}90`} rounded={false} size={72} />
            <div>
              <div style={{ color: palette.primary, fontSize: 17, fontWeight: 700 }}>{form.university}</div>
              <div style={{ color: "#4b5563", fontSize: 13 }}>Department of {form.department}</div>
            </div>
          </div>
        ) : theme.deco === "dhaka" ? (
          <div style={{ textAlign: "center", marginTop: 30, marginBottom: 22 }}>
            <div style={{ fontSize: 54, fontWeight: 700, marginBottom: 12 }}>{form.university}</div>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}><Logo form={form} color={palette.primary} size={92} /></div>
            <div style={{ fontSize: 22, letterSpacing: 1.2, marginBottom: 5 }}>Assignment on</div>
            <div style={{ fontSize: 31, fontWeight: 700 }}>{form.topicName}</div>
          </div>
        ) : theme.deco === "leading" ? (
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
              <Logo form={form} color={palette.primary} rounded={false} size={68} />
              <div>
                <div style={{ color: palette.primary, fontSize: 54, fontWeight: 700, letterSpacing: 1.2 }}>{form.university}</div>
                <div style={{ color: "#334155", fontSize: 24, fontStyle: "italic" }}>A Promise to Lead</div>
              </div>
            </div>
            <div style={{ display: "inline-block", background: palette.secondary, color: "#fff", borderRadius: 8, padding: "6px 16px", fontWeight: 700, marginBottom: 10 }}>{form.coverType}</div>
          </div>
        ) : (
          <CenterHeader form={form} palette={palette} theme={theme} />
        )}

        {theme.deco === "geometric" && <div style={{ height: 40 }} />}
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

export default function CoverDesigner() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { width, isMobile, isTablet } = useViewport();
  const exportRef = useRef(null);
  const [form, setForm] = useState(defaultForm);
  const [templates, setTemplates] = useState(TEMPLATES);
  const [palettes, setPalettes] = useState(COLOR_PALETTES);
  const [selectedTemplate, setSelectedTemplate] = useState(1);
  const [selectedPalette, setSelectedPalette] = useState("blue");
  const [activeTab, setActiveTab] = useState("university");
  const [universities, setUniversities] = useState([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setForm((prev) => ({ ...prev, studentName: user?.name || prev.studentName }));
  }, [user?.name]);

  useEffect(() => {
    const boot = async () => {
      try {
        const [profileRes, templateRes, universityRes] = await Promise.all([getProfile(), getTemplates(), getUniversities()]);
        if (profileRes?.data) {
          const profile = profileRes.data;
          setForm((prev) => ({
            ...prev,
            studentName: user?.name || prev.studentName,
            studentId: profile.studentId || prev.studentId,
            department: profile.department || prev.department,
            semester: profile.semester || prev.semester,
            university: profile.university?.name || prev.university,
            shortName: profile.university?.shortName || prev.shortName,
            logoUrl: profile.university?.logoUrl || prev.logoUrl,
          }));
        }
        if (templateRes?.data?.templates?.length) {
          const normalized = templateRes.data.templates.map((t) => ({ id: Number(t.id), name: t.name, desc: t.description })).filter((t) => THEMES[t.id]);
          if (normalized.length) setTemplates(normalized);
        }
        if (templateRes?.data?.palettes?.length) {
          const normalized = templateRes.data.palettes.map((p) => ({
            id: String(p.id || "").trim(),
            name: p.name || "Custom",
            primary: p.primary || "#1a3a6b",
            secondary: p.secondary || "#2563eb",
            accent: p.accent || "#60a5fa",
            bg: p.bg || p.background || "#f0f5ff",
          }));
          if (normalized.length) setPalettes(normalized);
        }
        if (Array.isArray(universityRes?.data)) {
          setUniversities(universityRes.data);
        }
      } catch {
        setStatusMessage("Using local templates. API template sync unavailable.");
      }
    };
    boot();
  }, [user?.name]);

  useEffect(() => {
    if (!universities.length) return;

    const matched = resolveUniversity(form.university, form.shortName, universities);
    if (!matched) return;

    setForm((prev) => {
      const nextUniversity = matched.name || prev.university;
      const nextShortName = matched.shortName || prev.shortName;
      const nextLogoUrl = matched.logoUrl || prev.logoUrl;

      if (
        prev.university === nextUniversity &&
        prev.shortName === nextShortName &&
        prev.logoUrl === nextLogoUrl
      ) {
        return prev;
      }

      return {
        ...prev,
        university: nextUniversity,
        shortName: nextShortName,
        logoUrl: nextLogoUrl,
      };
    });
  }, [form.university, form.shortName, universities]);

  const palette = palettes.find((x) => x.id === selectedPalette) || palettes[0];
  const theme = THEMES[selectedTemplate] || THEMES[1];
  const sidebarWidth = isMobile ? "100%" : 326;
  const previewAvailableWidth = Math.max(320, width - (isMobile ? 24 : isTablet ? 380 : 420));
  const rawScale = previewAvailableWidth / 794;
  const previewScale = isMobile ? Math.min(1, rawScale) : isTablet ? Math.min(0.64, rawScale) : Math.min(0.71, rawScale);

  const updateForm = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const saveCoverToHistory = async () => {
    await generateCover({ templateId: String(selectedTemplate), paletteId: selectedPalette, coverData: form });
  };

  const handleDownloadPdf = async () => {
    if (!exportRef.current) return;
    setIsSaving(true);
    try {
      await saveCoverToHistory();
      const popup = window.open("", "_blank", "width=920,height=1200");
      if (!popup) throw new Error();
      const inner = exportRef.current.innerHTML;
      popup.document.write(`
        <html>
          <head>
            <meta charset="utf-8" />
            <title>Cover</title>
            <style>
              @page {
                size: A4 portrait;
                margin: 0;
              }
              html, body {
                margin: 0;
                padding: 0;
                width: 100%;
                height: 100%;
              }
              * {
                box-sizing: border-box;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              body {
                background: #ffffff;
                padding: 8mm;
              }
              .print-page {
                width: 194mm;
                height: 281mm;
                margin: 0 auto;
                overflow: hidden;
                page-break-after: avoid;
                page-break-inside: avoid;
                break-inside: avoid;
              }
              .sheet {
                width: 794px;
                height: 1123px;
                transform-origin: top left;
                transform: scale(0.923);
              }
              @media screen {
                body {
                  background: #e5e7eb;
                  display: flex;
                  justify-content: center;
                  padding: 10px;
                }
                .print-page {
                  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
                }
              }
            </style>
          </head>
          <body>
            <div class="print-page">
              <div class="sheet">${inner}</div>
            </div>
            <script>
              window.onload = function () {
                setTimeout(function () { window.print(); }, 280);
              };
            </script>
          </body>
        </html>
      `);
      popup.document.close();
      setStatusMessage("PDF dialog opened. Choose Save as PDF.");
    } catch {
      setStatusMessage("PDF export failed.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPng = async () => {
    if (!exportRef.current) return;
    setIsSaving(true);
    try {
      await saveCoverToHistory();
      const canvas = await html2canvas(exportRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        width: 794,
        height: 1123,
      });
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `cover-${Date.now()}.png`;
          a.click();
          URL.revokeObjectURL(url);
          setStatusMessage("PNG downloaded successfully.");
        } else {
          setStatusMessage("PNG export failed.");
        }
        setIsSaving(false);
      }, "image/png");
    } catch (error) {
      console.error("PNG export error:", error);
      setStatusMessage("PNG export failed.");
      setIsSaving(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: isMobile ? "column-reverse" : "row", minHeight: "100vh", fontFamily: "'Segoe UI', sans-serif", background: "#edf1f5", overflowX: "hidden" }}>
      <div style={{ width: sidebarWidth, background: "#fff", boxShadow: "2px 0 14px rgba(15, 23, 42, 0.08)", display: "flex", flexDirection: "column", overflow: "hidden", borderTop: isMobile ? "1px solid #e2e8f0" : "none" }}>
        <div style={{ padding: "16px", background: `linear-gradient(135deg, ${palette.primary}, ${palette.secondary})`, color: "#fff" }}>
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            style={{
              border: "1px solid rgba(255,255,255,0.35)",
              background: "rgba(255,255,255,0.14)",
              color: "#fff",
              fontSize: 11,
              fontWeight: 700,
              borderRadius: 999,
              padding: "6px 10px",
              cursor: "pointer",
              marginBottom: 10,
            }}
          >
            ← Back to Home
          </button>
          <div style={{ fontSize: 17, fontWeight: 800 }}>CoverCraft BD</div>
          <div style={{ fontSize: 9.5, opacity: 0.76 }}>A4 Assignment & Lab Cover Designer</div>
        </div>
        <div style={{ padding: "13px 14px", borderBottom: "1px solid #eef2f6" }}>
          <div style={{ fontSize: 9.5, fontWeight: 700, color: "#7c8da1", letterSpacing: 1.4, marginBottom: 8 }}>TEMPLATE</div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(5,1fr)" : "repeat(4,1fr)", gap: 5 }}>
            {templates.map((t) => (
              <button key={t.id} onClick={() => setSelectedTemplate(t.id)} style={{ padding: "7px 0", borderRadius: 6, border: "none", cursor: "pointer", background: selectedTemplate === t.id ? palette.primary : "#eef2f7", color: selectedTemplate === t.id ? "#fff" : "#64748b", fontSize: 11, fontWeight: 700 }}>T{t.id}</button>
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
              <button key={x.id} onClick={() => setSelectedPalette(x.id)} style={{ width: 27, height: 27, borderRadius: "50%", border: selectedPalette === x.id ? "2px solid #0f172a" : "2px solid transparent", background: `linear-gradient(135deg, ${x.primary}, ${x.secondary})`, cursor: "pointer" }} />
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
          {activeTab === "people" && (<><InputField label="TEACHER NAME" field="teacherName" form={form} updateForm={updateForm} /><InputField label="TEACHER DESIGNATION" field="teacherDesignation" form={form} updateForm={updateForm} /><InputField label="TEACHER DEPARTMENT" field="teacherDept" form={form} updateForm={updateForm} /><InputField label="STUDENT NAME" field="studentName" form={form} updateForm={updateForm} /><InputField label="STUDENT ID" field="studentId" form={form} updateForm={updateForm} /><InputField label="SECTION" field="section" form={form} updateForm={updateForm} /><InputField label="SEMESTER" field="semester" form={form} updateForm={updateForm} /></>)}
        </div>
        <div style={{ padding: "12px 14px", borderTop: "1px solid #eef2f6", display: "flex", gap: 8 }}>
          <button onClick={handleDownloadPdf} disabled={isSaving} style={{ flex: 1, padding: 10, borderRadius: 7, border: "none", background: `linear-gradient(135deg, ${palette.primary}, ${palette.secondary})`, color: "#fff", fontWeight: 700, cursor: isSaving ? "not-allowed" : "pointer" }}>{isSaving ? "Processing" : "Download PDF"}</button>
          <button onClick={handleDownloadPng} disabled={isSaving} style={{ flex: 1, padding: 10, borderRadius: 7, border: `2px solid ${palette.primary}`, background: "#fff", color: palette.primary, fontWeight: 700, cursor: isSaving ? "not-allowed" : "pointer" }}>{isSaving ? "Please wait" : "Save PNG"}</button>
        </div>
        {statusMessage && <div style={{ padding: "8px 14px 12px", fontSize: 11, color: "#64748b", borderTop: "1px solid #f5f5f5" }}>{statusMessage}</div>}
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
