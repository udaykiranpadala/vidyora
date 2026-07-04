import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/client";
import Badge from "../components/Badge";
import ThemeToggle from "../components/ThemeToggle";

export default function ExamResults() {
  const { examId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [expandedQuestionKeys, setExpandedQuestionKeys] = useState(new Set());

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

  useEffect(() => {
    api
      .get(`/exams/${examId}/results`)
      .then((res) => setData(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [examId]);

  if (loading) {
    return <div className="min-h-screen bg-paper flex items-center justify-center text-ink/50">Loading...</div>;
  }
  if (!data) {
    return <div className="min-h-screen bg-paper flex items-center justify-center text-ink/50">Could not load results</div>;
  }

  const { exam, questions, attempts } = data;
  const maxScore = questions.reduce((sum, q) => sum + q.totalPoints, 0);

  return (
    <div className="min-h-screen bg-paper font-expert">
      <header className="border-b border-line bg-surface">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to={`/exams/${examId}`} className="text-sm text-ink/60 hover:text-ink">
            ← Back to exam
          </Link>
          <div className="flex items-center gap-4">
            <Link
              to={`/leaderboard/${exam.accessCode}`}
              target="_blank"
              className="text-sm text-accent font-medium"
            >
              View public leaderboard →
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="font-display text-2xl font-semibold text-ink mb-1">
          {exam.title} — Results
        </h1>
        <div className="flex flex-wrap items-center gap-4 text-sm mb-8">
          <span className="text-ink/60">{attempts.length} candidate{attempts.length !== 1 && "s"} total</span>
          <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            {attempts.filter(a => a.status === "completed").length} Completed
          </span>
          <span className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-full text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
            {attempts.filter(a => a.status === "in_progress").length} Incomplete / Exited Early
          </span>
          <span className="text-ink/60">· Max score {maxScore}</span>
        </div>

        {attempts.length === 0 ? (
          <div className="border border-dashed border-line rounded-2xl py-16 text-center text-ink/60">
            No attempts yet.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {attempts.map((attempt, idx) => (
              <div key={attempt._id} className={`bg-surface border rounded-xl transition-colors ${attempt.status === "in_progress" ? "border-amber-500/30 bg-amber-500/[0.03]" : "border-line"}`}>
                <button
                  onClick={() => setExpandedId(expandedId === attempt._id ? null : attempt._id)}
                  className="w-full flex items-center gap-4 p-4 text-left"
                >
                  <span className="font-mono text-ink/40 w-8 text-sm">{idx + 1}</span>
                  <div className="flex-1">
                    <p className="font-medium text-ink text-sm">
                      {attempt.candidateName}
                      {attempt.candidateRollNumber && (
                        <span className="text-ink/40 ml-2 font-mono text-xs">
                          {attempt.candidateRollNumber}
                        </span>
                      )}
                    </p>
                    <div className="flex items-center gap-2 text-xs mt-0.5">
                      {attempt.status === "completed" ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                          Completed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                          Exited Early / Incomplete
                        </span>
                      )}
                      {(attempt.tabSwitchCount > 0 ||
                        attempt.fullscreenExitCount > 0 ||
                        attempt.pasteAttemptCount > 0) && (
                        <span className="text-warning">⚠ flagged</span>
                      )}
                    </div>
                  </div>
                  <p className="font-mono font-semibold text-ink">
                    {attempt.totalScore}
                    <span className="text-ink/40">/{maxScore}</span>
                  </p>
                </button>

                {expandedId === attempt._id && (
                  <div className="border-t border-line p-4 flex flex-col gap-4">
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <Stat label="Tab switches" value={attempt.tabSwitchCount} />
                      <Stat label="Fullscreen exits" value={attempt.fullscreenExitCount} />
                      <Stat label="Paste attempts" value={attempt.pasteAttemptCount} />
                    </div>

                    <div className="flex flex-col gap-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-ink-secondary">Question Breakdown</h4>
                      {questions.map((q) => {
                        const answer = attempt.answers.find(
                          (a) => a.question.toString() === q._id.toString()
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
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-paper rounded-lg p-3 text-center">
      <p className="text-ink/50">{label}</p>
      <p className="font-mono font-semibold text-ink text-base mt-0.5">{value}</p>
    </div>
  );
}
