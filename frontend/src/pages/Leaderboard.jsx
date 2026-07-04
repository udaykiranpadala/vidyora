import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { attemptApi } from "../api/attempts";
import Navbar from "../components/Navbar";

const MEDAL = { 1: "🥇", 2: "🥈", 3: "🥉" };

export default function Leaderboard() {
  const { accessCode } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = () => {
    attemptApi
      .getLeaderboard(accessCode)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message || "Could not load leaderboard"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
    // poll every 10s so it updates live during/after the event
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [accessCode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center text-ink gap-4">
          <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
          <p className="font-mono text-sm tracking-wider animate-pulse">RETRIEVING LEADERBOARD DATA...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-paper flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center text-danger gap-2">
          <p className="font-semibold text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const { examTitle, isClosed, isLeaderboardPublished, leaderboard } = data;

  if (!isLeaderboardPublished) {
    return (
      <div className="min-h-screen bg-paper flex flex-col font-expert">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4 py-20">
          <div className="w-full max-w-md bg-surface border border-line rounded-3xl p-8 md:p-10 shadow-xl text-center flex flex-col items-center gap-6">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 text-3xl flex items-center justify-center animate-pulse">
              ⏳
            </div>
            <div>
              <h1 className="font-display text-xl font-extrabold text-ink mb-2">Results Processing</h1>
              <p className="text-sm text-ink-secondary leading-relaxed">
                Results are being processed. Please wait for the organizer to publish the leaderboard.
              </p>
            </div>
            <div className="w-full bg-card border border-line rounded-2xl p-4 text-xs text-ink-secondary/80 font-mono">
              Exam: <span className="font-bold text-ink">{examTitle}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const top3 = leaderboard.slice(0, 3);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Calculate dynamic stats
  const stats = {
    totalCandidates: leaderboard.length,
    highestScore: leaderboard.length > 0 ? Math.max(...leaderboard.map((e) => e.totalScore)) : 0,
    topScorer: leaderboard.length > 0 ? leaderboard[0].candidateName : "N/A",
    averageScore: leaderboard.length > 0 
      ? Math.round(leaderboard.reduce((acc, curr) => acc + curr.totalScore, 0) / leaderboard.length) 
      : 0,
    averageTime: leaderboard.length > 0 
      ? formatTime(Math.round(leaderboard.reduce((acc, curr) => acc + curr.totalTimeSeconds, 0) / leaderboard.length)) 
      : "0s",
  };

  return (
    <div className="min-h-screen bg-paper flex flex-col font-expert">
      <Navbar />

      <div className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 md:py-12 flex flex-col gap-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-line pb-6">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-ink tracking-tight flex items-center gap-3">
              <span className="text-accent">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5a2 2 0 10-2 2h2zm0 13H9m3 0h3M5 9a2 2 0 012-2h2M5 9a2 2 0 002 2h2m0-4v4m10-4a2 2 0 012 2h-2m2-2a2 2 0 00-2-2h-2m0 4V7" />
                </svg>
              </span>
              <span>{examTitle}</span>
            </h1>
            <p className="text-ink-secondary text-sm mt-1">
              {isClosed ? "Final Official Standings" : "Live Leaderboard — updates automatically in real-time"}
            </p>
          </div>
          
          {!isClosed && (
            <div className="flex items-center justify-center gap-2 self-start md:self-center bg-success-soft text-success text-xs font-mono font-bold px-3.5 py-1.5 rounded-full border border-success/30 animate-pulse">
              <span className="w-2 h-2 bg-success rounded-full" />
              <span>LIVE UPDATING</span>
            </div>
          )}
        </div>

        {leaderboard.length === 0 ? (
          <div className="bg-surface border border-line rounded-3xl p-16 text-center text-ink-secondary shadow-lg mt-4">
            <div className="text-accent/60 mb-4 flex justify-center">
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="font-medium text-sm">No submissions recorded yet.</p>
            <p className="text-xs text-ink-secondary/65 mt-1">Check back once candidate responses are finalized!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start mt-2">
            
            {/* Left/Middle: Podium + Full Standings List */}
            <div className="lg:col-span-2 flex flex-col gap-8">
              
              {/* Podium (Top 3 Highlighted) */}
              {top3.length > 0 && (
                <div className="bg-surface border border-line rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
                  
                  {/* Subtle Top Decorator Line */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gold via-silver to-bronze opacity-60" />
                  
                  <h2 className="text-xs font-bold uppercase tracking-wider text-ink-secondary mb-10 text-center">
                    Podium Finishers
                  </h2>

                  <div className="flex items-end justify-center gap-2 sm:gap-6 mt-12 max-w-md mx-auto">
                    
                    {/* Rank 2 (Left) */}
                    {top3[1] ? (
                      <div className="flex-1 flex flex-col items-center group">
                        <div className="relative mb-3 flex flex-col items-center">
                          {/* Initials Avatar */}
                          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-silver/15 border-2 border-silver flex items-center justify-center text-ink font-extrabold text-sm sm:text-base shadow-md group-hover:scale-105 transition-all">
                            {getInitials(top3[1].candidateName)}
                          </div>
                          <span className="absolute -top-3 text-lg" title="Silver Medal">🥈</span>
                        </div>
                        <p className="font-display font-bold text-ink text-xs sm:text-sm text-center truncate w-24">
                          {top3[1].candidateName}
                        </p>
                        <p className="font-mono text-[10px] text-silver font-bold mt-0.5">
                          {top3[1].totalScore} pts
                        </p>
                        
                        {/* 2nd Place Block */}
                        <div className="w-full mt-4 h-24 bg-gradient-to-b from-silver/35 to-silver/10 border border-silver/30 shadow-md rounded-t-2xl flex items-center justify-center transition-all duration-300 group-hover:from-silver/45">
                          <span className="font-display font-extrabold text-4xl text-silver opacity-85">2</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1" />
                    )}
 
                    {/* Rank 1 (Middle - Tallest) */}
                    {top3[0] ? (
                      <div className="flex-1 flex flex-col items-center group -translate-y-3">
                        <div className="relative mb-3 flex flex-col items-center">
                          {/* Initials Avatar */}
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gold/15 border-2 border-gold flex items-center justify-center text-ink font-black text-base sm:text-lg shadow-lg group-hover:scale-105 transition-all">
                            {getInitials(top3[0].candidateName)}
                          </div>
                          <span className="absolute -top-3.5 text-2xl" title="Gold Medal">🥇</span>
                        </div>
                        <p className="font-display font-black text-ink text-sm sm:text-base text-center truncate w-28">
                          {top3[0].candidateName}
                        </p>
                        <p className="font-mono text-xs text-gold font-extrabold mt-0.5">
                          {top3[0].totalScore} pts
                        </p>
                        
                        {/* 1st Place Block */}
                        <div className="w-full mt-4 h-32 bg-gradient-to-b from-gold/45 to-gold/15 border border-gold/40 shadow-lg rounded-t-2xl flex items-center justify-center transition-all duration-300 group-hover:from-gold/55">
                          <span className="font-display font-extrabold text-6xl text-gold opacity-95">1</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1" />
                    )}
 
                    {/* Rank 3 (Right) */}
                    {top3[2] ? (
                      <div className="flex-1 flex flex-col items-center group">
                        <div className="relative mb-3 flex flex-col items-center">
                          {/* Initials Avatar */}
                          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-bronze/15 border-2 border-bronze flex items-center justify-center text-ink font-extrabold text-sm sm:text-base shadow-md group-hover:scale-105 transition-all">
                            {getInitials(top3[2].candidateName)}
                          </div>
                          <span className="absolute -top-3 text-lg" title="Bronze Medal">🥉</span>
                        </div>
                        <p className="font-display font-bold text-ink text-xs sm:text-sm text-center truncate w-24">
                          {top3[2].candidateName}
                        </p>
                        <p className="font-mono text-[10px] text-bronze font-bold mt-0.5">
                          {top3[2].totalScore} pts
                        </p>
                        
                        {/* 3rd Place Block */}
                        <div className="w-full mt-4 h-18 bg-gradient-to-b from-bronze/35 to-bronze/10 border border-bronze/30 shadow-md rounded-t-2xl flex items-center justify-center transition-all duration-300 group-hover:from-bronze/45">
                          <span className="font-display font-extrabold text-3xl text-bronze opacity-85">3</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1" />
                    )}

                  </div>
                </div>
              )}

              {/* Standings Table (Shows All Candidates, highlighting Top 3) */}
              <div className="bg-surface border border-line rounded-3xl p-6 md:p-8 shadow-xl">
                <h2 className="text-xs font-bold uppercase tracking-wider text-ink-secondary mb-6">
                  Leaderboard Standings
                </h2>
                
                <div className="flex flex-col gap-3">
                  {leaderboard.map((entry) => {
                    const isTop1 = entry.rank === 1;
                    const isTop2 = entry.rank === 2;
                    const isTop3 = entry.rank === 3;
                    
                    let bgStyles = "bg-card/30 border-line hover:border-accent/40";
                    if (isTop1) bgStyles = "bg-gold/5 border-gold/30 hover:border-gold/60";
                    else if (isTop2) bgStyles = "bg-silver/5 border-silver/30 hover:border-silver/60";
                    else if (isTop3) bgStyles = "bg-bronze/5 border-bronze/30 hover:border-bronze/60";

                    return (
                      <div
                        key={entry.rank}
                        className={`flex items-center gap-4 border rounded-2xl px-4 py-3.5 transition-all duration-200 ${bgStyles}`}
                      >
                        {/* Medal / Rank Column */}
                        <div className="w-8 flex items-center justify-center font-mono font-bold text-sm shrink-0">
                          {MEDAL[entry.rank] || (
                            <span className="text-ink-secondary">{entry.rank}</span>
                          )}
                        </div>

                        {/* Initials Avatar */}
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-sm ${
                          isTop1 ? "bg-gold/25 text-gold border border-gold/30" : 
                          isTop2 ? "bg-silver/25 text-silver border border-silver/30" :
                          isTop3 ? "bg-bronze/25 text-bronze border border-bronze/30" :
                          "bg-card text-ink-secondary border border-line"
                        }`}>
                          {getInitials(entry.candidateName)}
                        </div>

                        {/* Name & Details */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-ink text-sm truncate">
                            {entry.candidateName}
                          </p>
                          {entry.candidateRollNumber && (
                            <p className="text-[10px] text-ink-secondary font-mono tracking-wider truncate">
                              {entry.candidateRollNumber}
                            </p>
                          )}
                        </div>

                        {/* Time Column */}
                        <div className="text-right hidden sm:block shrink-0">
                          <p className="text-[10px] text-ink-secondary uppercase font-bold tracking-wider">Time Taken</p>
                          <p className="text-xs font-mono text-ink font-semibold">{formatTime(entry.totalTimeSeconds)}</p>
                        </div>

                        {/* Score Column */}
                        <div className="w-20 text-right shrink-0">
                          <p className="text-[10px] text-ink-secondary uppercase font-bold tracking-wider">Score</p>
                          <p className="font-mono text-sm font-bold text-ink">
                            {entry.totalScore} <span className="text-[10px] text-accent">pts</span>
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Right Column: Insights Sidebar */}
            <div className="bg-surface border border-line rounded-3xl p-6 md:p-8 shadow-xl flex flex-col gap-6">
              
              <div className="flex items-center gap-3 pb-4 border-b border-line">
                <span className="text-accent opacity-75">
                  <svg className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </span>
                <div>
                  <h2 className="font-display font-extrabold text-base text-ink">Exam Insights</h2>
                  <p className="text-[10px] text-ink-secondary uppercase tracking-wider font-bold">Performance Summary</p>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
                
                {/* Stats: Total Candidates */}
                <div className="bg-card/45 border border-line/65 rounded-2xl p-4 flex flex-col">
                  <span className="text-xs font-bold text-ink-secondary uppercase tracking-wider">Total Candidates</span>
                  <span className="font-mono text-2xl font-extrabold text-ink mt-1">
                    {stats.totalCandidates}
                  </span>
                  <span className="text-[10px] text-ink-secondary mt-1">Completed attempts</span>
                </div>

                {/* Stats: Highest Score */}
                <div className="bg-card/45 border border-line/65 rounded-2xl p-4 flex flex-col">
                  <span className="text-xs font-bold text-ink-secondary uppercase tracking-wider">Highest Score</span>
                  <span className="font-mono text-2xl font-extrabold text-gold mt-1">
                    {stats.highestScore} <span className="text-xs font-medium text-gold/80">pts</span>
                  </span>
                  <span className="text-[10px] text-ink-secondary mt-1 truncate">
                    Achieved by {stats.topScorer || "N/A"}
                  </span>
                </div>

                {/* Stats: Average Score */}
                <div className="bg-card/45 border border-line/65 rounded-2xl p-4 flex flex-col">
                  <span className="text-xs font-bold text-ink-secondary uppercase tracking-wider">Average Score</span>
                  <span className="font-mono text-2xl font-extrabold text-accent mt-1">
                    {stats.averageScore} <span className="text-xs font-medium text-accent/80">pts</span>
                  </span>
                  <span className="text-[10px] text-ink-secondary mt-1">Overall mean performance</span>
                </div>

                {/* Stats: Average Time */}
                <div className="bg-card/45 border border-line/65 rounded-2xl p-4 flex flex-col">
                  <span className="text-xs font-bold text-ink-secondary uppercase tracking-wider">Average Time</span>
                  <span className="font-mono text-lg sm:text-xl font-extrabold text-success mt-1.5 truncate">
                    {stats.averageTime}
                  </span>
                  <span className="text-[10px] text-ink-secondary mt-1">Mean completion duration</span>
                </div>

              </div>

            </div>

          </div>
        )}
      </div>
    </div>
  );
}
