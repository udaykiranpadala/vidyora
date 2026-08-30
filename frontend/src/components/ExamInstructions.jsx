import { useState } from "react";
import Button from "./Button";
import ThemeToggle from "./ThemeToggle";

export default function ExamInstructions({
  examTitle,
  totalQuestions,
  settings = {},
  candidateName,
  candidateRollNumber,
  candidateYear,
  candidateBranch,
  candidateSection,
  onStartExam,
  submitting,
  countdownSeconds,
  formatLobbyTime
}) {
  const [acknowledged, setAcknowledged] = useState(false);

  // Generate configuration-driven instructions dynamically
  const getDynamicRules = () => {
    // If organizer configured custom instructions, render only enabled rules
    if (settings.instructions && Array.isArray(settings.instructions) && settings.instructions.length > 0) {
      return settings.instructions.filter((inst) => inst.enabled !== false);
    }

    const rules = [];

    // 1. Duration & Timing
    if (settings.duration) {
      rules.push({
        id: "duration",
        icon: "⏱️",
        category: "Exam Timing",
        title: `Duration: ${settings.duration} Minutes`,
        description: `The total time allowed for this examination is ${settings.duration} minutes. The countdown timer starts as soon as you click 'Start Examination'.`
      });
    }

    if (settings.enablePerQuestionTimer) {
      rules.push({
        id: "per_question_timer",
        icon: "⌛",
        category: "Timing Rule",
        title: "Independent Per-Question Timers Enabled",
        description: "Each question has an individual time limit. Remaining time for a question pauses when switching away and resumes when reopened."
      });
    }

    // 2. Anti-Cheat Security & Restrictions
    if (settings.enableFullScreen !== false) {
      rules.push({
        id: "fullscreen",
        icon: "🖥️",
        category: "Security Rule",
        title: "Mandatory Full-Screen Mode",
        description: "This exam must be taken in full-screen mode. Exiting full-screen mode or minimizing the browser window will trigger a security violation flag."
      });
    }

    if (settings.disableCopy !== false || settings.disablePaste !== false || settings.disableRightClick !== false) {
      rules.push({
        id: "clipboard_restriction",
        icon: "🚫",
        category: "Anti-Cheat Policy",
        title: "Clipboard & Context Menu Disabled",
        description: "Copying text (Ctrl+C), Pasting (Ctrl+V), Cutting (Ctrl+X), and Right-Click context menus are strictly prohibited and disabled during the exam."
      });
    }

    const warningLimit = settings.warningLimit || 3;
    rules.push({
      id: "violation_policy",
      icon: "⚠️",
      category: "Violation Policy",
      title: `Maximum Warning Limit: ${warningLimit} Violations`,
      description: settings.autoSubmit !== false
        ? `Tab switches, window swapping, or exiting full-screen mode will log a security violation. Exceeding ${warningLimit} warnings will AUTO-SUBMIT your exam immediately.`
        : `Security violations (tab switches, fullscreen exits) will be permanently logged and reviewed by the examination board.`
    });

    // 3. Question Navigation Rules
    if (settings.singleQuestionMode) {
      rules.push({
        id: "single_question_mode",
        icon: "📋",
        category: "Navigation Mode",
        title: "Single Question Overview Mode",
        description: "You can view the full question list first, then open and attempt individual questions one at a time."
      });
    } else if (settings.sequentialNavigation) {
      rules.push({
        id: "sequential_nav",
        icon: "➡️",
        category: "Navigation Mode",
        title: "Strict Sequential Question Order",
        description: "Questions must be answered in order. You cannot navigate backwards to previous questions once you move forward."
      });
    } else {
      rules.push({
        id: "random_nav",
        icon: "🔀",
        category: "Navigation Mode",
        title: "Flexible Question Navigation",
        description: "You may attempt questions in any order using the question map panel and switch between questions freely before final submission."
      });
    }

    if (settings.lockQuestions) {
      rules.push({
        id: "lock_on_submit",
        icon: "🔒",
        category: "Response Locking",
        title: "Responses Locked Upon Submission",
        description: "Once an answer or code solution is submitted, it cannot be modified or re-attempted."
      });
    }

    // 4. Scoring & Marking System
    if (settings.showNegativeMarks) {
      rules.push({
        id: "negative_marking",
        icon: "🎯",
        category: "Scoring System",
        title: "Negative Marking Rules Apply",
        description: "Review question points carefully before selecting options. Incorrect responses may incur negative penalty points."
      });
    }

    if (settings.partialScoring !== false) {
      rules.push({
        id: "partial_scoring",
        icon: "⭐",
        category: "Coding Evaluation",
        title: "Partial Test-Case Scoring Enabled",
        description: "Coding problems award partial points for every individual test case your program passes successfully."
      });
    }

    // 5. Code Execution Environment
    const langs = (settings.allowedLanguages && settings.allowedLanguages.length > 0)
      ? settings.allowedLanguages.map(l => l.toUpperCase()).join(", ")
      : "Python, C, C++, Java, JavaScript";

    rules.push({
      id: "coding_environment",
      icon: "💻",
      category: "Compiler Environment",
      title: `Allowed Programming Languages: ${langs}`,
      description: `Supported compilers: ${langs}. You can execute your code against sample test cases using the Monaco Code Editor.`
    });

    return rules;
  };

  const dynamicRules = getDynamicRules();

  return (
    <div className="min-h-screen bg-paper font-expert flex flex-col text-ink selection:bg-accent/20">
      {/* Header Bar */}
      <header className="border-b border-line bg-surface sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent font-bold text-lg">
              📜
            </div>
            <div>
              <h1 className="font-display font-extrabold text-base md:text-lg tracking-tight text-ink leading-tight">
                Vidyora Examination Portal
              </h1>
              <p className="text-[11px] text-ink-secondary">Official Candidate Pre-Exam Instructions & Verification</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
              Secure Session Active
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-6 py-8 flex-1 flex flex-col gap-6 w-full">
        {/* Candidate & Assessment Metadata Banner */}
        <div className="bg-surface border border-line rounded-3xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="inline-block px-3 py-1 rounded-lg bg-accent-soft text-accent text-xs font-mono font-extrabold uppercase tracking-wider mb-2">
              Official Assessment
            </span>
            <h2 className="font-display text-2xl md:text-3xl font-extrabold text-ink tracking-tight">
              {examTitle || "Examination Assessment"}
            </h2>
            <p className="text-xs md:text-sm text-ink-secondary mt-1">
              Please read all rules, candidate instructions, and system requirements carefully before proceeding.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-card p-4 rounded-2xl border border-line text-xs">
            <div className="sm:col-span-2 md:col-span-1 min-w-0">
              <span className="text-ink-secondary block text-[10px] uppercase font-bold tracking-wider">Candidate Name</span>
              <span className="font-bold text-ink block mt-0.5 break-words whitespace-normal leading-tight">{(candidateName || "Candidate").toUpperCase()}</span>
            </div>
            <div>
              <span className="text-ink-secondary block text-[10px] uppercase font-bold tracking-wider">Roll Number</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 block mt-0.5">
                {candidateRollNumber || "N/A"}
              </span>
            </div>
            <div>
              <span className="text-ink-secondary block text-[10px] uppercase font-bold tracking-wider">Questions</span>
              <span className="font-mono font-bold text-ink block mt-0.5">{totalQuestions || 0} Questions</span>
            </div>
            <div>
              <span className="text-ink-secondary block text-[10px] uppercase font-bold tracking-wider">Time Limit</span>
              <span className="font-mono font-bold text-accent block mt-0.5">{settings.duration || 60} mins</span>
            </div>
          </div>
        </div>

        {/* Dynamic Rules Grid */}
        <div className="bg-surface border border-line rounded-3xl p-6 md:p-8 shadow-sm flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-line pb-4">
            <div>
              <h3 className="font-display font-extrabold text-lg text-ink">
                Examination Rules & Operating Instructions
              </h3>
              <p className="text-xs text-ink-secondary mt-0.5">
                Rules dynamically configured by the examination board for this session
              </p>
            </div>
            <span className="text-xs font-mono font-semibold bg-paper px-3 py-1.5 rounded-xl border border-line text-ink-secondary">
              {dynamicRules.length} Configured Rules
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dynamicRules.map((rule) => (
              <div
                key={rule.id}
                className="bg-card/50 border border-line rounded-2xl p-4 flex items-start gap-3.5 hover:border-accent/30 transition-all shadow-sm"
              >
                <div className="text-2xl p-2 rounded-xl bg-paper border border-line shrink-0 select-none">
                  {rule.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-accent block">
                    {rule.category}
                  </span>
                  <h4 className="font-bold text-sm text-ink mt-0.5">{rule.title}</h4>
                  <p className="text-xs text-ink-secondary leading-relaxed mt-1">{rule.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Academic Details Confirmation Box */}
          <div className="bg-card/75 border border-line rounded-2xl p-4 text-xs flex flex-wrap items-center justify-between gap-3 font-mono">
            <span className="text-ink-secondary font-sans font-semibold">Registered Academic Details:</span>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="bg-surface px-2.5 py-1 rounded-lg border border-line text-ink font-bold">Year: {candidateYear || "1st Year"}</span>
              <span className="bg-surface px-2.5 py-1 rounded-lg border border-line text-ink font-bold">Branch: {candidateBranch || "CSE"}</span>
              <span className="bg-surface px-2.5 py-1 rounded-lg border border-line text-ink font-bold">Section: {candidateSection || "A"}</span>
            </div>
          </div>
        </div>

        {/* Mandatory Acknowledgment & Start Action Card */}
        <div className="bg-surface border-2 border-accent/30 rounded-3xl p-6 md:p-8 shadow-xl flex flex-col gap-6">
          <label className="flex items-start gap-4 p-4 rounded-2xl bg-accent-soft/30 border border-accent/20 cursor-pointer hover:bg-accent-soft/50 transition-colors">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="w-5 h-5 rounded border-line text-accent focus:ring-accent accent-accent mt-0.5 cursor-pointer shrink-0"
            />
            <div className="text-xs md:text-sm text-ink leading-relaxed">
              <strong className="font-bold block text-ink text-sm md:text-base mb-0.5">
                Candidate Declaration & Acknowledgment
              </strong>
              I have read, understood, and agree to abide by all the examination rules, timing limits, and security policies listed above. I confirm that I will not attempt any unfair means or unauthorized assistance during this assessment.
            </div>
          </label>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-line">
            <div className="text-xs text-ink-secondary">
              {countdownSeconds > 0 ? (
                <span className="font-mono text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                  Scheduled Exam Starts In: {formatLobbyTime ? formatLobbyTime(countdownSeconds) : `${countdownSeconds}s`}
                </span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                  ✓ Examination is ready for launch
                </span>
              )}
            </div>

            <Button
              onClick={onStartExam}
              disabled={!acknowledged || submitting || countdownSeconds > 0}
              className="w-full sm:w-auto px-8 py-3.5 text-sm font-extrabold shadow-lg rounded-2xl disabled:opacity-40 cursor-pointer transition-all"
            >
              {submitting ? "Launching Environment..." : "Start Examination →"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
