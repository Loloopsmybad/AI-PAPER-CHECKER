import { useState, useRef, type DragEvent, type ChangeEvent } from "react";
import { Link } from "react-router-dom";
import type { EvaluateResponse } from "../types";

const API_BASE = "";

export default function Evaluator() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState("");
  const [subject, setSubject] = useState("General Knowledge");
  const [totalMarks, setTotalMarks] = useState("100");
  const [rubrics, setRubrics] = useState("");
  const [rubricsFileName, setRubricsFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EvaluateResponse | null>(null);
  const [tab, setTab] = useState<"evaluation" | "ocr">("evaluation");

  const pdfInputRef = useRef<HTMLInputElement>(null);
  const txtInputRef = useRef<HTMLInputElement>(null);
  const [pdfDragover, setPdfDragover] = useState(false);

  // PDF upload handlers
  function handlePdfDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setPdfDragover(false);
    const f = e.dataTransfer.files[0];
    if (f) setPdfFile(f);
  }

  function handlePdfSelect(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setPdfFile(f);
  }

  // Rubrics file upload
  function handleRubricsFile(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setRubricsFileName(f.name);
    const reader = new FileReader();
    reader.onload = () => setRubrics(reader.result as string);
    reader.readAsText(f);
  }

  // Upload PDF and evaluate
  async function handleEvaluate() {
    let pdf_source = pdfUrl;

    if (pdfFile) {
      const formData = new FormData();
      formData.append("pdf", pdfFile);
      const uploadRes = await fetch(`${API_BASE}/api/upload-pdf`, { method: "POST", body: formData });
      const uploadData = await uploadRes.json();
      if (!uploadData.success) { setError(uploadData.error || "Upload failed"); return; }
      pdf_source = uploadData.pdf_path;
    }

    if (!pdf_source) { setError("Please provide a PDF (upload or URL)."); return; }
    if (!rubrics.trim()) { setError("Please enter or upload rubrics."); return; }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/api/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdf_source, rubrics, subject, total_marks: Number(totalMarks) }),
      });
      const data: EvaluateResponse & { error?: string } = await res.json();
      if (data.error) { setError(data.error); return; }
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-[20px] bg-surface-container/70 border-b border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        <div className="flex justify-between items-center px-12 py-4 w-full max-w-[1440px] mx-auto">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors active:scale-95">
              <span className="material-symbols-outlined">arrow_back</span>
              <span>Back to Home</span>
            </Link>
            <div className="text-2xl font-bold text-primary">OCR Exam Evaluator</div>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a className="text-primary font-bold border-b-2 border-primary pb-1" href="#">Dashboard</a>
            <a className="text-on-surface-variant hover:text-primary transition-colors" href="#">History</a>
            <a className="text-on-surface-variant hover:text-primary transition-colors" href="#">Settings</a>
          </nav>
        </div>
      </header>

      {/* Main */}
      <main className="flex-grow w-full max-w-4xl mx-auto px-6 md:px-12 py-12">
        <div className="space-y-6">

          {/* PDF Source */}
          <section className="glass-card p-8 space-y-6">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">picture_as_pdf</span>
              <h2 className="text-xl font-semibold text-on-surface">PDF Source</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-2">Google Drive URL</label>
                <input
                  type="text"
                  value={pdfUrl}
                  onChange={(e) => setPdfUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/..."
                  className="w-full rounded-lg px-4 py-3 text-sm font-mono input-well text-on-surface"
                />
              </div>
              <div
                onDragOver={(e) => { e.preventDefault(); setPdfDragover(true); }}
                onDragLeave={() => setPdfDragover(false)}
                onDrop={handlePdfDrop}
                onClick={() => pdfInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center transition-all cursor-pointer ${
                  pdfDragover ? "border-primary/50 bg-primary/5" : "border-outline-variant/50 hover:border-primary/50 hover:bg-primary/5"
                }`}
              >
                <input ref={pdfInputRef} type="file" accept=".pdf" onChange={handlePdfSelect} className="absolute inset-0 opacity-0 cursor-pointer" />
                <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-3">upload_file</span>
                <p className="text-on-surface mb-1">Drag and drop your PDF here</p>
                <p className="text-sm text-on-surface-variant">or click to browse from files</p>
                {pdfFile && <p className="text-primary font-semibold text-sm mt-2">{pdfFile.name}</p>}
              </div>
            </div>
          </section>

          {/* Evaluation Settings */}
          <section className="glass-card p-8 space-y-6">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">settings_applications</span>
              <h2 className="text-xl font-semibold text-on-surface">Evaluation Settings</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-on-surface-variant">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Advanced Thermodynamics"
                  className="w-full rounded-lg px-4 py-3 text-sm font-mono input-well text-on-surface"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-on-surface-variant">Total Marks</label>
                <input
                  type="text"
                  value={totalMarks}
                  onChange={(e) => setTotalMarks(e.target.value)}
                  placeholder="100"
                  className="w-full rounded-lg px-4 py-3 text-sm font-mono input-well text-on-surface"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-on-surface-variant">Rubrics / Grading Criteria</label>
              <textarea
                value={rubrics}
                onChange={(e) => setRubrics(e.target.value)}
                placeholder="Paste your detailed grading rubric here..."
                rows={6}
                className="w-full rounded-lg px-4 py-3 input-well text-on-surface resize-none"
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-grow border-t border-outline-variant/30" />
              <span className="text-xs font-medium text-outline tracking-wider">OR UPLOAD RUBRIC</span>
              <div className="flex-grow border-t border-outline-variant/30" />
            </div>
            <div
              onClick={() => txtInputRef.current?.click()}
              className="flex items-center justify-center p-6 border-2 border-dashed border-outline-variant/50 rounded-lg hover:border-secondary transition-colors cursor-pointer bg-surface-container-low"
            >
              <input ref={txtInputRef} type="file" accept=".txt" onChange={handleRubricsFile} className="hidden" />
              <span className="material-symbols-outlined mr-2 text-secondary">note_add</span>
              <span className="text-sm text-on-surface-variant">{rubricsFileName || "Upload rubric as .txt file"}</span>
            </div>
          </section>

          {/* Action */}
          <div className="space-y-4">
            <button
              onClick={handleEvaluate}
              disabled={loading}
              className="w-full py-4 rounded-xl text-xl font-semibold text-white btn-gradient flex items-center justify-center gap-3"
            >
              {loading ? (
                <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span className="material-symbols-outlined">auto_awesome</span>
              )}
              {loading ? "Processing..." : "Evaluate Answer Sheet"}
            </button>
            {error && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-error/20 bg-error-container/10 text-error">
                <span className="material-symbols-outlined">info</span>
                <p className="text-sm">{error}</p>
              </div>
            )}
          </div>

          {/* Results */}
          {result && (
            <section className="glass-card overflow-hidden">
              <div className="flex border-b border-white/10 bg-surface-container-low">
                <button
                  onClick={() => setTab("evaluation")}
                  className={`flex-1 py-4 text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                    tab === "evaluation" ? "border-b-2 border-primary text-primary" : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  <span className="material-symbols-outlined">analytics</span>
                  Evaluation
                </button>
                <button
                  onClick={() => setTab("ocr")}
                  className={`flex-1 py-4 text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                    tab === "ocr" ? "border-b-2 border-primary text-primary" : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  <span className="material-symbols-outlined">data_object</span>
                  OCR Text
                </button>
              </div>
              <div className="p-8">
                <pre className="rounded-lg bg-surface-container-lowest p-6 border border-white/5 font-mono-data text-sm text-secondary-fixed-dim whitespace-pre-wrap leading-relaxed max-h-[400px] overflow-y-auto">
                  {tab === "evaluation" ? result.evaluation : result.ocr_text}
                </pre>
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-outline-variant/30 px-12 py-4 w-full flex flex-col md:flex-row justify-between items-center bg-background">
        <div className="text-2xl font-bold text-primary mb-4 md:mb-0">OCR Exam Evaluator</div>
        <div className="flex flex-wrap justify-center gap-6 mb-4 md:mb-0">
          <a className="text-sm text-on-surface-variant hover:text-primary transition-colors" href="#">Terms</a>
          <a className="text-sm text-on-surface-variant hover:text-primary transition-colors" href="#">Privacy</a>
          <a className="text-sm text-on-surface-variant hover:text-primary transition-colors" href="#">Support</a>
        </div>
        <p className="text-sm text-on-surface-variant">&copy; 2026 OCR Exam Evaluator.</p>
      </footer>
    </div>
  );
}
