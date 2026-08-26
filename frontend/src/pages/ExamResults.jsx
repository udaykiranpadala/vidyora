import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/client";
import Badge from "../components/Badge";
import ThemeToggle from "../components/ThemeToggle";

export default function ExamResults() {
  const { examId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [expandedQuestionKeys, setExpandedQuestionKeys] = useState(new Set());

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "completed" | "in_progress"

  // Deletion State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const toggleQuestionExpand = (attemptId, questionId) => {
    const key = `${attemptId}_${questionId}`;
    setExpandedQuestionKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const fetchResults = () => {
    setLoading(true);
    setErrorMsg("");
    api
      .get(`/exams/${examId}/results`)
      .then((res) => setData(res.data))
      .catch((err) => {
        console.error("Failed to load results:", err);
        setErrorMsg(err.response?.data?.message || "Could not load exam results.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchResults();
  }, [examId]);

  const [successMsg, setSuccessMsg] = useState("");

  const handleDeleteParticipant = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await api.delete(`/exams/${examId}/attempts/${deleteTarget._id}`);
      setData((prev) => ({
        ...prev,
        attempts: (prev?.attempts || []).filter((a) => a._id !== deleteTarget._id),
      }));
      setSuccessMsg(`Successfully deleted participant record for "${deleteTarget.candidateName}".`);
      setTimeout(() => setSuccessMsg(""), 5000);
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err.response?.data?.message || "Failed to delete participant record.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex flex-col font-expert">
        <header className="border-b border-line bg-surface sticky top-0 z-30 shadow-sm">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link to="/dashboard" className="text-sm text-ink/60 hover:text-ink font-semibold flex items-center gap-1">
              ← Back to Organizer Hub
            </Link>
            <ThemeToggle />
          </div>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center text-ink gap-3">
          <div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin"></div>
          <p className="font-mono text-xs tracking-wider text-ink-secondary animate-pulse">LOADING CANDIDATE RESULTS...</p>
        </div>
      </div>
    );
  }

  if (!data || errorMsg) {
    return (
      <div className="min-h-screen bg-paper flex flex-col font-expert">
        <header className="border-b border-line bg-surface sticky top-0 z-30 shadow-sm">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link to="/dashboard" className="text-sm text-ink/60 hover:text-ink font-semibold flex items-center gap-1">
              ← Back to Organizer Hub
            </Link>
            <ThemeToggle />
          </div>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center text-ink gap-4 p-6 text-center">
          <div className="text-4xl">⚠️</div>
          <h2 className="font-display font-bold text-lg text-ink">Failed to Load Results</h2>
          <p className="text-xs text-ink-secondary max-w-sm">{errorMsg || "The requested exam results could not be retrieved."}</p>
          <div className="flex items-center gap-3 mt-2">
            <Link to="/dashboard" className="px-4 py-2 bg-surface border border-line rounded-xl text-xs font-bold text-ink hover:bg-card">
              Back to Organizer Hub
            </Link>
            <button onClick={fetchResults} className="px-4 py-2 bg-accent text-white rounded-xl text-xs font-bold hover:bg-accent-hover cursor-pointer">
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { exam = {}, questions = [], attempts = [] } = data;
  const maxScore = questions.reduce((sum, q) => sum + (q.totalPoints || 0), 0);

  // Search & Filter Candidates
  const filteredAttempts = attempts.filter((attempt) => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      (attempt.candidateName || "").toLowerCase().includes(term) ||
      (attempt.candidateRollNumber || "").toLowerCase().includes(term) ||
      (attempt.candidateBranch || "").toLowerCase().includes(term) ||
      (attempt.candidateSection || "").toLowerCase().includes(term) ||
      (attempt.candidateYear || "").toLowerCase().includes(term);

    const matchesStatus =
      statusFilter === "all" || attempt.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-paper font-expert text-ink">
      <header className="border-b border-line bg-surface sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to={`/exams/${examId}`} className="text-sm text-ink/60 hover:text-ink font-semibold flex items-center gap-1">
            ← Back to exam
          </Link>
          <div className="flex items-center gap-4">
            <Link
              to={`/leaderboard/${exam.accessCode}`}
              target="_blank"
              className="text-sm text-accent font-semibold hover:underline"
            >
              View public leaderboard →
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-extrabold text-ink">
              {exam.title} — Results & Participant Management
            </h1>
            <p className="text-xs text-ink-secondary mt-1">
              Search, review, analyze breakdown, and manage candidate exam submissions
            </p>
          </div>
        </div>

        {successMsg && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <span>✓</span>
            <span>{successMsg}</span>
          </div>
        )}

        {/* Overview Stats */}
        <div className="flex flex-wrap items-center gap-4 text-sm mb-6 bg-card border border-line p-4 rounded-2xl">
          <span className="text-ink/80 font-semibold">{attempts.length} Candidate{attempts.length !== 1 && "s"} Total</span>
          <span className="h-4 w-px bg-line" />
          <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            {attempts.filter(a => a.status === "completed").length} Completed
          </span>
          <span className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-full text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
            {attempts.filter(a => a.status !== "completed").length} Incomplete / In-Progress
          </span>
          <span className="h-4 w-px bg-line" />
          <span className="text-ink/80 font-mono text-xs font-semibold">Max score {maxScore} pts</span>
        </div>

        {/* Participant Search Bar & Filter Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
          <div className="relative flex-1 w-full">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-secondary text-sm">
              🔍
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search candidate by name, roll number, department, section or year..."
              className="w-full pl-10 pr-8 py-2.5 bg-surface border border-line rounded-xl text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-secondary hover:text-ink"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 bg-surface border border-line rounded-xl text-xs font-semibold text-ink outline-none cursor-pointer"
            >
              <option value="all">All Statuses ({attempts.length})</option>
              <option value="completed">Completed ({attempts.filter(a => a.status === "completed").length})</option>
              <option value="in_progress">Incomplete ({attempts.filter(a => a.status !== "completed").length})</option>
            </select>
          </div>
        </div>

        {/* Participant List */}
        {filteredAttempts.length === 0 ? (
          <div className="border border-dashed border-line rounded-2xl py-16 text-center text-ink/60">
            {attempts.length === 0 ? "No candidate attempts yet." : "No participants match your search filters."}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredAttempts.map((attempt, idx) => (
              <div key={attempt._id} className={`bg-surface border rounded-xl transition-colors ${attempt.status !== "completed" ? "border-amber-500/30 bg-amber-500/[0.03]" : "border-line"}`}>
                <div className="w-full flex items-center justify-between p-4 gap-4">
                  <button
                    onClick={() => setExpandedId(expandedId === attempt._id ? null : attempt._id)}
                    className="flex-1 flex items-center gap-4 text-left cursor-pointer min-w-0"
                  >
                    <span className="font-mono text-ink/40 w-8 text-sm shrink-0">{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-ink text-sm truncate">
                          {attempt.candidateName}
                        </p>
                        {attempt.candidateRollNumber && (
                          <span className="text-emerald-600 dark:text-emerald-400 font-mono text-xs font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            {attempt.candidateRollNumber}
                          </span>
                        )}
                        {(attempt.candidateBranch || attempt.candidateYear || attempt.candidateSection) && (
                          <span className="text-xs text-ink-secondary bg-card border border-line px-2 py-0.5 rounded font-mono">
                            {[attempt.candidateYear, attempt.candidateBranch, attempt.candidateSection && `Sec ${attempt.candidateSection}`].filter(Boolean).join(" • ")}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs mt-1">
                        {attempt.status === "completed" ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                            Completed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                            Exited Early / Incomplete
                          </span>
                        )}

                        {(attempt.tabSwitchCount > 0 ||
                          attempt.fullscreenExitCount > 0 ||
                          attempt.pasteAttemptCount > 0) && (
                          <span className="text-warning font-semibold text-[11px] bg-warning-soft/30 px-2 py-0.5 rounded border border-warning/20">
                            ⚠️ Flagged Violations ({ (attempt.tabSwitchCount || 0) + (attempt.fullscreenExitCount || 0) + (attempt.pasteAttemptCount || 0) })
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-mono font-bold text-ink text-base">
                        {attempt.totalScore}
                        <span className="text-ink/40 text-xs">/{maxScore}</span>
                      </p>
                    </div>
                  </button>

                  {/* Actions: Delete Button */}
                  <div className="flex items-center gap-2 border-l border-line/60 pl-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(attempt)}
                      className="p-2 rounded-lg text-danger/70 hover:text-danger hover:bg-danger-soft/20 transition-all cursor-pointer"
                      title="Delete Participant Attempt Record"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {expandedId === attempt._id && (
                  <div className="border-t border-line p-4 flex flex-col gap-4 bg-paper/30">
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <Stat label="Tab switches" value={attempt.tabSwitchCount || 0} />
                      <Stat label="Fullscreen exits" value={attempt.fullscreenExitCount || 0} />
                      <Stat label="Copy/Paste attempts" value={attempt.pasteAttemptCount || 0} />
                    </div>

                    <div className="flex flex-col gap-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-ink-secondary">Question Breakdown</h4>
                      {questions.map((q) => {
                        const answer = (attempt.answers || []).find(
                          (a) => a?.question?.toString() === q._id?.toString()
                        );
                        const qKey = `${attempt._id}_${q._id}`;
                        const isQExpanded = expandedQuestionKeys.has(qKey);

                        return (
                          <div key={q._id} className="border border-line bg-card/40 rounded-xl overflow-hidden shadow-sm">
                            <button
                              type="button"
                              onClick={() => toggleQuestionExpand(attempt._id, q._id)}
                              className="w-full flex items-center gap-3 bg-paper hover:bg-card px-4 py-3 text-sm text-left transition-colors cursor-pointer"
                            >
                              <Badge variant={q.type}>{q.type === "mcq" ? "MCQ" : "Code"}</Badge>
                              <span className="flex-1 font-semibold truncate text-ink/80">{q.title}</span>
                              <div className="flex items-center gap-3">
                                {answer?.autoSubmitted && (
                                  <span className="text-[10px] bg-warning-soft text-warning border border-warning/30 px-2 py-0.5 rounded font-mono uppercase font-bold leading-none scale-90">auto-submitted</span>
                                )}
                                <span className="font-mono text-xs text-ink-secondary">
                                  Score: <span className="font-bold text-ink">{answer ? answer.pointsEarned : 0}</span>/{q.totalPoints}
                                </span>
                                <span className="text-ink-secondary/60 text-[10px]">{isQExpanded ? "▲" : "▼"}</span>
                              </div>
                            </button>

                            {isQExpanded && (
                              <div className="p-4 border-t border-line/60 bg-surface/50 text-xs flex flex-col gap-3.5">
                                {/* Statement */}
                                <div className="text-ink/85 whitespace-pre-wrap leading-relaxed border-b border-line/40 pb-3 font-sans">
                                  <strong className="text-ink-secondary block uppercase text-[10px] font-bold tracking-wider mb-1.5">Question Statement:</strong>
                                  {q.statement || "(no statement)"}
                                </div>

                                {/* Answers detail based on type */}
                                {q.type === "mcq" ? (
                                  <div className="flex flex-col gap-2.5">
                                    <strong className="text-ink-secondary block uppercase text-[10px] font-bold tracking-wider mb-1">Candidate Options Choices:</strong>
                                    {q.options && q.options.length > 0 ? (
                                      <div className="grid grid-cols-1 gap-2">
                                        {q.options.map((opt, optIdx) => {
                                          const isSelected = answer?.selectedOptionIndex === optIdx;
                                          const isCorrect = opt.isCorrect;

                                          let optBg = "bg-card/50 border-line";
                                          let optText = "text-ink/80";
                                          let badge = null;

                                          if (isCorrect) {
                                            optBg = "bg-emerald-500/10 border-emerald-500/25 dark:bg-emerald-500/5";
                                            optText = "text-emerald-600 dark:text-emerald-400 font-medium";
                                            badge = <span className="ml-auto px-2 py-0.5 rounded bg-emerald-500 text-white text-[9px] font-mono font-bold uppercase leading-none">Correct Answer</span>;
                                          }

                                          if (isSelected) {
                                            if (isCorrect) {
                                              optBg = "bg-emerald-500/15 border-emerald-500/35 border-2";
                                            } else {
                                              optBg = "bg-red-500/10 border-red-500/25 border-2 dark:bg-red-500/5";
                                              optText = "text-red-600 dark:text-red-400 font-medium";
                                              badge = <span className="ml-auto px-2 py-0.5 rounded bg-red-500 text-white text-[9px] font-mono font-bold uppercase leading-none">Student Selected (Wrong)</span>;
                                            }
                                          }

                                          return (
                                            <div key={optIdx} className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs ${optBg} ${optText}`}>
                                              <span className="w-5 h-5 rounded-full bg-paper/70 border border-line text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                                                {String.fromCharCode(65 + optIdx)}
                                              </span>
                                              <span className="leading-relaxed">{opt.text}</span>
                                              {badge}
                                              {isSelected && isCorrect && (
                                                <span className="ml-auto px-2 py-0.5 rounded bg-accent text-white text-[9px] font-mono font-bold uppercase leading-none">Student Selected (Correct)</span>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    ) : (
                                      <p className="text-ink-secondary/70">No options defined.</p>
                                    )}
                                    {(answer?.selectedOptionIndex === null || answer?.selectedOptionIndex === undefined) ? (
                                      <p className="text-red-500 font-semibold mt-1">⚠️ Candidate did not answer this question.</p>
                                    ) : null}
                                  </div>
                                ) : (
                                  <div className="flex flex-col gap-2.5">
                                    <div className="flex items-center justify-between">
                                      <strong className="text-ink-secondary block uppercase text-[10px] font-bold tracking-wider">Candidate Code Response:</strong>
                                      {answer?.language && (
                                        <span className="text-[10px] bg-accent-soft text-accent border border-accent/20 px-2 py-0.5 rounded font-mono font-bold uppercase">
                                          Language: {answer.language}
                                        </span>
                                      )}
                                    </div>
                                    {answer?.code ? (
                                      <pre className="bg-[#1e1e1e] text-[#d4d4d4] dark:bg-black/40 font-mono text-[11px] p-4 rounded-xl overflow-x-auto max-h-96 whitespace-pre border border-line leading-relaxed mt-1">
                                        {answer.code}
                                      </pre>
                                    ) : (
                                      <p className="text-red-500 font-semibold mt-1">⚠️ Candidate submitted blank code / did not answer.</p>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-surface border border-line rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl flex flex-col gap-5">
            <div className="flex items-center gap-3 text-danger">
              <div className="w-10 h-10 rounded-full bg-danger-soft/40 border border-danger/30 flex items-center justify-center shrink-0">
                ⚠️
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-ink">Delete Participant?</h3>
                <p className="text-xs text-ink-secondary">Permanent action confirmation</p>
              </div>
            </div>

            <p className="text-sm text-ink-secondary leading-relaxed bg-card p-4 rounded-xl border border-line">
              This will permanently remove participant <strong className="text-ink font-semibold">{deleteTarget.candidateName}</strong> {deleteTarget.candidateRollNumber ? `(${deleteTarget.candidateRollNumber})` : ""} and their examination data. This action cannot be undone.
            </p>

            {deleteError && (
              <div className="text-xs text-danger bg-danger-soft/30 p-3 rounded-xl border border-danger/20">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setDeleteTarget(null); setDeleteError(""); }}
                disabled={deleting}
                className="px-4 py-2.5 rounded-xl border border-line text-xs font-semibold text-ink-secondary hover:text-ink hover:bg-card transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteParticipant}
                disabled={deleting}
                className="px-5 py-2.5 rounded-xl bg-danger text-white text-xs font-bold shadow-md hover:bg-danger-deep transition-all cursor-pointer disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Confirm & Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-paper rounded-lg p-3 text-center border border-line/50">
      <p className="text-ink/50 text-[11px] font-medium">{label}</p>
      <p className="font-mono font-bold text-ink text-base mt-0.5">{value}</p>
    </div>
  );
}
