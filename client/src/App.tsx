import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Award,
  BookOpenCheck,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  CircleHelp,
  Code2,
  FileText,
  Flame,
  GraduationCap,
  LayoutDashboard,
  LockKeyhole,
  Mic2,
  Moon,
  Play,
  ShieldCheck,
  Settings,
  Sparkles,
  Sun,
  Target,
  Users,
  Zap,
} from "lucide-react";
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import type { AuthResponse, OnboardingInput, PublicUser, TextSize } from "@prepforge/shared";
import { api } from "./api";
import { CodingPage, HrPage, InterviewPage, ProgressPage, ResumePage } from "./FeaturePages";
import { PracticePage } from "./PracticePage";

function useTheme() {
  const [dark, setDark] = useState(() => localStorage.getItem("prepforge-theme") !== "light");
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("prepforge-theme", dark ? "dark" : "light");
  }, [dark]);
  return { dark, toggle: () => setDark((current) => !current) };
}

function storedTextSize(): TextSize {
  const saved = localStorage.getItem("prepforge-text-size");
  return saved === "EXTRA_LARGE" || saved === "HUGE" ? saved : "LARGE";
}

function useTextSize() {
  const hadSavedPreference = useRef(localStorage.getItem("prepforge-text-size") !== null);
  const [textSize, setTextSize] = useState<TextSize>(storedTextSize);
  useEffect(() => {
    document.documentElement.dataset.textSize = textSize;
    localStorage.setItem("prepforge-text-size", textSize);
  }, [textSize]);
  return { textSize, setTextSize, hadSavedPreference };
}

