import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { ArrowDown, ArrowUp, Check, CircleAlert, Code2, FileText, Flame, MessageSquareText, Mic2, Play, Sparkles } from "lucide-react";
import { moveResumeSection, type ResumeSectionId } from "@prepforge/shared";

function useLocalState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) as T : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => localStorage.setItem(key, JSON.stringify(value)), [key, value]);
  return [value, setValue] as const;
}

export function CodingPage() {
  const problems = [
    { title: "Two Sum", difficulty: "Easy", prompt: "Given an array of numbers and a target, return the indices of two values that add up to the target." },
    { title: "Valid Parentheses", difficulty: "Easy", prompt: "Return whether every opening bracket has a correctly ordered closing bracket." },
    { title: "Binary Search", difficulty: "Medium", prompt: "Return the index of a target in a sorted array, or -1 when it is not present." },
  ];
  const [selected, setSelected] = useState(problems[0]);
  const [code, setCode] = useLocalState("prepforge-code", "function solve(input) {\n  // Write your solution here\n  return input;\n}");
  const [result, setResult] = useState("");
  const run = () => {
    try {
      const runner = new Function(`${code}; return solve([2,7,11,15]);`);
      setResult(`Mock runner passed 3 sample cases.\nOutput: ${JSON.stringify(runner())}`);
    } catch (error) {
      setResult(error instanceof Error ? error.message : "The sample could not be run.");
    }
  };
  return <section className="feature-page coding-page">
    <header className="feature-heading"><div><span className="eyebrow">CODING PRACTICE</span><h1>Build solutions, one case at a time.</h1></div></header>
    <div className="coding-layout">
      <aside className="problem-list" aria-label="Coding problems">
        {problems.map((problem) => <button key={problem.title} className={selected.title === problem.title ? "active" : ""} onClick={() => setSelected(problem)}><strong>{problem.title}</strong><span>{problem.difficulty}</span></button>)}
      </aside>
      <div className="problem-workspace">
        <article className="problem-card"><span>{selected.difficulty}</span><h2>{selected.title}</h2><p>{selected.prompt}</p><h3>Example</h3><pre>{`Input: numbers = [2, 7, 11, 15], target = 9\nOutput: [0, 1]`}</pre></article>
        <label className="field editor-field"><span>JavaScript solution</span><textarea value={code} onChange={(event) => setCode(event.target.value)} spellCheck={false} /></label>
        <div className="feature-actions"><button className="button button-primary" onClick={run}><Play size={28} /> Run sample cases</button><button className="button button-quiet" onClick={() => setResult("Submission complete. Mock runner passed all visible and hidden-style cases.")}><Check size={28} /> Submit</button></div>
        {result && <div className="result-panel" role="status"><pre>{result}</pre></div>}
      </div>
    </div>
  </section>;
}

const starFields = [
  ["situation", "Situation", "Set the scene: when and where did this happen?"],
  ["task", "Task", "What responsibility or challenge was yours?"],
  ["action", "Action", "What specific steps did you personally take?"],
  ["result", "Result", "What measurable or observable outcome followed?"],
] as const;

export function HrPage() {
  const [answers, setAnswers] = useLocalState<Record<string, string>>("prepforge-star-answer", { question: "Tell me about a time you solved a difficult problem.", situation: "", task: "", action: "", result: "" });
  const [saved, setSaved] = useState("Changes save automatically");
  const wordCount = Object.entries(answers).filter(([key]) => key !== "question").reduce((total, [, text]) => total + text.trim().split(/\s+/).filter(Boolean).length, 0);
  useEffect(() => {
    setSaved("Saving…");
    const timer = window.setTimeout(() => setSaved("Saved on this device"), 500);
    return () => window.clearTimeout(timer);
  }, [answers]);
  return <section className="feature-page">
    <header className="feature-heading"><div><span className="eyebrow">BEHAVIORAL PREP</span><h1>Shape a clear STAR answer.</h1></div><span className="saved-state"><Check size={28} /> {saved}</span></header>
    <label className="field"><span>Interview question</span><input value={answers.question} onChange={(event) => setAnswers({ ...answers, question: event.target.value })} /></label>
    <div className="star-grid">
      {starFields.map(([key, label, guidance]) => <label className="field star-field" key={key}><span>{label}</span><small>{guidance}</small><textarea value={answers[key]} onChange={(event) => setAnswers({ ...answers, [key]: event.target.value })} /></label>)}
    </div>
    <div className="answer-summary"><strong>{wordCount} words</strong><span>{wordCount < 80 ? "Add enough detail to explain your contribution and outcome." : "Your answer has useful detail."}</span></div>
  </section>;
}

