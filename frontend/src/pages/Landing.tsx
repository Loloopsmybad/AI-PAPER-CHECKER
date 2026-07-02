import { Link } from "react-router-dom";

const features = [
  { icon: "upload_file", title: "PDF Upload", desc: "Bulk upload student submissions in multiple formats. Our pipeline handles thousands of pages simultaneously with no loss in performance." },
  { icon: "gesture", title: "OCR Extraction", desc: "Proprietary handwriting recognition for diverse script styles. Accurately deciphers varied cursive and block lettering across global languages." },
  { icon: "psychology", title: "AI Evaluation", desc: "Semantic grading that understands context and intent. The AI doesn't just look for keywords; it analyzes logic and conceptual depth." },
  { icon: "rule", title: "Custom Rubrics", desc: "Build complex grading schemes with weighted criteria. Tailor your marking parameters to match specific curriculum standards." },
  { icon: "comment_bank", title: "Detailed Feedback", desc: "Automatically generate personalized comments for students. Provide meaningful guidance based on specific errors identified in the text." },
  { icon: "api", title: "Instant Results", desc: "Export results directly to your LMS or via API. Seamlessly sync grades into Canvas, Blackboard, or custom institutional databases." },
];

const steps = [
  { num: "01", title: "Upload PDF", desc: "Drop your scanned answer sheets into our secure, SOC2-compliant environment." },
  { num: "02", title: "Set Rubrics", desc: "Define your marking scheme or upload an existing answer key for the AI to follow." },
  { num: "03", title: "Get Results", desc: "Review AI-graded insights, verify confidence scores, and publish final scores." },
];