function ThemeButton({ dark, toggle }: { dark: boolean; toggle: () => void }) {
  return (
    <button className="icon-button" type="button" aria-label={`Switch to ${dark ? "light" : "dark"} theme`} onClick={toggle}>
      {dark ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}

function Logo({ small = false }: { small?: boolean }) {
  return (
    <Link to="/" className={`logo${small ? " logo-small" : ""}`} aria-label="PrepForge home">
      <span className="logo-mark"><Zap size={small ? 16 : 19} fill="currentColor" /></span>
      <span>prep<span className="logo-accent">forge</span></span>
    </Link>
  );
}

function LandingPage({ dark, toggle, textSize, onTextSizeChange }: { dark: boolean; toggle: () => void; textSize: TextSize; onTextSizeChange: (value: TextSize) => Promise<void> }) {
  const { data } = useQuery({ queryKey: ["me"], queryFn: api.me, retry: false });
  if (data?.user) return <Navigate to={data.user.profile.onboardingComplete ? "/app" : "/onboarding"} replace />;

  const tracks = [
    { icon: BookOpenCheck, title: "Interview practice", text: "Build confidence with focused, role-relevant questions.", color: "violet" },
    { icon: Code2, title: "Coding challenges", text: "Turn problem-solving into a daily, measurable habit.", color: "cyan" },
    { icon: FileText, title: "Resume that gets read", text: "Showcase your strengths with a clear, polished resume.", color: "amber" },
  ];

  return (
    <div className="landing">
      <nav className="marketing-nav page-width">
        <Logo />
        <div className="nav-links"><a href="#how-it-works">How it works</a><a href="#tracks">Your prep, in one place</a></div>
        <div className="nav-actions">
          <TextSizeControl value={textSize} onChange={onTextSizeChange} />
          <ThemeButton dark={dark} toggle={toggle} />
          <Link className="nav-login" to="/login">Log in</Link>
          <Link className="button button-primary button-small" to="/signup">Get started <ArrowRight size={15} /></Link>
        </div>
      </nav>

      <main>
        <section className="hero page-width">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-dot" /> YOUR NEXT CHAPTER STARTS HERE</div>
            <h1>Build the skills.<br /><span className="gradient-text">Forge the future.</span></h1>
            <p className="hero-description">The career prep workspace that turns “I should practice” into “I’m ready.” Everything you need for the hiring process, in one focused place.</p>
            <div className="hero-actions">
              <Link className="button button-primary button-large" to="/signup">Start building momentum <ArrowRight size={17} /></Link>
              <a className="text-link" href="#tracks"><span className="play-icon"><Play size={13} fill="currentColor" /></span> Explore the workspace</a>
            </div>
            <div className="hero-social"><div className="avatar-stack"><span>J</span><span>M</span><span>A</span><span>K</span></div><span>A little better, every day.</span><span className="social-star">✳</span></div>
          </div>

          <div className="hero-art" aria-label="Preview of the PrepForge career preparation workspace">
            <div className="orbit orbit-one" /><div className="orbit orbit-two" />
            <div className="hero-glow" />
            <div className="preview-window">
              <div className="preview-top"><div className="window-dots"><i /><i /><i /></div><span>YOUR PREP WORKSPACE</span><span className="preview-live"><i /> LIVE</span></div>
              <div className="preview-content">
                <div className="preview-greeting"><div><span className="preview-date">MONDAY, YOUR DAY ONE</span><h3>Your next opportunity<br />is worth preparing for.</h3></div><div className="mini-avatar">JD</div></div>
                <div className="preview-stats">
                  <div className="preview-stat"><span className="stat-icon lavender"><Target size={15} /></span><span className="stat-label">YOUR FOCUS</span><strong>Software Engineer</strong><small>Built around your goals</small></div>
                  <div className="preview-stat"><span className="stat-icon mint"><Flame size={15} /></span><span className="stat-label">DAILY GOAL</span><strong>30 minutes</strong><small>Small steps. Real progress.</small></div>
                </div>
                <div className="preview-next">
                  <div className="next-icon"><Sparkles size={17} /></div><div className="next-copy"><span className="stat-label">YOUR FIRST STEP</span><strong>Set your career direction</strong></div><ArrowUpRight className="next-arrow" size={17} />
                </div>
                <div className="preview-bottom"><span><span className="bottom-check"><Check size={11} /></span> One workspace, your whole job search</span><span>01 / 04</span></div>
              </div>
            </div>
            <div className="floating-chip chip-top"><span className="chip-bolt"><Zap size={13} fill="currentColor" /></span> Make progress visible</div>
            <div className="floating-chip chip-bottom"><span className="chip-lock"><ShieldCheck size={14} /></span> Your goals. Your pace.</div>
          </div>
          <div className="hero-orb orb-a" /><div className="hero-orb orb-b" />
        </section>

        <section className="trust-bar page-width" aria-label="Product values">
          <span>MADE FOR THE MOMENT BEFORE <span className="trust-em">“YOU’RE HIRED.”</span></span>
          <div className="trust-items"><span><Check size={14} /> One clear plan</span><span><Check size={14} /> Practice that sticks</span><span><Check size={14} /> Progress you can see</span></div>
        </section>

        <section className="tracks-section page-width" id="tracks">
          <div className="section-heading"><div><div className="eyebrow"><span className="eyebrow-dot" /> BUILT FOR THE WHOLE JOURNEY</div><h2>Less tab switching.<br /><span className="muted-heading">More forward motion.</span></h2></div><p>From the first practice question to the final interview, your preparation stays organized around one thing: <strong>you.</strong></p></div>
          <div className="track-grid">{tracks.map((track, index) => <motion.article className="track-card" key={track.title} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ delay: index * 0.08, duration: 0.45 }}><div className={`track-icon ${track.color}`}><track.icon size={19} /></div><h3>{track.title}</h3><p>{track.text}</p><span className="card-arrow"><ArrowUpRight size={17} /></span></motion.article>)}</div>
        </section>

        <section className="how-section page-width" id="how-it-works">
          <div className="how-inner"><div><div className="eyebrow"><span className="eyebrow-dot" /> A BETTER WAY TO GET READY</div><h2>Your ambition,<br />with a <span className="gradient-text">game plan.</span></h2><p>Start with where you want to go. PrepForge helps you shape the daily practice that gets you closer—without making the process feel like another full-time job.</p><Link className="button button-primary" to="/signup">Create your free account <ArrowRight size={16} /></Link></div><div className="how-steps"><div className="how-step"><span className="step-num">01</span><div><strong>Tell us where you're headed</strong><p>Set your target role, experience level, and daily rhythm.</p></div></div><div className="how-step"><span className="step-num">02</span><div><strong>Practice with a purpose</strong><p>Build the interview, coding, and communication skills your next role needs.</p></div></div><div className="how-step"><span className="step-num">03</span><div><strong>Show up ready</strong><p>See your momentum grow and walk into every opportunity with confidence.</p></div></div></div></div>
        </section>
      </main>
      <footer className="marketing-footer page-width"><Logo small /><span>Built for the work behind the offer.</span><a href="#tracks">Explore PrepForge <ArrowDownRight size={13} /></a></footer>
    </div>
  );
}