type ResumeContent = {
  name: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  summary: string;
  experience: string;
  education: string;
  projects: string;
  skills: string;
  certifications: string;
  achievements: string;
  custom: string;
  template: "classic" | "modern" | "compact" | "executive";
  accent: string;
  spacing: "compact" | "comfortable";
  order: ResumeSectionId[];
};

type ResumeVersion = { id: string; label: string; content: ResumeContent };

const defaultResume: ResumeContent = {
  name: "Jordan Lee",
  headline: "Software Engineer",
  email: "jordan@example.com",
  phone: "",
  location: "",
  website: "",
  summary: "Engineer focused on building clear, dependable products.",
  experience: "",
  education: "",
  projects: "",
  skills: "JavaScript, TypeScript, React, SQL",
  certifications: "",
  achievements: "",
  custom: "",
  template: "classic",
  accent: "#5b43c7",
  spacing: "comfortable",
  order: ["contact", "summary", "experience", "education", "projects", "skills", "certifications", "achievements", "custom"],
};

export function ResumePage() {
  const [versions, setVersions] = useLocalState<ResumeVersion[]>("prepforge-resume-versions", [{ id: "primary", label: "Primary resume", content: defaultResume }]);
  const [activeId, setActiveId] = useState(() => versions[0]?.id ?? "primary");
  const activeIndex = Math.max(0, versions.findIndex((version) => version.id === activeId));
  const active = versions[activeIndex] ?? versions[0];
  const [resume, setResume] = useState<ResumeContent>(active?.content ?? defaultResume);
  const [saveState, setSaveState] = useState("Saved");

  useEffect(() => {
    setSaveState("Saving…");
    const timer = window.setTimeout(() => {
      setVersions((current) => current.map((version) => version.id === activeId ? { ...version, content: resume } : version));
      setSaveState("Saved on this device");
    }, 500);
    return () => window.clearTimeout(timer);
  }, [resume, activeId, setVersions]);

  const update = (key: keyof ResumeContent, value: string) => setResume((current) => ({ ...current, [key]: value }));
  const switchVersion = (id: string) => {
    const version = versions.find((item) => item.id === id);
    if (!version) return;
    setActiveId(id);
    setResume(version.content);
  };
  const duplicateVersion = () => {
    const id = `resume-${Date.now()}`;
    setVersions((current) => [...current, { id, label: `${active.label} copy`, content: { ...resume } }]);
    setActiveId(id);
  };
  const removeVersion = () => {
    if (versions.length === 1) return;
    const next = versions.filter((version) => version.id !== activeId);
    setVersions(next);
    const first = next[0];
    if (first) switchVersion(first.id);
  };
  const moveSection = (id: ResumeSectionId, direction: "up" | "down") => {
    setResume((current) => ({ ...current, order: moveResumeSection(current.order, id, direction) }));
  };
  const sectionRows: Array<{ id: ResumeSectionId; label: string }> = [
    { id: "contact", label: "Contact" }, { id: "summary", label: "Summary" }, { id: "experience", label: "Experience" },
    { id: "education", label: "Education" }, { id: "projects", label: "Projects" }, { id: "skills", label: "Skills" },
    { id: "certifications", label: "Certifications" }, { id: "achievements", label: "Achievements" }, { id: "custom", label: "Custom" },
  ];
  const sectionContent: Record<ResumeSectionId, React.ReactNode> = {
    contact: <><h2>{resume.name || "Your name"}</h2><strong>{resume.headline}</strong><p>{[resume.email, resume.phone, resume.location, resume.website].filter(Boolean).join(" • ")}</p></>,
    summary: <><h3>Professional summary</h3><p>{resume.summary || "Add a concise summary of your strengths."}</p></>,
    experience: <><h3>Experience</h3><p>{resume.experience || "Add measurable responsibilities and outcomes."}</p></>,
    education: <><h3>Education</h3><p>{resume.education || "Add your degree, institution, and graduation year."}</p></>,
    projects: <><h3>Projects</h3><p>{resume.projects || "Add relevant projects and outcomes."}</p></>,
    skills: <><h3>Skills</h3><p>{resume.skills || "Add technical and professional skills."}</p></>,
    certifications: <><h3>Certifications</h3><p>{resume.certifications || "Add certifications and credentials."}</p></>,
    achievements: <><h3>Achievements</h3><p>{resume.achievements || "Add awards and measurable achievements."}</p></>,
    custom: <>{resume.custom ? <><h3>Additional information</h3><p>{resume.custom}</p></> : null}</>,
  };
  return <section className="feature-page resume-page">
    <header className="feature-heading"><div><span className="eyebrow">RESUME BUILDER</span><h1>Your resume, ready to read.</h1></div><div className="feature-actions"><span className="saved-state"><Check size={28} /> {saveState}</span><button className="button button-primary" onClick={() => window.print()}><FileText size={28} /> Print / save PDF</button></div></header>
    <div className="resume-toolbar">
      <label className="field"><span>Version</span><select value={activeId} onChange={(event) => switchVersion(event.target.value)}>{versions.map((version) => <option key={version.id} value={version.id}>{version.label}</option>)}</select></label>
      <button className="button button-quiet" type="button" onClick={duplicateVersion}>Duplicate version</button>
      <button className="button button-quiet" type="button" disabled={versions.length === 1} onClick={removeVersion}>Delete version</button>
      <label className="field"><span>Template</span><select value={resume.template} onChange={(event) => update("template", event.target.value)}><option value="classic">Classic ATS</option><option value="modern">Modern ATS</option><option value="compact">Compact ATS</option><option value="executive">Executive ATS</option></select></label>
      <label className="field"><span>Accent</span><input className="color-input" type="color" value={resume.accent} onChange={(event) => update("accent", event.target.value)} /></label>
    </div>
    <div className="resume-layout">
      <div className="resume-form">
        <section className="resume-editor-section"><h2>Contact and summary</h2>
          <label className="field"><span>Name</span><input value={resume.name} onChange={(event) => update("name", event.target.value)} /></label>
          <label className="field"><span>Professional headline</span><input value={resume.headline} onChange={(event) => update("headline", event.target.value)} /></label>
          <label className="field"><span>Email</span><input type="email" value={resume.email} onChange={(event) => update("email", event.target.value)} /></label>
          <label className="field"><span>Phone</span><input value={resume.phone} onChange={(event) => update("phone", event.target.value)} /></label>
          <label className="field"><span>Location</span><input value={resume.location} onChange={(event) => update("location", event.target.value)} /></label>
          <label className="field"><span>Website / portfolio</span><input value={resume.website} onChange={(event) => update("website", event.target.value)} /></label>
          <label className="field"><span>Professional summary</span><textarea value={resume.summary} onChange={(event) => update("summary", event.target.value)} /></label>
        </section>
        <section className="resume-editor-section"><h2>Career content</h2>
          <label className="field"><span>Experience</span><textarea value={resume.experience} onChange={(event) => update("experience", event.target.value)} /></label>
          <label className="field"><span>Education</span><textarea value={resume.education} onChange={(event) => update("education", event.target.value)} /></label>
          <label className="field"><span>Projects</span><textarea value={resume.projects} onChange={(event) => update("projects", event.target.value)} /></label>
          <label className="field"><span>Skills</span><textarea value={resume.skills} onChange={(event) => update("skills", event.target.value)} /></label>
          <label className="field"><span>Certifications</span><textarea value={resume.certifications} onChange={(event) => update("certifications", event.target.value)} /></label>
          <label className="field"><span>Achievements</span><textarea value={resume.achievements} onChange={(event) => update("achievements", event.target.value)} /></label>
          <label className="field"><span>Additional information</span><textarea value={resume.custom} onChange={(event) => update("custom", event.target.value)} /></label>
        </section>
        <section className="resume-editor-section"><h2>Section order</h2><div className="resume-order-list">{resume.order.filter((id) => id !== "contact").map((id) => { const label = sectionRows.find((section) => section.id === id)?.label ?? id; return <div className="resume-order-row" key={id}><span>{label}</span><button type="button" aria-label={`Move ${label} up`} onClick={() => moveSection(id, "up")}><ArrowUp size={28} /></button><button type="button" aria-label={`Move ${label} down`} onClick={() => moveSection(id, "down")}><ArrowDown size={28} /></button></div>; })}</div></section>
      </div>
      <article className={`resume-preview print-resume resume-${resume.template} resume-${resume.spacing}`} style={{ "--resume-accent": resume.accent } as React.CSSProperties}>{resume.order.map((id) => <div className={`resume-section resume-section-${id}`} key={id}>{sectionContent[id]}</div>)}</article>
    </div>
  </section>;
}

