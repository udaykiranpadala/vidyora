import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { examApi } from "../api/exams";
import Navbar from "../components/Navbar";
import Button from "../components/Button";
import Modal from "../components/Modal";
import Badge from "../components/Badge";
import Input from "../components/Input";
import McqForm from "../components/McqForm";
import CodingForm from "../components/CodingForm";
import OrganizerSettingsForm from "../components/OrganizerSettingsForm";

export default function ExamBuilder() {
  const { examId } = useParams();
  const navigate = useNavigate();

  // Navigation & Tabs
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "leaderboard" | "results" | "settings"

  // Data State
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [activeForm, setActiveForm] = useState(null); // "mcq" | "coding" | null
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState("");

  // Settings tab states
  const [savingSettings, setSavingSettings] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [batchTag, setBatchTag] = useState("");
  const [duplicating, setDuplicating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [settingsSuccessMessage, setSettingsSuccessMessage] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const examRes = await examApi.getById(examId);
      setExam(examRes.data.exam);
      setQuestions(examRes.data.questions);
      setBatchTag(examRes.data.exam.settings?.batchTag || "");
      
      const resultsRes = await examApi.getResults(examId);
      setAttempts(resultsRes.data.attempts || []);
    } catch (err) {
      console.error("Failed to load exam details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [examId]);

  const openNewQuestionForm = (type) => {
    setShowTypePicker(false);
    setEditingQuestion(null);
    setActiveForm(type);
  };

  const openEditForm = (question) => {
    setEditingQuestion(question);
    setActiveForm(question.type);
  };

  const closeForm = () => {
    setActiveForm(null);
    setEditingQuestion(null);
  };

  const handleSaveQuestion = async (data) => {
    setSubmitting(true);
    try {
      if (editingQuestion) {
        await examApi.updateQuestion(examId, editingQuestion._id, data);
      } else {
        await examApi.addQuestion(examId, data);
      }
      closeForm();
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save question");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveSettings = async (settingsData) => {
    setSavingSettings(true);
    setSettingsSuccessMessage("");
    try {
      const { startAt, endAt, ...restSettings } = settingsData;
      const res = await examApi.update(examId, { 
        settings: {
          ...exam.settings,
          ...restSettings
        },
        startAt: startAt || null,
        endAt: endAt || null
      });
      setExam(res.data.exam);
      setSettingsSuccessMessage("Settings Saved Successfully.");
      setTimeout(() => setSettingsSuccessMessage(""), 5000);
    } catch {
      alert("Failed to save settings");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleToggleLeaderboardPublish = async () => {
    try {
      const current = exam.isLeaderboardPublished || false;
      const res = await examApi.update(examId, {
        isLeaderboardPublished: !current
      });
      setExam(res.data.exam);
    } catch {
      alert("Failed to update leaderboard publication status.");
    }
  };

  const handleSaveBatchTag = async () => {
    try {
      const res = await examApi.update(examId, {
        settings: {
          ...exam.settings,
          batchTag: batchTag.trim()
        }
      });
      setExam(res.data.exam);
      alert("Batch / Section tag updated successfully!");
    } catch {
      alert("Failed to save batch tag.");
    }
  };

  const handleRosterUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      const lines = text.split(/[\r\n,;]+/).map(item => item.trim()).filter(Boolean);
      const uniqueItems = [...new Set([...(exam.settings?.roster || []), ...lines])];
      
      try {
        const res = await examApi.update(examId, { 
          settings: { 
            ...exam.settings, 
            roster: uniqueItems 
          } 
        });
        setExam(res.data.exam);
        alert(`Roster updated with ${lines.length} students successfully!`);
      } catch {
        alert("Failed to update roster settings.");
      }
    };
    reader.readAsText(file);
  };

  const handleClearRoster = async () => {
    if (!confirm("Clear all allowed candidates from the roster?")) return;
    try {
      const res = await examApi.update(examId, {
        settings: {
          ...exam.settings,
          roster: []
        }
      });
      setExam(res.data.exam);
      alert("Roster cleared successfully.");
    } catch {
      alert("Failed to clear roster.");
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!confirm("Delete this question?")) return;
    try {
      await examApi.deleteQuestion(examId, questionId);
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete");
    }
  };

  const handlePublish = async () => {
    setActionError("");
    try {
      const res = await examApi.publish(examId);
      setExam(res.data.exam);
    } catch (err) {
      setActionError(err.response?.data?.message || "Failed to publish");
    }
  };

  const handleClose = async () => {
    if (!confirm("Close this exam? No new attempts will be allowed and results will freeze.")) return;
    try {
      const res = await examApi.close(examId);
      setExam(res.data.exam);
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to close exam");
    }
  };

  const handleExtendTime = async () => {
    try {
      const currentDur = exam.settings?.duration || 60;
      const res = await examApi.update(examId, {
        settings: {
          ...exam.settings,
          duration: currentDur + 15
        }
      });
      setExam(res.data.exam);
      alert(`Exam duration extended by 15 minutes. New duration: ${currentDur + 15} mins.`);
    } catch {
      alert("Failed to extend exam time.");
    }
  };

  const handleTogglePublishResults = async () => {
    try {
      const currentShow = exam.settings?.showScoreImmediately ?? true;
      const res = await examApi.update(examId, {
        settings: {
          ...exam.settings,
          showScoreImmediately: !currentShow
        }
      });
      setExam(res.data.exam);
      alert(`Results visibility updated. Scores are now ${!currentShow ? "VISIBLE" : "HIDDEN"} to students immediately.`);
    } catch {
      alert("Failed to update results settings.");
    }
  };

  const handleExportCSV = () => {
    if (attempts.length === 0) {
      alert("No student attempts to export.");
      return;
    }
    const headers = ["Rank", "Candidate Name", "Roll Number", "Score", "Time Taken (s)", "Status", "Warnings"];
    const rows = attempts.map((a, idx) => [
      idx + 1,
      a.candidateName,
      a.candidateRollNumber || "N/A",
      a.totalScore,
      a.totalTimeSeconds,
      a.status,
      (a.tabSwitchCount || 0) + (a.fullscreenExitCount || 0) + (a.pasteAttemptCount || 0)
    ]);
    
    let csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${exam.title.replace(/\s+/g, "_")}_Results.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDuplicateCurrentExam = async () => {
    setDuplicating(true);
    try {
      const dupRes = await examApi.create({
        title: `${exam.title} (Copy)`,
        description: exam.description || ""
      });
      const newExam = dupRes.data.exam;
      if (exam.settings) {
        await examApi.update(newExam._id, { settings: exam.settings });
      }
      for (const q of questions) {
        await examApi.addQuestion(newExam._id, {
          title: q.title,
          type: q.type,
          statement: q.statement,
          points: q.points,
          timerSeconds: q.timerSeconds,
          options: q.options,
          allowedLanguages: q.allowedLanguages,
          starterCode: q.starterCode,
          testCases: q.testCases
        });
      }
      alert("Exam duplicated successfully!");
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      alert("Failed to duplicate exam.");
    } finally {
      setDuplicating(false);
    }
  };

  const handleDeleteExam = async () => {
    setDeleting(true);
    try {
      await examApi.delete(examId);
      navigate("/dashboard");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete exam");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center text-ink gap-4">
          <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
          <p className="font-mono text-sm tracking-wider animate-pulse">LOADING ASSESSMENT ENVIRONMENT...</p>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen bg-paper flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center text-danger gap-2">
          <p className="font-semibold">Exam not found</p>
        </div>
      </div>
    );
  }

  const totalPoints = questions.reduce((sum, q) => sum + q.totalPoints, 0);
  const totalMinutes = Math.round(questions.reduce((sum, q) => sum + q.timerSeconds, 0) / 60);
  const joinUrl = `${window.location.origin}/join/${exam.accessCode}`;

  const copyJoinLink = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQrCode = async () => {
    try {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(joinUrl)}`;
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `exam-${exam.accessCode}-qr.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download QR code:", err);
      window.open(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(joinUrl)}`, "_blank");
    }
  };

  const statusOf = (exam) => {
    if (exam.isClosed || (exam.endAt && new Date(exam.endAt) < new Date())) return "closed";
    if (exam.isPublished) return "published";
    return "draft";
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  // Calculated Stats
  const liveCount = attempts.filter((a) => a.status === "started").length;
  const status = statusOf(exam);

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col font-expert">
      <Navbar />

      <main className="max-w-4xl w-full mx-auto px-6 py-10 flex flex-col gap-6">
        
        {/* Top Header Section */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-line pb-6">
          <div>
            <Link to="/dashboard" className="text-xs font-semibold text-accent hover:underline mb-2 inline-flex items-center gap-1">
              ← Back to Organizer Hub
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-2xl font-extrabold text-ink tracking-tight">
                {exam.title}
              </h1>
              <Badge variant={status}>
                {status === "published" && !exam.isClosed ? "Live" : status}
              </Badge>
            </div>
            {exam.description && <p className="text-ink-secondary text-sm mt-1">{exam.description}</p>}
            
            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-ink-secondary font-mono">
              <span>Questions: {questions.length}</span>
              <span>Points: {totalPoints}</span>
              <span>Duration: ~{totalMinutes} min</span>
              {exam.settings?.batchTag && (
                <span className="bg-card px-2.5 py-0.5 rounded border border-line text-accent font-sans font-bold">
                  {exam.settings.batchTag}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDuplicateCurrentExam}
              disabled={duplicating}
              className="px-4 py-2 border border-line bg-card hover:bg-line/25 text-ink hover:text-accent text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              {duplicating ? "Duplicating..." : "Duplicate"}
            </button>
            {!exam.isPublished && (
              <Button variant="danger" className="text-xs font-bold" onClick={() => setShowDeleteModal(true)}>
                Delete Exam
              </Button>
            )}
          </div>
        </div>

        {/* Tab Selection Navigation */}
        <div className="flex border-b border-line gap-4 overflow-x-auto pb-1.5 shrink-0">
          {[
            { id: "overview", label: "Overview" },
            { id: "leaderboard", label: "Leaderboard" },
            { id: "results", label: "Conduction & Results" },
            { id: "settings", label: "Configure Settings" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-xs font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? "border-accent text-accent"
                  : "border-transparent text-ink-secondary hover:text-ink hover:border-line"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Overview Tab */}
        {activeTab === "overview" && (
          <div className="flex flex-col gap-6">
            
            {/* Share / Access Panel */}
            <div className="bg-surface border border-line rounded-2xl p-5 shadow-sm">
              {!exam.isPublished ? (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-ink text-sm">Exam is in draft mode</p>
                    <p className="text-xs text-ink-secondary mt-0.5">
                      Configure your questions, then publish to get a shareable link and access code.
                    </p>
                  </div>
                  <Button onClick={handlePublish} disabled={questions.length === 0} className="px-5 text-xs font-bold">
                    Publish Exam
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col md:flex-row gap-6 items-center">
                  <div className="flex-1 flex flex-col gap-4 w-full">
                    <div className="flex items-center justify-between gap-4 border-b border-line/40 pb-3">
                      <div>
                        <p className="font-semibold text-ink text-sm">
                          {exam.isClosed ? "Exam closed" : "Exam is live"}
                        </p>
                        <p className="text-[10px] text-ink-secondary mt-0.5">
                          Share this QR code or link with students to join.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {!exam.isClosed && (
                          <Button variant="secondary" onClick={handleClose} className="px-4 py-1.5 text-xs font-bold">
                            Close exam
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-paper border border-line rounded-xl px-4 py-2.5">
                        <p className="text-[10px] text-ink-secondary font-bold uppercase tracking-wider mb-0.5">Access Code</p>
                        <p className="font-mono text-lg font-bold tracking-widest text-accent">
                          {exam.accessCode}
                        </p>
                      </div>
                      <div className="bg-paper border border-line rounded-xl px-4 py-2.5 flex flex-col justify-between">
                        <div>
                          <p className="text-[10px] text-ink-secondary font-bold uppercase tracking-wider mb-0.5">Share Link</p>
                          <p className="text-xs text-ink truncate max-w-[200px]" title={joinUrl}>{joinUrl}</p>
                        </div>
                        <button
                          onClick={copyJoinLink}
                          className="text-left text-[10px] text-accent font-bold hover:underline mt-1 cursor-pointer"
                        >
                          {copied ? "Copied!" : "Copy Join Link"}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 w-full md:w-auto flex flex-col items-center gap-2 bg-paper border border-line rounded-xl p-3 shadow-sm">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(joinUrl)}`}
                      alt="Exam QR Code"
                      className="w-[100px] h-[100px] block"
                    />
                    <button
                      onClick={downloadQrCode}
                      className="text-[10px] text-accent font-bold hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <svg className="w-3 h-3 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download QR Code
                    </button>
                  </div>
                </div>
              )}
              {actionError && <p className="text-sm text-danger mt-2">{actionError}</p>}
            </div>

            {/* Questions list */}
            <div className="flex items-center justify-between">
              <h2 className="font-display text-sm font-bold uppercase tracking-wider text-ink-secondary">Questions List</h2>
              <Button onClick={() => setShowTypePicker(true)} className="px-4 py-2 text-xs font-bold">+ Add question</Button>
            </div>

            {questions.length === 0 ? (
              <div className="border border-dashed border-line rounded-2xl py-12 text-center bg-surface/50">
                <p className="text-xs text-ink-secondary">No questions added yet. Get started by adding one.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {questions.map((q, idx) => (
                  <div
                    key={q._id}
                    className="bg-surface border border-line rounded-xl p-4 flex items-center gap-4 hover:border-accent/40 transition-colors"
                  >
                    <span className="text-ink-secondary font-mono text-xs w-6 shrink-0">
                      {idx + 1}
                    </span>
                    <Badge variant={q.type}>{q.type === "mcq" ? "MCQ" : "Coding"}</Badge>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-ink text-sm truncate">{q.title}</p>
                      <p className="text-xs text-ink-secondary font-mono mt-0.5">
                        {Math.round(q.timerSeconds / 60)} mins · {q.totalPoints} pts
                      </p>
                    </div>
                    <button
                      onClick={() => openEditForm(q)}
                      className="text-xs text-accent hover:underline font-bold cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(q._id)}
                      className="text-xs text-ink-secondary hover:text-danger font-bold cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Leaderboard Tab */}
        {activeTab === "leaderboard" && (
          <div className="bg-surface border border-line rounded-2xl p-6 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-ink-secondary">Leaderboard Standings</h2>
                {exam.isLeaderboardPublished ? (
                  <p className="text-[11px] text-emerald-600 font-medium mt-1">✓ Results are Published (Students can view the leaderboard)</p>
                ) : (
                  <p className="text-[11px] text-amber-600 font-medium mt-1">⚠️ Results are Unpublished (Students cannot view the leaderboard yet)</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleToggleLeaderboardPublish}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                    exam.isLeaderboardPublished
                      ? "border-amber-500 bg-amber-500/10 text-amber-600 hover:bg-amber-600 hover:text-white"
                      : "border-accent bg-accent/10 text-accent hover:bg-accent hover:text-white"
                  }`}
                >
                  {exam.isLeaderboardPublished ? "Unpublish Leaderboard" : "Publish Leaderboard"}
                </button>
                <button 
                  onClick={handleExportCSV}
                  className="text-xs font-bold text-accent hover:underline cursor-pointer"
                >
                  Export CSV
                </button>
              </div>
            </div>

            {attempts.length === 0 ? (
              <p className="text-xs text-ink-secondary text-center py-12">No submissions recorded yet for this exam.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-line text-ink-secondary font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-2.5 px-3">Rank</th>
                      <th className="py-2.5 px-3">Candidate</th>
                      <th className="py-2.5 px-3">Roll Number</th>
                      <th className="py-2.5 px-3">Score</th>
                      <th className="py-2.5 px-3">Time Taken</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/65 font-medium">
                    {attempts.map((a, idx) => (
                      <tr key={a._id} className="hover:bg-card/25 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold">{idx + 1}</td>
                        <td className="py-3 px-3 text-ink font-semibold">{a.candidateName}</td>
                        <td className="py-3 px-3 font-mono text-ink-secondary">{a.candidateRollNumber || "—"}</td>
                        <td className="py-3 px-3 font-mono font-bold text-accent">{a.totalScore} pts</td>
                        <td className="py-3 px-3 font-mono text-ink-secondary">{formatTime(a.totalTimeSeconds)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Conduction & Results Tab */}
        {activeTab === "results" && (
          <div className="flex flex-col gap-6">
            
            {/* Real-time conduction logs & triggers */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Live Count Stat Card */}
              <div className="bg-surface border border-line rounded-xl p-5 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-ink-secondary uppercase tracking-wider">Attempting Live</span>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-2xl font-extrabold font-mono text-success">
                      {liveCount}
                    </p>
                    {liveCount > 0 && (
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-accent opacity-60">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </span>
              </div>

              {/* Conduction quick controls */}
              <div className="bg-surface border border-line rounded-xl p-5 shadow-sm md:col-span-2 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold text-ink-secondary uppercase tracking-wider block">Organizer Conduction Actions</span>
                  <p className="text-[10px] text-ink-secondary mt-0.5">Control live candidate exam parameters immediately.</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleExtendTime}
                    className="px-3.5 py-2 border border-line bg-card hover:bg-line/25 text-ink hover:text-accent text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    Extend +15m
                  </button>
                  <button 
                    onClick={handleTogglePublishResults}
                    className="px-3.5 py-2 border border-line bg-card hover:bg-line/25 text-ink hover:text-accent text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    Toggle Results
                  </button>
                </div>
              </div>

            </div>

            {/* Submissions List Table */}
            <div className="bg-surface border border-line rounded-2xl p-6 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <h2 className="text-sm font-bold uppercase tracking-wider text-ink-secondary">Candidate Log</h2>
                <button 
                  onClick={handleExportCSV}
                  className="text-xs font-bold text-accent hover:underline cursor-pointer"
                >
                  Export CSV
                </button>
              </div>

              {attempts.length === 0 ? (
                <p className="text-xs text-ink-secondary text-center py-12">No submissions recorded yet for this exam.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-line text-ink-secondary font-bold uppercase tracking-wider text-[10px]">
                        <th className="py-2.5 px-3">Student</th>
                        <th className="py-2.5 px-3">Roll Number</th>
                        <th className="py-2.5 px-3">Score</th>
                        <th className="py-2.5 px-3">Time</th>
                        <th className="py-2.5 px-3">Violations</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line/65">
                      {attempts.map((a) => {
                        const violations = (a.tabSwitchCount || 0) + (a.fullscreenExitCount || 0) + (a.pasteAttemptCount || 0);
                        return (
                          <tr key={a._id} className="hover:bg-card/20 transition-colors">
                            <td className="py-3 px-3 font-semibold text-ink">{a.candidateName}</td>
                            <td className="py-3 px-3 font-mono text-ink-secondary">{a.candidateRollNumber || "—"}</td>
                            <td className="py-3 px-3 font-mono font-bold text-accent">{a.totalScore} pts</td>
                            <td className="py-3 px-3 font-mono text-ink-secondary">{formatTime(a.totalTimeSeconds)}</td>
                            <td className="py-3 px-3 font-mono">
                              <span className={`font-semibold px-2 py-0.5 rounded text-[10px] ${violations > 0 ? "bg-danger-soft text-danger animate-pulse" : "bg-success-soft text-success"}`}>
                                {violations}
                              </span>
                            </td>
                            <td className="py-3 px-3"><Badge variant={a.status === "completed" ? "published" : "draft"}>{a.status}</Badge></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Settings Tab */}
        {activeTab === "settings" && (
          <div className="flex flex-col gap-8">
            
            {/* Inline General Settings Forms */}
            <div className="bg-surface border border-line rounded-2xl p-6 shadow-sm">
              <h2 className="text-sm font-bold uppercase tracking-wider text-ink-secondary border-b border-line pb-3 mb-6">Configure Parameters</h2>
              {settingsSuccessMessage && (
                <div className="mb-4 p-4 text-xs font-semibold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  ✓ {settingsSuccessMessage}
                </div>
              )}
              <OrganizerSettingsForm
                initialSettings={{
                  ...exam.settings,
                  startAt: exam.startAt,
                  endAt: exam.endAt
                }}
                onSave={handleSaveSettings}
                onCancel={() => setActiveTab("overview")}
                submitting={savingSettings}
              />
            </div>

            {/* Batch Tags Settings */}
            <div className="bg-surface border border-line rounded-2xl p-6 shadow-sm flex flex-col gap-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-ink-secondary">Batch & Section Groups</h3>
                <p className="text-[11px] text-ink-secondary mt-0.5">Assign this assessment to a class batch tag (e.g. CS-A, CS-B) for filtering.</p>
              </div>

              <div className="flex items-end gap-3 max-w-sm">
                <Input
                  label="Batch / Section Tag"
                  value={batchTag}
                  onChange={(e) => setBatchTag(e.target.value)}
                  placeholder="e.g. CS-A"
                />
                <button
                  type="button"
                  onClick={handleSaveBatchTag}
                  className="px-4 py-2.5 bg-accent hover:bg-accent-deep text-white font-semibold rounded-lg text-xs shadow-md transition-all cursor-pointer"
                >
                  Save Tag
                </button>
              </div>
            </div>

            {/* Student Roster Upload */}
            <div className="bg-surface border border-line rounded-2xl p-6 shadow-sm flex flex-col gap-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-ink-secondary">Student Access Roster</h3>
                <p className="text-[11px] text-ink-secondary mt-0.5">Upload a CSV roster of allowed candidates (emails or roll-numbers) to restrict access.</p>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleRosterUpload}
                    className="text-xs text-ink-secondary border border-line bg-card hover:bg-line/20 rounded-lg p-2 cursor-pointer focus:outline-none"
                  />
                  {exam.settings?.roster?.length > 0 && (
                    <button
                      onClick={handleClearRoster}
                      className="px-3.5 py-2 bg-danger-soft hover:bg-danger/25 text-danger font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                    >
                      Clear Roster
                    </button>
                  )}
                </div>

                {/* allowed roster list */}
                {exam.settings?.roster?.length > 0 ? (
                  <div className="border border-line rounded-xl max-h-48 overflow-y-auto mt-2">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-card border-b border-line text-ink-secondary font-bold uppercase tracking-wider text-[10px]">
                          <th className="p-2.5">Allowed Candidates</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line font-mono text-[11px]">
                        {exam.settings.roster.map((email, idx) => (
                          <tr key={idx}>
                            <td className="p-2.5 text-ink-secondary">{email}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-ink-secondary/70">Roster is empty (exam is open to all students).</p>
                )}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Question Modals */}
      <Modal
        open={showTypePicker}
        onClose={() => setShowTypePicker(false)}
        title="Add a question"
        maxWidth="max-w-md"
      >
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => openNewQuestionForm("mcq")}
            className="border border-line rounded-xl p-5 text-center hover:border-accent hover:bg-accent-soft transition-colors cursor-pointer"
          >
            <p className="font-display font-semibold text-ink">MCQ</p>
            <p className="text-xs text-ink-secondary mt-1">Multiple choice</p>
          </button>
          <button
            onClick={() => openNewQuestionForm("coding")}
            className="border border-line rounded-xl p-5 text-center hover:border-accent hover:bg-accent-soft transition-colors cursor-pointer"
          >
            <p className="font-display font-semibold text-ink">Coding</p>
            <p className="text-xs text-ink-secondary mt-1">With test cases</p>
          </button>
        </div>
      </Modal>

      <Modal
        open={activeForm === "mcq"}
        onClose={closeForm}
        title={editingQuestion ? "Edit MCQ question" : "New MCQ question"}
      >
        <McqForm
          initial={editingQuestion}
          onSubmit={handleSaveQuestion}
          onCancel={closeForm}
          submitting={submitting}
        />
      </Modal>

      <Modal
        open={activeForm === "coding"}
        onClose={closeForm}
        title={editingQuestion ? "Edit coding question" : "New coding question"}
        maxWidth="max-w-3xl"
      >
        <CodingForm
          initial={editingQuestion}
          onSubmit={handleSaveQuestion}
          onCancel={closeForm}
          submitting={submitting}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete this draft exam?"
      >
        <p className="text-sm text-ink-secondary mb-6">
          This will permanently delete <strong>{exam.title}</strong> and all its questions.
          This action cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteExam} disabled={deleting}>
            {deleting ? "Deleting..." : "Delete exam"}
          </Button>
        </div>
      </Modal>

    </div>
  );
}