function AuthPage({ dark, toggle, textSize, onTextSizeChange }: { dark: boolean; toggle: () => void; textSize: TextSize; onTextSizeChange: (value: TextSize) => Promise<void> }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const location = useLocation();
  const signup = location.pathname === "/signup";
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { data: current } = useQuery({ queryKey: ["me"], queryFn: api.me, retry: false });

  if (current?.user) return <Navigate to={current.user.profile.onboardingComplete ? "/app" : "/onboarding"} replace />;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    if (password.length < 10) {
      setError("Use at least 10 characters for your password.");
      return;
    }
    if (signup && name.trim().length < 2) {
      setError("Enter your name.");
      return;
    }
    setSubmitting(true);
    try {
      if (signup) {
        const signupResult = await api.signup(email.trim(), name.trim(), password);
        if (signupResult.confirmationRequired) {
          setError("Check your email to confirm your account, then come back here to log in.");
          return;
        }
        const result = signupResult.data;
        queryClient.setQueryData(["me"], result);
        navigate(result.user.profile.onboardingComplete ? "/app" : "/onboarding", { replace: true });
        return;
      }
      const result = await api.login(email.trim(), password);
      queryClient.setQueryData(["me"], result);
      navigate(result.user.profile.onboardingComplete ? "/app" : "/onboarding", { replace: true });
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "We couldn't complete that request.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <header className="auth-top"><Logo /><div className="auth-top-controls"><TextSizeControl value={textSize} onChange={onTextSizeChange} /><ThemeButton dark={dark} toggle={toggle} /></div></header>
      <main className="auth-layout">
        <section className="auth-pitch"><div className="eyebrow"><span className="eyebrow-dot" /> YOUR FUTURE, UNDER CONSTRUCTION</div><h1>Make your next<br />move <span className="gradient-text">your best.</span></h1><p>A little intentional preparation can change everything. Let's make yours count.</p><div className="auth-benefits"><span><Check size={15} /> Built around your career goals</span><span><Check size={15} /> All your prep, in one place</span><span><Check size={15} /> Your pace. Your progress.</span></div><div className="auth-decoration"><span>01</span><div /><span>YOUR STORY IS STILL BEING WRITTEN</span></div></section>
        <section className="auth-card"><div className="auth-card-head"><span className="auth-icon"><LockKeyhole size={18} /></span><span className="auth-kicker">{signup ? "YOUR NEXT CHAPTER" : "GOOD TO SEE YOU"}</span></div><h2>{signup ? "Create your account" : "Welcome back"}</h2><p className="auth-subtitle">{signup ? "Let's build a plan that gets you there." : "Pick up right where your momentum left off."}</p>
          <form className="form-stack" onSubmit={submit}>
            {signup && <label className="field"><span>Your name</span><input autoComplete="name" placeholder="Jordan Lee" value={name} onChange={(event) => setName(event.target.value)} /></label>}
            <label className="field"><span>Email address</span><input type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
            <label className="field"><span>Password</span><input type="password" autoComplete={signup ? "new-password" : "current-password"} placeholder={signup ? "At least 10 characters" : "Your password"} value={password} onChange={(event) => setPassword(event.target.value)} /></label>
            {error && <div className="form-alert" role="alert">{error}</div>}
            <button className="button button-primary auth-submit" disabled={submitting}>{submitting ? "One moment…" : signup ? "Create my account" : "Log in"} <ArrowRight size={16} /></button>
          </form>
          <div className="auth-switch">{signup ? "Already have an account?" : "New to PrepForge?"} <Link to={signup ? "/login" : "/signup"}>{signup ? "Log in" : "Create an account"}</Link></div>
          <div className="auth-privacy"><ShieldCheck size={14} /> Your account is protected by Supabase Auth.</div>
        </section>
      </main>
      <footer className="auth-footer"><Link to="/">← Back to PrepForge</Link><span>MAKE YOUR NEXT MOVE COUNT</span></footer>
    </div>
  );
}