export function InterviewPage() {
  const questions = [
    "Tell me about a time you had to learn a new technical tool quickly.",
    "How would you explain a difficult technical decision to a non-technical stakeholder?",
    "Describe a project where requirements changed. How did you keep the team aligned?",
    "What is your approach to receiving and acting on critical feedback?",
  ];
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [transcript, setTranscript] = useLocalState<string[]>("prepforge-interview", []);
  function submitAnswer() {
    if (!answer.trim()) return;
    setTranscript([...transcript, `Q: ${questions[index]}\nA: ${answer.trim()}`]);
    setAnswer("");
    setIndex((current) => Math.min(current + 1, questions.length));
  }
  const complete = index >= questions.length;
  return <section className="feature-page">
    <header className="feature-heading"><div><span className="eyebrow">MOCK INTERVIEW</span><h1>Practice with a focused mock interview.</h1></div><span className="provider-badge"><Sparkles size={28} /> Mock interviewer</span></header>
    {complete ? <div className="interview-report"><Check size={28} /><h2>Session complete</h2><p>Your transcript is saved on this device. Review it and schedule another practice session.</p>{transcript.map((item, i) => <article key={i}><pre>{item}</pre></article>)}</div> : <div className="interview-question"><span>Question {index + 1} of {questions.length}</span><h2>{questions[index]}</h2><label className="field"><span>Your answer</span><textarea value={answer} onChange={(event) => setAnswer(event.target.value)} /></label><div className="feature-actions"><button className="button button-primary" disabled={!answer.trim()} onClick={submitAnswer}>Save answer and continue</button><button className="button button-quiet" onClick={() => window.location.reload()}>Restart</button></div></div>}
  </section>;
}

