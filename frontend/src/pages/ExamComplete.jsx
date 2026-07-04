import { useLocation, Link } from "react-router-dom";
import { VidyoraLogo } from "../components/VidyoraLogo";
import ThemeToggle from "../components/ThemeToggle";

export default function ExamComplete() {
  const location = useLocation();
  const examTitle = location.state?.examTitle;
  const autoSubmitted = location.state?.autoSubmitted;
  const accessCode = location.state?.accessCode;
  const isLeaderboardPublished = location.state?.isLeaderboardPublished;

  return (
    <div className="min-h-screen bg-paper font-expert flex flex-col">
      {/* Minimal header */}
      <header className="border-b border-line bg-surface/80 backdrop-blur-sm px-6 py-4 flex items-center justify-between">
        <VidyoraLogo size="md" to={null} />
        <ThemeToggle />
      </header>

      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-lg text-center flex flex-col items-center gap-8">

          {/* Animated success ring + checkmark */}
          <div className="relative inline-flex items-center justify-center">
            <div className="absolute w-40 h-40 rounded-full bg-emerald-500/8 animate-ping opacity-25" />
            <div className="absolute w-32 h-32 rounded-full bg-emerald-500/12 animate-pulse" />
            <div className="w-28 h-28 rounded-full bg-emerald-500/15 border-[3px] border-emerald-500/50 flex items-center justify-center shadow-2xl shadow-emerald-500/20 z-10">
              <svg className="w-14 h-14 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          {/* Main heading — very large */}
          <div className="flex flex-col gap-3">
            <h1 className="font-display text-5xl font-black text-ink tracking-tight leading-tight">
              {autoSubmitted ? "Auto Submitted" : "Exam Submitted!"}
            </h1>

            {/* Exam name badge */}
            {examTitle && (
              <div className="inline-flex items-center justify-center gap-2 bg-accent/10 border border-accent/25 text-accent rounded-2xl px-5 py-2.5 mx-auto">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="font-bold text-base">{examTitle}</span>
              </div>
            )}

            <p className="text-ink-secondary text-xl font-medium leading-relaxed">
              Your responses have been{" "}
              <span className="text-emerald-500 font-bold">successfully recorded.</span>
            </p>
          </div>

          {/* Auto-submit warning */}
          {autoSubmitted && (
            <div className="w-full bg-amber-500/10 border border-amber-500/30 rounded-2xl px-6 py-4 text-amber-600 dark:text-amber-400 font-semibold text-base flex items-start gap-3">
              <span className="text-2xl leading-none mt-0.5">⚠️</span>
              <span className="text-left leading-relaxed">
                Your exam was automatically submitted because the time limit was reached.
              </span>
            </div>
          )}

          {/* Results notice */}
          <p className="text-ink-secondary text-base leading-relaxed">
            Results will be shared by your organizer.{" "}
            {isLeaderboardPublished
              ? <span className="text-emerald-500 font-semibold">The leaderboard is now live! 🎉</span>
              : <span className="font-medium">You may view the leaderboard once it is published.</span>
            }
          </p>

          {/* Action Buttons — large, touch-friendly */}
          <div className="flex flex-col gap-4 w-full">
            {/* View Leaderboard */}
            {accessCode ? (
              <Link
                to={`/leaderboard/${accessCode}`}
                className="w-full flex items-center justify-center gap-3 bg-accent hover:bg-accent/90 text-white font-bold text-lg px-8 py-4 rounded-2xl shadow-xl shadow-accent/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                {isLeaderboardPublished ? "View Leaderboard 🏆" : "Check Leaderboard"}
              </Link>
            ) : (
              <div className="w-full flex items-center justify-center gap-3 bg-card border border-line text-ink-secondary font-semibold text-lg px-8 py-4 rounded-2xl opacity-60 cursor-not-allowed">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Leaderboard Unavailable
              </div>
            )}

            {/* Exit Vidyora */}
            <Link
              to="/"
              className="w-full flex items-center justify-center gap-3 bg-surface hover:bg-card border-2 border-line hover:border-ink/20 text-ink font-bold text-lg px-8 py-4 rounded-2xl transition-all duration-200"
            >
              <svg className="w-5 h-5 text-ink-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Exit Vidyora
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