function OnboardingPage({ user, onSaved, dark, toggle, textSize, onTextSizeChange }: { user: PublicUser; onSaved: (user: PublicUser) => void; dark: boolean; toggle: () => void; textSize: TextSize; onTextSizeChange: (value: TextSize) => Promise<void> }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [targetRole, setTargetRole] = useState(user.profile.targetRole || "");
  const [experience, setExperience] = useState<OnboardingInput["experienceLevel"]>(user.profile.experienceLevel || "STUDENT");
  const [companyText, setCompanyText] = useState(user.profile.targetCompanies.join(", "));
  const [dailyGoal, setDailyGoal] = useState(user.profile.dailyGoalMinutes || 30);
  const save = useMutation({ mutationFn: api.saveOnboarding, onSuccess: (result) => { onSaved(result.user); navigate("/app", { replace: true }); } });
  const roles = ["Software Engineer", "Data Analyst", "Product Designer", "QA Engineer", "Product Manager", "Other"];

  function continueStep() {
    if (step === 1 && targetRole.trim().length < 2) { setError("Choose a target role to continue."); return; }
    setError("");
    setStep(2);
  }

  async function finish() {
    setError("");
    try {
      const companies = companyText.split(",").map((company) => company.trim()).filter(Boolean);
      await save.mutateAsync({ targetRole, experienceLevel: experience, targetCompanies: companies, dailyGoalMinutes: dailyGoal });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "We couldn't save your plan. Please try again.");
    }
  }

  return <div className="onboarding-page"><header className="onboarding-top"><Logo /><div className="onboarding-top-right"><span>LET'S SET YOUR DIRECTION</span><TextSizeControl value={textSize} onChange={onTextSizeChange} /><ThemeButton dark={dark} toggle={toggle} /></div></header><main className="onboarding-layout"><div className="onboarding-progress"><div className="progress-track"><span style={{ width: step === 1 ? "50%" : "100%" }} /></div><span>STEP {step} OF 2</span></div><section className="onboarding-card"><div className="onboarding-mark"><GraduationCap size={21} /></div>{step === 1 ? <><div className="eyebrow"><span className="eyebrow-dot" /> START WITH YOUR NORTH STAR</div><h1>Where do you want<br />to <span className="gradient-text">go next?</span></h1><p className="onboarding-description">A little direction helps us make your practice more meaningful. You can always change this later.</p><label className="field"><span>I'm working toward a role in…</span><select value={targetRole} onChange={(event) => setTargetRole(event.target.value)}><option value="">Choose a role</option>{roles.map((role) => <option key={role} value={role}>{role}</option>)}</select></label><label className="field"><span>Where are you in your career?</span><select value={experience} onChange={(event) => setExperience(event.target.value as OnboardingInput["experienceLevel"])}><option value="STUDENT">Student</option><option value="ENTRY">Early career / recent graduate</option><option value="MID">Mid-career</option><option value="SENIOR">Experienced professional</option></select></label></> : <><div className="eyebrow"><span className="eyebrow-dot" /> MAKE IT YOURS</div><h1>Build a rhythm<br />that <span className="gradient-text">works for you.</span></h1><p className="onboarding-description">A small, consistent goal makes a big difference. Choose a target that fits your day.</p><label className="field"><span>Companies on your radar <small>(optional)</small></span><input value={companyText} onChange={(event) => setCompanyText(event.target.value)} placeholder="Google, Stripe, Shopify" /><small className="field-help">Separate company names with commas.</small></label><div className="field"><span className="goal-label">Daily practice goal</span><div className="goal-options">{[15, 30, 45, 60].map((minutes) => <button className={`goal-chip${dailyGoal === minutes ? " selected" : ""}`} key={minutes} type="button" onClick={() => setDailyGoal(minutes)}>{minutes} min</button>)}</div></div></>}{error && <p className="form-alert" role="alert">{error}</p>}<div className="onboarding-actions">{step === 2 && <button className="button button-quiet" type="button" onClick={() => { setStep(1); setError(""); }}>Back</button>}{step === 1 ? <button className="button button-primary onboarding-next" type="button" onClick={continueStep}>Continue <ArrowRight size={16} /></button> : <button className="button button-primary onboarding-next" type="button" disabled={save.isPending} onClick={finish}>{save.isPending ? "Saving your plan…" : "Build my workspace"} <ArrowRight size={16} /></button>}</div><div className="onboarding-skip">You can update these preferences anytime in your profile.</div></section><div className="onboarding-footnote"><ShieldCheck size={14} /> Built around your goals, not someone else's checklist.</div></main></div>;
}