export default function Landing() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <header className="fixed top-0 w-full z-50 backdrop-blur-xl bg-surface/10 border-b border-white/5 shadow-xl">
        <nav className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto">
          <div className="text-2xl font-bold text-primary tracking-tight">OCR Exam Evaluator</div>
          <div className="hidden md:flex items-center space-x-8">
            <a className="text-primary font-bold border-b-2 border-primary pb-1 transition-colors" href="#">Platform</a>
            <a className="text-on-surface-variant hover:text-primary transition-colors" href="#">Features</a>
            <a className="text-on-surface-variant hover:text-primary transition-colors" href="#">Security</a>
            <a className="text-on-surface-variant hover:text-primary transition-colors" href="#">Documentation</a>
          </div>
          <Link to="/app" className="btn-gradient px-6 py-2 rounded-full font-bold text-white active:scale-95 transition-transform">
            Start Grading
          </Link>
        </nav>
      </header>

      <main className="pt-24 overflow-x-hidden">
        {/* Hero */}
        <section className="relative px-6 py-24 max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center min-h-[819px]">
          <div className="absolute inset-0 hero-gradient -z-10 pointer-events-none" />
          <div className="space-y-4">
            <h1 className="text-5xl md:text-[56px] leading-[1.1] font-bold text-white max-w-xl">
              Grade Answer Sheets in <span className="text-gradient">Seconds</span>
            </h1>
            <p className="text-lg text-on-surface-variant max-w-lg">
              Transform handwritten exam papers into accurate digital insights with AI-powered precision. Reduce manual effort by 90% while maintaining absolute grading integrity.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <Link to="/app" className="btn-gradient px-8 py-3 rounded-xl font-bold text-white shadow-lg active:scale-95 transition-all inline-block">
                Get Started
              </Link>
              <button className="px-8 py-3 rounded-xl font-bold border border-white/10 glass-panel hover:bg-white/5 active:scale-95 transition-all flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">play_circle</span>
                Watch Demo
              </button>
            </div>
          </div>
          <div className="relative animate-float">
            <div className="glass-panel p-6 rounded-2xl border-t-[1.5px] border-white/20 relative">
              <div className="absolute -top-4 -right-4 bg-primary-container px-4 py-2 rounded-lg shadow-2xl flex items-center gap-2 border border-white/10 z-20">
                <span className="material-symbols-outlined text-white">auto_awesome</span>
                <span className="font-mono-data text-sm text-white">99.8% Accuracy</span>
              </div>
              <div className="space-y-4">
                <div className="h-4 w-1/3 bg-white/5 rounded" />
                <div className="space-y-2">
                  <div className="h-3 w-full bg-white/5 rounded" />
                  <div className="h-3 w-4/5 bg-white/5 rounded" />
                </div>
                <div className="relative aspect-[4/3] rounded-lg overflow-hidden border border-white/5">
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-primary shadow-[0_0_15px_#4d8eff]" style={{ animation: "scan 3s linear infinite" }} />
                  <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-2">
                    <div className="bg-surface/80 backdrop-blur-md p-3 rounded-lg border border-white/10">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-primary uppercase tracking-wider">Question 4 Analysis</span>
                        <span className="text-tertiary font-bold">14/15</span>
                      </div>
                      <div className="mt-2 h-1 w-full bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-primary w-[93%]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/20 blur-[100px]" />
            <div className="absolute -z-10 bottom-0 right-0 w-48 h-48 bg-secondary/20 blur-[80px]" />
          </div>
        </section>

        {/* Features */}
        <section className="px-6 py-24 max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl font-bold text-white">Unmatched Intelligence for Grading</h2>
            <p className="text-lg text-on-surface-variant max-w-2xl mx-auto">
              Built for educators who demand accuracy. Our system combines high-fidelity OCR with semantic reasoning to evaluate papers like a human, but at machine speed.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="glass-panel p-8 rounded-2xl glass-card-hover transition-all group">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 border border-primary/20">
                  <span className="material-symbols-outlined text-primary">{f.icon}</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{f.title}</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section className="bg-surface-container-low/50 py-24 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center mb-20">
              <h2 className="text-4xl font-bold text-white">Streamlined Workflow</h2>
              <p className="text-lg text-on-surface-variant">Simple steps to 10x your grading efficiency.</p>
            </div>
            <div className="flex flex-col md:flex-row gap-12 relative">
              <div className="hidden md:block absolute top-10 left-[10%] right-[10%] h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
              {steps.map((s) => (
                <div key={s.num} className="flex-1 text-center space-y-6 group">
                  <div className="relative inline-block">
                    <div className="w-20 h-20 rounded-full glass-panel flex items-center justify-center text-primary font-bold text-2xl z-10 relative border-primary/40">
                      {s.num}
                    </div>
                    <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">{s.title}</h3>
                    <p className="text-sm text-on-surface-variant px-4">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 py-32 max-w-5xl mx-auto text-center">
          <div className="glass-panel p-12 rounded-[32px] border-t border-white/10 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 -z-10" />
            <div className="space-y-6 relative z-10">
              <h2 className="text-4xl font-bold text-white">Ready to reclaim your time?</h2>
              <p className="text-lg text-on-surface-variant max-w-2xl mx-auto">
                Join 500+ educational institutions already scaling their grading processes with OCR Exam Evaluator.
              </p>
              <div className="pt-6">
                <Link to="/app" className="btn-gradient px-12 py-4 rounded-xl font-bold text-white text-lg shadow-xl hover:scale-105 active:scale-95 transition-all inline-block">
                  Start Your Free Trial
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-surface-container-lowest">
        <div className="flex flex-col md:flex-row justify-between items-center px-6 py-12 max-w-7xl mx-auto space-y-4 md:space-y-0">
          <div className="flex flex-col items-center md:items-start space-y-2">
            <div className="text-2xl font-bold text-primary">OCR Exam Evaluator</div>
            <p className="text-sm text-on-surface-variant opacity-70">
              &copy; 2026 OCR Exam Evaluator. All rights reserved.
            </p>
          </div>
          <div className="flex gap-8">
            <a className="text-xs font-semibold text-on-surface-variant hover:text-tertiary transition-colors uppercase tracking-wider" href="#">Privacy</a>
            <a className="text-xs font-semibold text-on-surface-variant hover:text-tertiary transition-colors uppercase tracking-wider" href="#">Terms</a>
            <a className="text-xs font-semibold text-on-surface-variant hover:text-tertiary transition-colors uppercase tracking-wider" href="#">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