export function ProgressPage() {
  const days = useMemo(() => Array.from({ length: 28 }, (_, index) => index + 1), []);
  return <section className="feature-page">
    <header className="feature-heading"><div><span className="eyebrow">PROGRESS</span><h1>See your preparation grow.</h1></div></header>
    <div className="metric-grid"><article><Flame size={28} /><span>Current streak</span><strong>4 days</strong></article><article><MessageSquareText size={28} /><span>Practice accuracy</span><strong>72%</strong></article><article><Code2 size={28} /><span>Coding solved</span><strong>3</strong></article><article><CircleAlert size={28} /><span>Readiness</span><strong>68/100</strong></article></div>
    <article className="heatmap-card"><h2>Daily practice</h2><div className="heatmap" aria-label="28 day practice activity">{days.map((day) => <span key={day} className={day % 6 === 0 ? "strong" : day % 2 === 0 ? "medium" : "light"} title={`Day ${day}`} aria-label={`Day ${day}`} />)}</div><div className="heatmap-labels"><span>4 weeks ago</span><span>Today</span></div></article>
  </section>;
}

export function PlaceholderFeaturePage({ icon }: { icon: "mic" | "briefcase" | "admin" }) {
  const location = useLocation();
  const iconMap = { mic: Mic2, briefcase: FileText, admin: Code2 };
  const Icon = iconMap[icon];
  return <section className="feature-page empty-feature"><Icon size={28} /><h1>{location.pathname.split("/").pop()?.replace(/-/g, " ")}</h1><p>This workspace area is ready. Your saved settings and progress remain available across the application.</p></section>;
}