function TextSizeControl({ value, onChange }: { value: TextSize; onChange: (value: TextSize) => void }) {
  const [error, setError] = useState("");
  async function change(next: TextSize) {
    setError("");
    try {
      await onChange(next);
    } catch (changeError) {
      setError(changeError instanceof Error ? changeError.message : "Text preference could not be saved.");
    }
  }
  return <label className="text-size-control"><span>Text size</span><select aria-label="Text size" value={value} onChange={(event) => void change(event.target.value as TextSize)}><option value="LARGE">Large</option><option value="EXTRA_LARGE">Extra Large</option><option value="HUGE">Huge</option></select>{error && <span className="text-size-error" role="alert">{error}</span>}</label>;
}

function SettingsPage({ textSize, onTextSizeChange }: { textSize: TextSize; onTextSizeChange: (value: TextSize) => void }) {
  return <section className="settings-page"><span className="eyebrow">YOUR WORKSPACE</span><h1>Settings</h1><p>Make PrepForge comfortable for you. Your choices are saved to this device and your profile.</p><div className="settings-card"><h2>Readability</h2><p>Choose a comfortable text size. This setting applies throughout the workspace.</p><TextSizeControl value={textSize} onChange={onTextSizeChange} /></div></section>;
}

const sidebarLinks = [
  { label: "Overview", icon: LayoutDashboard, href: "/app" },
  { label: "Question practice", icon: BookOpenCheck, href: "/app/practice" },
  { label: "Coding challenges", icon: Code2, href: "/app/coding" },
  { label: "HR preparation", icon: Mic2, href: "/app/hr" },
  { label: "Resume builder", icon: FileText, href: "/app/resume" },
  { label: "Mock interview", icon: Users, href: "/app/interview" },
  { label: "Progress", icon: Award, href: "/app/progress" },
  { label: "Settings", icon: Settings, href: "/app/settings" },
];

function AppShell({ user, onLogout, dark, toggle, textSize, onTextSizeChange, children }: { user: PublicUser; onLogout: () => void; dark: boolean; toggle: () => void; textSize: TextSize; onTextSizeChange: (value: TextSize) => Promise<void>; children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const initials = user.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase();

  return <div className={`app-frame${mobileOpen ? " nav-open" : ""}`}><aside className={`sidebar${mobileOpen ? " mobile-open" : ""}`}><div className="sidebar-brand"><Logo small /><button className="icon-button mobile-menu-close" type="button" aria-label="Close menu" onClick={() => setMobileOpen(false)}>×</button></div><div className="workspace-switcher"><div className="workspace-avatar"><Zap size={28} fill="currentColor" /></div><div><strong>Personal workspace</strong><small>ALL ACCESS</small></div><ChevronDown size={28} /></div><div className="sidebar-label">WORKSPACE</div><nav className="sidebar-nav">{sidebarLinks.map((link) => <Link className={`sidebar-link${location.pathname === link.href ? " active" : ""}`} to={link.href} key={link.href} onClick={() => setMobileOpen(false)}><link.icon size={28} /><span>{link.label}</span></Link>)}</nav><div className="sidebar-label sidebar-label-lower">YOUR JOURNEY</div><div className="sidebar-journey"><div className="journey-icon"><Target size={28} /></div><strong>{user.profile.targetRole}</strong><span>YOUR CAREER FOCUS</span><div className="journey-line" /><div className="journey-goal"><span>Daily practice goal</span><b>{user.profile.dailyGoalMinutes} min</b></div></div><div className="sidebar-bottom"><div className="sidebar-help"><CircleHelp size={28} /><div><strong>Here to help</strong><span>Build one step at a time.</span></div><ArrowUpRight size={28} /></div><button className="profile-button" type="button" onClick={() => setMenuOpen((open) => !open)}><span className="user-avatar">{initials}</span><span className="profile-info"><strong>{user.name}</strong><small>{user.email}</small></span><ChevronDown size={28} /></button>{menuOpen && <div className="account-menu"><div className="account-menu-title">Signed in as {user.email}</div><button type="button" onClick={() => { onLogout(); setMenuOpen(false); }}>Log out</button></div>}</div></aside>{mobileOpen && <button className="mobile-scrim" type="button" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}<div className="app-main"><header className="app-topbar"><button className="icon-button mobile-menu-open" aria-label="Open navigation" type="button" onClick={() => setMobileOpen(true)}><span>☰</span></button><div className="breadcrumbs"><span>Workspace</span><span>/</span><strong>{sidebarLinks.find((link) => link.href === location.pathname)?.label ?? "Overview"}</strong></div><div className="topbar-right"><span className="today-label">YOUR NEXT CHAPTER, IN THE MAKING</span><TextSizeControl value={textSize} onChange={onTextSizeChange} /><ThemeButton dark={dark} toggle={toggle} /><button className="top-avatar" aria-label={`Account menu for ${user.name}`} type="button" onClick={() => setMenuOpen((open) => !open)}>{initials}</button></div></header><main className="dashboard-content">{children}</main></div></div>;
}

function Dashboard({ user }: { user: PublicUser }) {
  const firstName = user.name.split(/\s+/)[0] ?? user.name;
  const companyNames = user.profile.targetCompanies;
  return <motion.div className="dashboard-enter" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
    <div className="welcome-row"><div><div className="eyebrow"><span className="eyebrow-dot" /> YOUR PERSONAL WORKSPACE</div><h1>Good morning, {firstName}<span className="wave">✳</span></h1><p>Your next opportunity is worth showing up for. Let's make today's practice count.</p></div><div className="welcome-date"><span>YOUR FOCUS</span><strong>{user.profile.targetRole}</strong></div></div>
    <section className="daily-banner"><div className="banner-pattern" /><div className="daily-banner-content"><div className="banner-copy"><span className="banner-kicker"><Sparkles size={14} /> THE POWER OF SHOWING UP</span><h2>Your goal isn't to be ready today.<br /><span>It's to be readier than yesterday.</span></h2><p>Your daily {user.profile.dailyGoalMinutes}-minute practice goal is a promise to the future you. Keep it small. Keep it yours.</p><div className="banner-chips"><span><Target size={13} /> {user.profile.dailyGoalMinutes} min daily goal</span>{user.profile.experienceLevel && <span><GraduationCap size={14} /> {experienceLabel(user.profile.experienceLevel)}</span>}</div></div><div className="banner-art"><div className="banner-ring ring-outer" /><div className="banner-ring ring-inner" /><div className="banner-center"><Zap size={29} fill="currentColor" /></div><span className="banner-orbit-star star-a">✳</span><span className="banner-orbit-star star-b">✦</span><span className="banner-orbit-dot dot-a" /><span className="banner-orbit-dot dot-b" /></div></div></section>
    <div className="section-title-row"><div><h2>Your starting point</h2><p>A plan shaped around where you want to go.</p></div><span className="starting-tag"><Check size={13} /> YOUR FOUNDATION</span></div>
    <section className="starting-grid"><article className="starting-card role-card"><div className="starting-icon icon-violet"><BriefcaseBusiness size={17} /></div><span className="starting-label">TARGET ROLE</span><strong>{user.profile.targetRole}</strong><small>Your north star for every practice session.</small></article><article className="starting-card goal-card"><div className="starting-icon icon-teal"><Flame size={17} /></div><span className="starting-label">DAILY PRACTICE</span><strong>{user.profile.dailyGoalMinutes} <small>minutes</small></strong><small>Progress starts with showing up.</small></article><article className="starting-card level-card"><div className="starting-icon icon-amber"><Award size={17} /></div><span className="starting-label">YOUR EXPERIENCE</span><strong>{experienceLabel(user.profile.experienceLevel)}</strong><small>Your journey is uniquely yours.</small></article></section>
    <section className="companies-row"><div className="companies-heading"><div className="companies-icon"><Users size={16} /></div><div><strong>Companies on your radar</strong><span>Keep your ambition where you can see it.</span></div></div><div className="company-tags">{companyNames.length > 0 ? companyNames.map((company) => <span className="company-tag" key={company}>{company}</span>) : <span className="empty-companies">Add your dream companies anytime in your profile.</span>}</div><ArrowUpRight className="companies-arrow" size={15} /></section>
    <section className="next-step-card"><div className="next-step-icon"><Zap size={28} fill="currentColor" /></div><div className="next-step-copy"><span>ONE STEP AT A TIME</span><strong>Your question practice is ready.</strong><p>Build confidence with focused questions, instant feedback, and timed tests.</p><Link className="button button-primary" to="/app/practice">Start practicing <ArrowRight size={22} /></Link></div><div className="next-step-note"><div className="next-step-indicator"><i /><span>YOUR NEXT STEP</span></div><span>THE JOURNEY IS YOURS</span></div></section>
  </motion.div>;
}

function experienceLabel(level: PublicUser["profile"]["experienceLevel"]) {
  const labels: Record<PublicUser["profile"]["experienceLevel"], string> = {
    "": "Not set",
    STUDENT: "Student",
    ENTRY: "Early career",
    MID: "Mid-career",
    SENIOR: "Experienced",
  };
  return labels[level];
}

function AuthenticatedRoutes({ user, dark, toggle, textSize, onTextSizeChange }: { user: PublicUser; dark: boolean; toggle: () => void; textSize: TextSize; onTextSizeChange: (value: TextSize) => Promise<void> }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  async function logout() {
    await api.logout();
    queryClient.removeQueries({ queryKey: ["me"] });
    navigate("/", { replace: true });
  }
  if (!user.profile.onboardingComplete) return <OnboardingPage user={user} onSaved={(updated) => { queryClient.setQueryData(["me"], { user: updated }); }} dark={dark} toggle={toggle} textSize={textSize} onTextSizeChange={onTextSizeChange} />;
  const content = location.pathname.endsWith("/practice")
    ? <PracticePage />
    : location.pathname.endsWith("/coding")
      ? <CodingPage />
      : location.pathname.endsWith("/hr")
        ? <HrPage />
        : location.pathname.endsWith("/resume")
          ? <ResumePage />
          : location.pathname.endsWith("/interview")
            ? <InterviewPage />
            : location.pathname.endsWith("/progress")
              ? <ProgressPage />
              : location.pathname.endsWith("/settings")
                ? <SettingsPage textSize={textSize} onTextSizeChange={onTextSizeChange} />
                : <Dashboard user={user} />;
  return <AppShell user={user} onLogout={() => { void logout(); }} dark={dark} toggle={toggle} textSize={textSize} onTextSizeChange={onTextSizeChange}>{content}</AppShell>;
}

function LoadingScreen() {
  return <div className="loading-screen"><div className="loading-logo"><Zap size={18} fill="currentColor" /></div><span>Finding your footing…</span></div>;
}

export default function App() {
  const theme = useTheme();
  const text = useTextSize();
  const queryClient = useQueryClient();
  const location = useLocation();
  const { data, isPending } = useQuery({ queryKey: ["me"], queryFn: api.me, retry: false });
  const user = data?.user;
  useEffect(() => {
    if (user && !text.hadSavedPreference.current) {
      text.hadSavedPreference.current = true;
      text.setTextSize(user.profile.textSize);
    }
  }, [user, text]);
  async function changeTextSize(value: TextSize) {
    text.setTextSize(value);
    const current = queryClient.getQueryData<AuthResponse>(["me"]);
    if (!current?.user) return;
    const updated = await api.saveTextSize(value);
    queryClient.setQueryData(["me"], updated);
  }
  const publicPath = ["/", "/login", "/signup"].includes(location.pathname);
  if (isPending && !publicPath) return <LoadingScreen />;

  return <Routes>
    <Route path="/" element={<LandingPage dark={theme.dark} toggle={theme.toggle} textSize={text.textSize} onTextSizeChange={changeTextSize} />} />
    <Route path="/login" element={<AuthPage dark={theme.dark} toggle={theme.toggle} textSize={text.textSize} onTextSizeChange={changeTextSize} />} />
    <Route path="/signup" element={<AuthPage dark={theme.dark} toggle={theme.toggle} textSize={text.textSize} onTextSizeChange={changeTextSize} />} />
    <Route path="/onboarding" element={user ? (user.profile.onboardingComplete ? <Navigate to="/app" replace /> : <OnboardingPage user={user} onSaved={(updated) => queryClient.setQueryData(["me"], { user: updated })} dark={theme.dark} toggle={theme.toggle} textSize={text.textSize} onTextSizeChange={changeTextSize} />) : <Navigate to="/login" replace />} />
    <Route path="/app/*" element={user ? <AuthenticatedRoutes user={user} dark={theme.dark} toggle={theme.toggle} textSize={text.textSize} onTextSizeChange={changeTextSize} /> : <Navigate to="/login" replace />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>;
}
