import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { attemptApi } from "../api/attempts";
import Button from "../components/Button";
import Timer from "../components/Timer";
import ThemeToggle from "../components/ThemeToggle";
import Navbar from "../components/Navbar";
import { VidyoraLogo } from "../components/VidyoraLogo";
import { useTheme } from "../context/ThemeContext";

const MONACO_LANG_MAP = {
  c: "c",
  cpp: "cpp",
  java: "java",
  python: "python",
  javascript: "javascript",
  go: "go",
  rust: "rust",
};

const getQuestionDisplayLabel = (item, idx, settings) => {
  const showNum = settings.showQuestionNumbers !== false;
  const showTitle = settings.showQuestionTitles !== false;
  const showPts = settings.showMarks !== false;

  let parts = [];
  if (showNum && showTitle) {
    parts.push(`Question ${idx + 1}: ${item.title}`);
  } else if (showNum) {
    parts.push(`Question ${idx + 1}`);
  } else if (showTitle) {
    parts.push(item.title);
  } else {
    parts.push(`Question ${idx + 1}`);
  }

  if (showPts) {
    parts.push(`(${item.totalPoints || 0} pts)`);
  }

  return parts.join(" ");
};

export default function ExamAttempt() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Core Exam State
  const [questionIndex, setQuestionIndex] = useState(0);
  const [question, setQuestion] = useState(null);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [questionList, setQuestionList] = useState([]);
  const [settings, setSettings] = useState({});
  const [answers, setAnswers] = useState([]); // Array of existing answers
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [globalTimeLeft, setGlobalTimeLeft] = useState(3600); // seconds left

  // Lobby States
  const [isLobby, setIsLobby] = useState(true);
  const [lobbyData, setLobbyData] = useState(null);
  const [lobbyLoading, setLobbyLoading] = useState(true);
  const [lobbyError, setLobbyError] = useState("");
  const [lobbyCountdown, setLobbyCountdown] = useState(0);
  const [examAccessCode, setExamAccessCode] = useState("");
  const [isLeaderboardPublished, setIsLeaderboardPublished] = useState(false);
  const [examTitleState, setExamTitleState] = useState("");

  // MCQ State
  const [selectedOption, setSelectedOption] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState([]); // for multi-correct

  // Coding State
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("python");
  const [customInput, setCustomInput] = useState("");
  const [enableCustomInput, setEnableCustomInput] = useState(false);
  const [runResults, setRunResults] = useState(null);
  const [selectedTestCaseIdx, setSelectedTestCaseIdx] = useState(0);
  const [running, setRunning] = useState(false);
  const [consoleTab, setConsoleTab] = useState("testcases"); // "testcases" | "output"
  const [editorTheme, setEditorTheme] = useState("vs-dark");
  const [editorFontSize, setEditorFontSize] = useState(14);
  const [wordWrap, setWordWrap] = useState("on");
  const [editorFullscreen, setEditorFullscreen] = useState(false);

  const { theme } = useTheme();

  // UI state
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [autoSaveStatus, setAutoSaveStatus] = useState("Saved");
  const [visitedQuestions, setVisitedQuestions] = useState(new Set([0]));
  const [markedQuestions, setMarkedQuestions] = useState(new Set());
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showFullscreenWarning, setShowFullscreenWarning] = useState(false);
  const [securityModalMsg, setSecurityModalMsg] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [currentQuestionOpen, setCurrentQuestionOpen] = useState(false);

  // Anti-cheat status
  const [warnings, setWarnings] = useState(0);
  const [fullscreenExited, setFullscreenExited] = useState(false);

  // Time & Session tracking refs
  const questionStartTime = useRef(Date.now());
  const autoSaveTimerRef = useRef(null);
  const editorRef = useRef(null);
  const submitAnswerDraftRef = useRef(null);

  // Sync Monaco editor theme with app theme
  useEffect(() => {
    setEditorTheme(theme === "light" || theme === "bright" ? "vs" : "vs-dark");
  }, [theme]);

  // Auto-dismiss security alerts after 5 seconds (no user acknowledgment required)
  useEffect(() => {
    if (!securityModalMsg) return;
    const timer = setTimeout(() => setSecurityModalMsg(""), 5000);
    return () => clearTimeout(timer);
  }, [securityModalMsg]);

  // Sync online state
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setAutoSaveStatus("Syncing local changes...");
      syncLocalBackup();
    };
    const handleOffline = () => {
      setIsOnline(false);
      setAutoSaveStatus("Offline - Saving locally");
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Auto-complete attempt via beacon when student closes browser mid-exam
  useEffect(() => {
    if (isLobby) return; // Don't fire if still in lobby (exam not started)
    const handleBeforeUnload = () => {
      if (!attemptId) return;
      const baseUrl = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/$/, "");
      const url = baseUrl.endsWith("/api")
        ? `${baseUrl}/attempts/${attemptId}/complete`
        : `${baseUrl}/api/attempts/${attemptId}/complete`;
      navigator.sendBeacon(url, new Blob([JSON.stringify({ autoSubmitted: true })], { type: "application/json" }));
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [attemptId, isLobby]);

  // Offline local backups
  const getLocalBackupKey = () => `exam_attempt_backup_${attemptId}`;

  const saveLocalBackup = useCallback((activeCode, mcqOpt, mcqOptsList) => {
    if (!question) return;
    try {
      const backupData = JSON.parse(localStorage.getItem(getLocalBackupKey())) || {};
      backupData[question._id] = {
        code: activeCode,
        language,
        selectedOption: mcqOpt,
        selectedOptions: mcqOptsList,
        timestamp: Date.now()
      };
      localStorage.setItem(getLocalBackupKey(), JSON.stringify(backupData));
      setAutoSaveStatus("Saved locally");
    } catch (e) {
      console.error("Local backup write failed", e);
    }
  }, [attemptId, question, language]);

  const syncLocalBackup = async () => {
    try {
      const backupData = JSON.parse(localStorage.getItem(getLocalBackupKey()));
      if (!backupData || Object.keys(backupData).length === 0) {
        setAutoSaveStatus("Saved");
        return;
      }

      // Sync each unsaved question to the backend
      for (const questionId of Object.keys(backupData)) {
        const item = backupData[questionId];
        await attemptApi.submitAnswer(attemptId, {
          questionId,
          type: item.code ? "coding" : "mcq",
          selectedOptionIndex: item.selectedOption,
          code: item.code,
          language: item.language,
          timeTakenSeconds: 5, // mock time
          autoSubmitted: false,
        });
      }

      localStorage.removeItem(getLocalBackupKey());
      setAutoSaveStatus("Synced to Cloud");
      setTimeout(() => setAutoSaveStatus("Saved"), 3000);
    } catch (err) {
      console.error("Auto sync back failed", err);
      setAutoSaveStatus("Offline backup retained");
    }
  };

  // Load question and exam state
  const loadQuestion = useCallback(async (idx) => {
    setLoading(true);
    setSelectedOption(null);
    setSelectedOptions([]);
    setRunResults(null);
    setSelectedTestCaseIdx(0);
    setSubmitError("");
    try {
      const res = await attemptApi.getQuestion(attemptId, idx);
      const { question: q, totalQuestions: t, settings: s, startedAt: start, answers: ans, questionList: ql, questionRemainingTimes: qrt, tabSwitchCount, fullscreenExitCount, pasteAttemptCount } = res.data;
      
      // Initialize remaining timers from backend to localStorage FIRST before setting active states to avoid race conditions
      if (qrt) {
        Object.entries(qrt).forEach(([qId, secs]) => {
          localStorage.setItem(`timer_left_${qId}`, String(secs));
        });
      }

      setQuestion(q);
      setTotalQuestions(t);
      setSettings(s);
      setStartedAt(start);
      setAnswers(ans);
      setQuestionList(ql || []);
      setWarnings((tabSwitchCount || 0) + (fullscreenExitCount || 0) + (pasteAttemptCount || 0));

      // Calculate global time left
      if (start && s.duration) {
        const elapsed = (Date.now() - new Date(start).getTime()) / 1000;
        let remaining = s.duration * 60 - elapsed;
        
        if (res.data.endAt) {
          const absoluteRemaining = (new Date(res.data.endAt).getTime() - Date.now()) / 1000;
          remaining = Math.min(remaining, absoluteRemaining);
        }
        
        setGlobalTimeLeft(Math.max(0, Math.round(remaining)));
      }

      // Restore previous response (from backend or local storage)
      const localBackup = JSON.parse(localStorage.getItem(getLocalBackupKey())) || {};
      const backupItem = localBackup[q._id];

      const answeredRecord = ans.find((a) => a.question === q._id);

      if (q.type === "mcq") {
        if (backupItem && backupItem.selectedOption !== undefined) {
          setSelectedOption(backupItem.selectedOption);
          setSelectedOptions(backupItem.selectedOptions || []);
        } else if (answeredRecord) {
          setSelectedOption(answeredRecord.selectedOptionIndex);
          setSelectedOptions(answeredRecord.selectedOptionsIndexList || []);
        }
      } else {
        const allowedLangs = q.allowedLanguages || ["python"];
        const lastSelectedLang = backupItem?.language || answeredRecord?.language || allowedLangs[0] || "python";
        setLanguage(lastSelectedLang);

        if (backupItem && backupItem.code !== undefined) {
          setCode(backupItem.code);
        } else if (answeredRecord) {
          setCode(answeredRecord.code);
        } else {
          setCode(q.starterCode?.[lastSelectedLang] || "");
        }
      }

      questionStartTime.current = Date.now();
      setVisitedQuestions((prev) => {
        const next = new Set(prev);
        next.add(idx);
        return next;
      });
    } catch (err) {
      console.error(err);
      if (err.response?.status === 403) {
        navigate(`/exam-complete`);
      }
    } finally {
      setLoading(false);
    }
  }, [attemptId, navigate]);

  const formatLobbyTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) {
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    }
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const loadLobby = useCallback(async () => {
    setLobbyLoading(true);
    setLobbyError("");
    try {
      const res = await attemptApi.getLobby(attemptId);
      const { examTitle, isClosed, startAt, endAt, settings: s, startedAt: start, accessCode, isLeaderboardPublished: lbPublished } = res.data;
      
      setLobbyData(res.data);
      setSettings(s);
      if (accessCode) setExamAccessCode(accessCode);
      if (lbPublished !== undefined) setIsLeaderboardPublished(lbPublished);
      if (examTitle) setExamTitleState(examTitle);
      
      if (start) {
        setIsLobby(false);
        setStartedAt(start);
        return;
      }
      
      if (isClosed || (endAt && new Date() > new Date(endAt))) {
        setLobbyError("This exam has ended. You can no longer start or attempt this exam.");
        return;
      }
      
      if (startAt) {
        const diff = Math.floor((new Date(startAt).getTime() - Date.now()) / 1000);
        setLobbyCountdown(Math.max(0, diff));
      } else {
        setLobbyCountdown(0);
      }
    } catch (err) {
      console.error(err);
      setLobbyError(err.response?.data?.message || "Failed to load exam lobby details.");
    } finally {
      setLobbyLoading(false);
    }
  }, [attemptId]);

  useEffect(() => {
    loadLobby();
  }, [attemptId, loadLobby]);

  useEffect(() => {
    if (!isLobby) {
      loadQuestion(questionIndex);
    }
  }, [questionIndex, loadQuestion, isLobby]);

  // Lobby countdown timer tick
  useEffect(() => {
    if (!isLobby || lobbyCountdown <= 0) return;
    const timer = setInterval(() => {
      setLobbyCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isLobby, lobbyCountdown]);

  const handleStartExam = async () => {
    setSubmitting(true);
    try {
      const res = await attemptApi.start(attemptId);
      setStartedAt(res.data.startedAt);
      setIsLobby(false);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to start assessment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditorMount = (editor) => {
    editorRef.current = editor;

    // Zoom keyboard shortcuts inside Monaco
    editor.onKeyDown((e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.browserEvent?.key === "+" || e.browserEvent?.key === "=") {
          e.preventDefault();
          e.stopPropagation();
          setEditorFontSize((prev) => Math.min(30, prev + 1));
        } else if (e.browserEvent?.key === "-") {
          e.preventDefault();
          e.stopPropagation();
          setEditorFontSize((prev) => Math.max(10, prev - 1));
        }
      }
    });

    // Zoom mouse wheel inside Monaco
    editor.onMouseWheel((e) => {
      if (e.browserEvent.ctrlKey) {
        e.preventDefault();
        e.stopPropagation();
        if (e.deltaY < 0) {
          setEditorFontSize((prev) => Math.min(30, prev + 1));
        } else if (e.deltaY > 0) {
          setEditorFontSize((prev) => Math.max(10, prev - 1));
        }
      }
    });

    // Block paste if anti-cheat is enabled
    editor.onDidPaste(() => {
      editor.trigger("source", "undo");
      triggerAntiCheatWarning("paste_attempt", "Security Notice: Pasting content inside the code editor is strictly prohibited.");
    });
  };

  // Global exam countdown timer
  useEffect(() => {
    if (loading) return;
    const timer = setInterval(() => {
      setGlobalTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleGlobalTimerExpire();
          return 0;
        }

        const minutes = Math.round((prev - 1) / 60);
        if (minutes === 5) {
          setSecurityModalMsg(`Notice: You have 5 minutes remaining to complete your exam.`);
        }

        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [loading]);

  // Auto-Save interval
  useEffect(() => {
    if (loading || !question) return;
    autoSaveTimerRef.current = setInterval(() => {
      if (!isOnline) return;
      setAutoSaveStatus("Saving...");
      
      const timeTakenSeconds = Math.round((Date.now() - questionStartTime.current) / 1000);
      let remainingSeconds = undefined;
      if (question) {
        const localSecs = localStorage.getItem(`timer_left_${question._id}`);
        if (localSecs !== null) {
          remainingSeconds = parseInt(localSecs, 10);
        }
      }

      attemptApi.submitAnswer(attemptId, {
        questionId: question._id,
        type: question.type,
        selectedOptionIndex: question.type === "mcq" ? selectedOption : null,
        code: question.type === "coding" ? code : "",
        language: question.type === "coding" ? language : "",
        timeTakenSeconds,
        autoSubmitted: false,
        remainingSeconds,
      }).then(() => {
        setAutoSaveStatus("Saved");
      }).catch(() => {
        setAutoSaveStatus("Saving failed");
      });
    }, 15000); // Auto-save database backup every 15s

    return () => clearInterval(autoSaveTimerRef.current);
  }, [loading, question, code, language, selectedOption, isOnline, attemptId]);

  const handleGlobalTimerExpire = async () => {
    setAutoSaveStatus("Timer expired. Submitting...");
    try {
      await attemptApi.complete(attemptId);
      navigate("/exam-complete", { state: { examTitle: examTitleState, autoSubmitted: true, accessCode: examAccessCode, isLeaderboardPublished } });
    } catch {
      navigate("/exam-complete", { state: { accessCode: examAccessCode, isLeaderboardPublished } });
    }
  };

  const submitAnswerDraft = async (goNext = true) => {
    if (!question) return;
    setSubmitting(true);
    setSubmitError("");
    setAutoSaveStatus("Saving...");
    
    const timeTakenSeconds = Math.round((Date.now() - questionStartTime.current) / 1000);
    let remainingSeconds = undefined;
    const localSecs = localStorage.getItem(`timer_left_${question._id}`);
    if (localSecs !== null) {
      remainingSeconds = parseInt(localSecs, 10);
    }

    try {
      if (isOnline) {
        await attemptApi.submitAnswer(attemptId, {
          questionId: question._id,
          type: question.type,
          selectedOptionIndex: selectedOption,
          code: code,
          language: language,
          timeTakenSeconds,
          autoSubmitted: false,
          remainingSeconds
        });
        setAutoSaveStatus("Saved");
      } else {
        saveLocalBackup(code, selectedOption, selectedOptions);
      }

      // Update local answers copy to keep navigator state updated
      setAnswers((prev) => {
        const next = [...prev];
        const idx = next.findIndex((a) => a.question === question._id);
        const record = {
          question: question._id,
          type: question.type,
          selectedOptionIndex: selectedOption,
          code,
          language
        };
        if (idx > -1) {
          next[idx] = record;
        } else {
          next.push(record);
        }
        return next;
      });

      if (goNext) {
        handleNextQuestion();
      }
    } catch (err) {
      console.error(err);
      setSubmitError(err.response?.data?.message || "An error occurred while saving your answer. Please try again.");
      setAutoSaveStatus("Error Saving");
    } finally {
      setSubmitting(false);
    }
  };

  submitAnswerDraftRef.current = submitAnswerDraft;

  const handleQuestionTimerExpire = useCallback(() => {
    if (settings.singleQuestionMode) {
      submitAnswerDraftRef.current?.(false);
      setCurrentQuestionOpen(false);
    } else {
      submitAnswerDraftRef.current?.(true);
    }
  }, [settings.singleQuestionMode]);

  const handleNextQuestion = () => {
    const nextIdx = questionIndex + 1;
    if (nextIdx < totalQuestions) {
      setQuestionIndex(nextIdx);
    } else {
      setShowReviewModal(true);
    }
  };

  const handlePrevQuestion = async () => {
    const prevIdx = questionIndex - 1;
    if (prevIdx >= 0 && question) {
      try {
        await submitAnswerDraft(false);
      } catch (e) {
        console.error("Failed to save draft on prev question:", e);
      }
      setQuestionIndex(prevIdx);
    }
  };

  const handleNavigateToQuestion = async (idx) => {
    if (idx === questionIndex || !question) return;
    try {
      await submitAnswerDraft(false);
    } catch (e) {
      console.error("Failed to save draft on navigation:", e);
    }
    setQuestionIndex(idx);
  };

  const handleRunCode = async () => {
    if (!question || running) return;
    setRunning(true);
    setConsoleTab("output");
    setRunResults(null);
    setSelectedTestCaseIdx(0);
    try {
      const res = await attemptApi.runCode(attemptId, {
        questionId: question._id,
        code,
        language,
        customInput: enableCustomInput ? customInput : undefined
      });
      setRunResults(res.data.results);
    } catch (err) {
      const errMsg = err.response?.data?.message || 
        "Could not execute code: Code execution service (backend/Judge0 CE/Docker) is unavailable or offline. Please check system status.";
      setRunResults([{ passed: false, error: errMsg }]);
    } finally {
      setRunning(false);
    }
  };

  const finishExam = async () => {
    setShowReviewModal(false);
    setLoading(true);
    try {
      await attemptApi.complete(attemptId);
      localStorage.removeItem(getLocalBackupKey());
      navigate("/exam-complete", { state: { examTitle: examTitleState, accessCode: examAccessCode, isLeaderboardPublished } });
    } catch {
      setSubmitError("Failed to finalize exam submission. Please check connection.");
      setLoading(false);
    }
  };

  // Anti-Cheat Events
  const triggerAntiCheatWarning = useCallback(async (type, msg) => {
    try {
      const res = await attemptApi.logEvent(attemptId, type);
      const totalWarnings = res.data.totalWarnings || (warnings + 1);
      setWarnings(totalWarnings);

      if (res.data.autoSubmitted) {
        navigate("/exam-complete", { state: { examTitle: examTitleState, autoSubmitted: true, accessCode: examAccessCode, isLeaderboardPublished } });
        return;
      }

      setSecurityModalMsg(msg + ` (Warning ${totalWarnings} / ${settings.warningLimit || 3})`);
    } catch {
      console.error("Anti-cheat sync failed");
    }
  }, [attemptId, warnings, settings.warningLimit, navigate, examAccessCode, isLeaderboardPublished, examTitleState]);

  // Request Fullscreen helper
  const requestFullscreenMode = () => {
    const el = document.documentElement;
    if (el.requestFullscreen) {
      el.requestFullscreen().then(() => {
        setShowFullscreenWarning(false);
        setFullscreenExited(false);
      }).catch(() => {
        setShowFullscreenWarning(true);
      });
    }
  };

  // ── EFFECT 1: Fullscreen + tab-switch guards (conditional on exam settings) ──
  useEffect(() => {
    if (loading || !settings.enableFullScreen) return;

    // Visibility (Tab Switches)
    const handleVisibility = () => {
      if (document.hidden) {
        triggerAntiCheatWarning("tab_switch", "Security Alert: Tab switching, window swapping, or minimizing is strictly prohibited.");
      }
    };

    // Fullscreen Changes
    const handleFullscreen = () => {
      if (!document.fullscreenElement) {
        setFullscreenExited(true);
        setShowFullscreenWarning(true);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    document.addEventListener("fullscreenchange", handleFullscreen);

    // Initial fullscreen check
    if (!document.fullscreenElement && !fullscreenExited) {
      setShowFullscreenWarning(true);
    }

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      document.removeEventListener("fullscreenchange", handleFullscreen);
    };
  }, [loading, settings.enableFullScreen, triggerAntiCheatWarning, fullscreenExited]);

  // ── EFFECT 2: Copy / Paste / Right-click protection — ALWAYS ON during exam ──
  useEffect(() => {
    if (loading) return;

    // Block right-click context menu
    const handleContextMenu = (e) => {
      e.preventDefault();
    };

    // Block copy/paste/cut/select-all keyboard shortcuts
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "c") {
        e.preventDefault();
        triggerAntiCheatWarning("paste_attempt", "Copying is strictly prohibited during the assessment.");
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "v") {
        e.preventDefault();
        triggerAntiCheatWarning("paste_attempt", "Pasting external content is strictly prohibited during the assessment.");
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "x" || e.key === "a")) {
        e.preventDefault();
        return;
      }
      if (e.key === "PrintScreen") {
        e.preventDefault();
        return;
      }
    };

    // Block copy/cut events at the document level
    const blockClipboard = (e) => {
      e.preventDefault();
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("copy", blockClipboard);
    document.addEventListener("cut", blockClipboard);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("copy", blockClipboard);
      document.removeEventListener("cut", blockClipboard);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [loading, triggerAntiCheatWarning]);

  // Toggle editor fullscreen wrapper
  const toggleEditorFullscreen = () => {
    setEditorFullscreen(!editorFullscreen);
  };

  if (!isLobby && loading) {
    return (
      <div className="min-h-screen bg-paper flex flex-col items-center justify-center text-ink gap-4">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
        <p className="font-mono text-sm tracking-wider animate-pulse">SETTING UP ASSESSMENT ENVIRONMENT...</p>
      </div>
    );
  }

  // Format countdown string
  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const answeredCount = answers.length;
  const remainingCount = totalQuestions - answeredCount;
  const isQuestionAnswered = (qId) => answers.some((a) => a.question === qId);
  const isQuestionMarked = (qId) => markedQuestions.has(qId);
  const isQuestionVisited = (idx) => visitedQuestions.has(idx);

  const getRemainingSeconds = (qId, limit) => {
    try {
      const saved = localStorage.getItem(`timer_left_${qId}`);
      if (saved !== null) {
        return parseInt(saved, 10);
      }
    } catch (e) {
      console.error(e);
    }
    return limit;
  };

  const isQuestionTimeExpired = question?.timerSeconds > 0 && getRemainingSeconds(question?._id, question.timerSeconds) <= 0;

  if (isLobby) {
    if (lobbyLoading) {
      return (
        <div className="min-h-screen bg-paper flex flex-col items-center justify-center text-ink gap-4">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
          <p className="font-mono text-sm tracking-wider animate-pulse">PREPARING ASSESSMENT LOBBY...</p>
        </div>
      );
    }

    if (lobbyError) {
      return (
        <div className="min-h-screen bg-paper flex flex-col">
          <Navbar />
          <div className="flex-1 flex flex-col items-center justify-center text-danger px-4 text-center">
            <span className="text-3xl mb-4">⚠️</span>
            <p className="font-semibold text-lg">{lobbyError}</p>
          </div>
        </div>
      );
    }

    const { examTitle, questionsList, startAt, endAt } = lobbyData;
    const isPastEnd = endAt && new Date() >= new Date(endAt);

    return (
      <div className="min-h-screen bg-paper font-expert flex flex-col">
        <Navbar />

        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-2xl bg-surface border border-line rounded-3xl p-8 md:p-10 shadow-xl flex flex-col gap-6">
            <div className="text-center pb-4 border-b border-line/60">
              <span className="text-xs uppercase font-extrabold tracking-widest text-accent-deep bg-accent-soft/30 px-3 py-1 rounded-full border border-accent/25">Assessment Lobby</span>
              <h1 className="font-display text-3xl font-extrabold text-ink mt-3">{examTitle}</h1>
              {startAt && (
                <p className="text-xs text-ink-secondary mt-1.5 font-mono">
                  Scheduled Start: {new Date(startAt).toLocaleString()}
                </p>
              )}
            </div>

            {/* Questions List Board */}
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-ink-secondary mb-3.5">Exam Structure & Instructions</h3>
              <div className="flex flex-col gap-2.5 max-h-60 overflow-y-auto pr-1">
                {questionsList.map((q, idx) => {
                  const showNum = settings.showQuestionNumbers ?? true;
                  const showTitle = settings.showQuestionTitles ?? true;
                  const showMarks = settings.showMarks ?? true;
                  
                  return (
                    <div key={q._id} className="flex items-center justify-between border border-line bg-card/45 hover:bg-card/75 p-3.5 rounded-xl transition-all">
                      <div className="flex items-center gap-3">
                        {showNum && (
                          <span className="w-6 h-6 rounded-full bg-accent-soft/40 text-accent-deep border border-accent/20 text-xs font-bold font-mono flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                        )}
                        {showTitle ? (
                          <span className="text-sm font-semibold text-ink">
                            {showNum ? q.title : `Question: ${q.title}`}
                          </span>
                        ) : (
                          showNum ? null : <span className="text-sm font-semibold text-ink">Question {idx + 1}</span>
                        )}
                      </div>
                      {showMarks && (
                        <span className="text-xs font-bold text-ink-secondary font-mono bg-paper/60 px-2.5 py-1 border border-line rounded-lg shrink-0">
                          {q.totalPoints} Points
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Countdown / Start Action */}
            <div className="flex flex-col items-center gap-4 pt-4 border-t border-line/60">
              {lobbyCountdown > 0 ? (
                <div className="flex flex-col items-center gap-2">
                  <p className="text-xs font-extrabold uppercase tracking-widest text-ink-secondary">Exam Starts In</p>
                  <div className="flex items-center gap-2 font-mono text-3xl font-black bg-danger-soft/20 text-danger border border-danger/25 px-6 py-3 rounded-2xl animate-pulse">
                    ⏱ {formatLobbyTime(lobbyCountdown)}
                  </div>
                </div>
              ) : isPastEnd ? (
                <p className="text-sm text-danger font-bold">This exam has already ended.</p>
              ) : (
                <p className="text-xs text-emerald-600 font-bold flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1.5 border border-emerald-500/20 rounded-full">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                  Exam is active. You can begin now.
                </p>
              )}

              <Button
                onClick={handleStartExam}
                disabled={lobbyCountdown > 0 || isPastEnd || submitting}
                className="w-full py-3.5 text-base font-bold shadow-lg"
              >
                {submitting ? "Entering Exam..." : "Start Exam →"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col font-sans select-none font-expert exam-no-select">
      
      {/* Network Alert Banner */}
      {!isOnline && (
        <div className="bg-danger text-white text-xs font-semibold py-2 px-6 text-center animate-pulse z-50 shrink-0">
          Network Connection Lost! Saving work locally. Do not refresh or exit this page.
        </div>
      )}

      {/* Top Header */}
      <header className="border-b border-line bg-surface px-6 py-3 flex items-center justify-between shrink-0 sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-4">
          <VidyoraLogo
            size="sm"
            to=""
            className="flex items-center gap-2"
          />
          <div className="h-6 w-[1px] bg-line hidden sm:block"></div>
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-full bg-accent-soft/50 border border-accent/20 text-accent flex items-center justify-center text-xs font-bold shrink-0">
              👤
            </span>
            <div>
              <h1 className="font-semibold text-xs leading-tight tracking-tight max-w-[150px] truncate" title={location.state?.examTitle}>{location.state?.examTitle || "Online Exam"}</h1>
              <p className="text-[10px] text-ink-secondary mt-0.5 leading-none">
                Candidate: <span className="font-sans font-bold text-accent">{location.state?.candidateName || "Student"}</span>
              </p>
            </div>
          </div>
          <div className="h-6 w-[1px] bg-line hidden sm:block"></div>
          <ThemeToggle />
        </div>

        {/* Exam stats and status */}
        <div className="flex items-center gap-4">
          <div className="text-right hidden md:block">
            <p className="text-[10px] text-ink-secondary font-bold uppercase tracking-wider">Progress</p>
            <p className="text-xs font-mono font-semibold">Answered: {answeredCount}/{totalQuestions}</p>
          </div>

          {/* Warnings Counter */}
          {settings.enableFullScreen && (
            <div className={`px-2.5 py-1.5 rounded-xl border text-xs font-mono font-semibold flex items-center gap-1.5 ${
              warnings > 0 ? "border-danger bg-danger-soft text-danger animate-bounce" : "border-line text-ink-secondary"
            }`}>
              Violations: {warnings}/{settings.warningLimit || 3}
            </div>
          )}

          {/* Global Timer Display */}
          <div className={`flex items-center gap-2 font-mono text-sm font-bold px-3.5 py-1.5 rounded-xl border ${
            globalTimeLeft <= 300 ? "bg-danger-soft border-danger text-danger animate-pulse" : "bg-card border-line text-ink"
          }`}>
            {formatTime(globalTimeLeft)}
          </div>

          {/* Per-question timer */}
          {!loading && question?.timerSeconds > 0 && (!settings.singleQuestionMode || currentQuestionOpen) && (
            <Timer
              totalSeconds={question.timerSeconds}
              questionKey={question._id}
              onExpire={handleQuestionTimerExpire}
            />
          )}

          <div className="text-xs text-ink-secondary hidden lg:block font-mono bg-card px-2.5 py-1.5 border border-line rounded-xl">
            {autoSaveStatus === "Saved" ? "Saved" : autoSaveStatus}
          </div>

          <Button onClick={() => setShowReviewModal(true)} variant="secondary" className="px-4 py-1.5 text-xs font-semibold">
            Submit Exam
          </Button>
        </div>
      </header>

      {/* Main Workspace */}
      {settings.singleQuestionMode && !currentQuestionOpen ? (
        <main className="flex-1 overflow-y-auto p-6 md:p-8 max-w-4xl mx-auto w-full">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-ink">Exam Questions Overview</h2>
              <p className="text-xs text-ink-secondary mt-1">Select a question below to open and attempt it.</p>
            </div>
            <div className="text-xs text-ink-secondary font-mono bg-card px-3 py-1.5 border border-line rounded-xl">
              {autoSaveStatus === "Saved" ? "All answers saved" : autoSaveStatus}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {questionList.map((item, idx) => {
              const answered = isQuestionAnswered(item._id);
              const marked = isQuestionMarked(item._id);
              const visited = isQuestionVisited(idx);

              let statusText = "Not Visited";
              let statusClass = "border-line text-ink-secondary bg-surface";
              if (marked) {
                statusText = "Marked for Review";
                statusClass = "border-warning bg-warning-soft text-warning";
              } else if (answered) {
                statusText = "Answered";
                statusClass = "border-success bg-success-soft text-success";
              } else if (visited) {
                statusText = "Visited";
                statusClass = "border-line bg-card text-ink/75";
              }

              // Question timer remaining display
              let qRemainingTime = null;
              const limit = item.timerSeconds || 0;
              const rem = getRemainingSeconds(item._id, limit);
              if (settings.enablePerQuestionTimer) {
                qRemainingTime = rem <= 0 ? "Expired" : formatLobbyTime(rem);
              }

              const isExpired = settings.enablePerQuestionTimer && rem <= 0;

              return (
                <div key={item._id} className="bg-surface border border-line rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm md:text-base text-ink">
                      {getQuestionDisplayLabel(item, idx, settings)}
                    </h3>
                    <div className="flex flex-wrap gap-2.5 mt-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${statusClass}`}>
                        {statusText}
                      </span>
                      {settings.enablePerQuestionTimer && settings.showTimerInQuestionList !== false && (
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono border ${isExpired ? "border-danger text-danger bg-danger-soft/20 animate-pulse" : "border-line text-ink-secondary"}`}>
                          ⏱ {qRemainingTime}
                        </span>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={() => {
                      setQuestionIndex(idx);
                      setCurrentQuestionOpen(true);
                    }}
                    disabled={isExpired}
                    variant={answered ? "secondary" : "primary"}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-semibold shadow-sm text-xs cursor-pointer"
                  >
                    {isExpired ? "Time Expired" : answered ? "Resume Attempt" : "Attempt Question"}
                  </Button>
                </div>
              );
            })}
          </div>
        </main>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Left Question Navigator */}
          {!settings.singleQuestionMode && (
            <aside className="w-64 border-r border-line bg-surface flex flex-col shrink-0 overflow-y-auto">
              {settings.showQuestionNumbers && (
                <div className="p-4 border-b border-line">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-ink-secondary mb-3">Question Map</h2>
                  <div className="grid grid-cols-4 gap-2">
                    {questionList.map((item, idx) => {
                      const answered = isQuestionAnswered(item._id);
                      const marked = isQuestionMarked(item._id);
                      const visited = isQuestionVisited(idx);
                      const isCurrent = idx === questionIndex;

                      let btnStyles = "border border-line bg-card text-ink-secondary hover:border-accent/60";
                      if (isCurrent) {
                        btnStyles = "border-2 border-accent bg-accent-soft text-accent-deep font-bold";
                      } else if (marked) {
                        btnStyles = "bg-warning-soft border-warning text-warning font-semibold";
                      } else if (answered) {
                        btnStyles = "bg-success-soft border-success text-success font-semibold";
                      } else if (visited) {
                        btnStyles = "border border-line bg-surface text-ink/75";
                      } else {
                        btnStyles = "border border-dashed border-line opacity-50 bg-paper text-ink-secondary";
                      }

                      // Sequential Navigation Lock
                      const isLocked = settings.sequentialNavigation && idx > Math.max(...Array.from(visitedQuestions), 0) + 1;

                      return (
                        <button
                          key={item._id}
                          disabled={isLocked}
                          onClick={() => {
                            if (!settings.sequentialNavigation) {
                              handleNavigateToQuestion(idx);
                            }
                          }}
                          className={`h-10 w-10 text-xs font-mono rounded-lg transition-all flex items-center justify-center ${btnStyles} ${
                            isLocked ? "opacity-30 cursor-not-allowed" : "cursor-pointer"
                          }`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Question titles in sidebar */}
              {settings.showQuestionTitles && questionList.length > 0 && (
                <div className="p-4 border-b border-line flex-1">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-ink-secondary mb-2">Details</h3>
                  <div className="flex flex-col gap-1 text-xs">
                    {questionList.map((item, idx) => {
                      const isCurrent = idx === questionIndex;
                      return (
                        <div 
                          key={item._id}
                          onClick={() => !settings.sequentialNavigation && handleNavigateToQuestion(idx)}
                          className={`p-2 rounded-lg truncate cursor-pointer transition-colors ${
                            isCurrent ? "bg-accent-soft text-accent-deep font-semibold" : "hover:bg-card text-ink-secondary"
                          }`}
                        >
                          {getQuestionDisplayLabel(item, idx, settings)}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Status Legend */}
              <div className="p-4 bg-card/40 mt-auto border-t border-line text-[10px] flex flex-col gap-2">
                <span className="font-bold text-ink-secondary uppercase tracking-wider mb-1">Legend</span>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-accent-soft border border-accent"></span><span>Current</span></div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-success-soft border border-success"></span><span>Answered</span></div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-warning-soft border border-warning"></span><span>Marked for Review</span></div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-surface border border-line"></span><span>Visited</span></div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-paper border border-dashed border-line opacity-50"></span><span>Not Visited</span></div>
              </div>
            </aside>
          )}

        {/* Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden bg-paper">
          
          {/* Question Meta Header */}
          <div className="bg-surface border-b border-line px-6 py-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3">
              {settings.singleQuestionMode && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    submitAnswerDraft(false);
                    setCurrentQuestionOpen(false);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold mr-2 cursor-pointer flex items-center gap-1"
                >
                  <span>←</span> Back to List
                </Button>
              )}
              <span className="text-xs font-bold font-mono bg-card px-2.5 py-1 border border-line rounded-lg text-ink-secondary">
                Q.{questionIndex + 1}
              </span>
              <h2 className="font-display font-semibold text-base">
                {settings.showQuestionTitles ? question.title : `Question ${questionIndex + 1}`}
              </h2>
              <span className="text-xs font-medium bg-accent-soft text-accent px-2 py-0.5 rounded-full capitalize">
                {question.type === "mcq" ? "Multiple Choice" : "Coding Challenge"}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono">
              {settings.showDifficulty && question.difficulty && (
                <span className="text-ink-secondary">Difficulty: <span className="font-semibold text-accent">{question.difficulty}</span></span>
              )}
              {settings.showTopic && question.topic && (
                <span className="text-ink-secondary">Topic: <span className="font-semibold text-accent">{question.topic}</span></span>
              )}
              {settings.showMarks && (
                <span className="text-success font-semibold">[{question.totalPoints} Marks]</span>
              )}
            </div>
          </div>

          {submitError && (
            <div className="mx-6 mt-4 p-3 bg-danger-soft border border-danger text-danger text-sm rounded-xl font-medium flex items-center justify-between">
              <span>Error: {submitError}</span>
              <button onClick={() => setSubmitError("")} className="text-xs underline cursor-pointer">dismiss</button>
            </div>
          )}

          {/* Interactive Panels */}
          {question.type === "mcq" ? (
            // MCQ View
            <div className="flex-1 overflow-y-auto px-6 py-8 max-w-3xl mx-auto w-full flex flex-col justify-between">
              <div>
                {isQuestionTimeExpired && (
                  <div className="mb-6 p-4 bg-danger/10 border border-danger/25 text-danger text-sm font-semibold rounded-xl flex items-center gap-2.5">
                    <span>⚠️</span>
                    <span>Time limit for this question has expired. You can no longer edit this response.</span>
                  </div>
                )}
                <div className="prose prose-invert max-w-none text-base text-ink mb-8 whitespace-pre-wrap leading-relaxed">
                  {question.statement}
                </div>

                <div className="flex flex-col gap-3">
                  {question.options.map((opt, idx) => {
                    const isSelected = selectedOption === idx;
                    return (
                      <button
                        key={idx}
                        disabled={isQuestionTimeExpired}
                        onClick={() => setSelectedOption(idx)}
                        className={`text-left px-5 py-4 rounded-xl border transition-all flex items-center gap-4 ${
                          isQuestionTimeExpired 
                            ? "opacity-60 border-line bg-surface cursor-not-allowed" 
                            : "cursor-pointer hover:-translate-y-0.5"
                        } ${
                          isSelected
                            ? "border-accent bg-accent-soft/40 text-accent font-semibold shadow-sm"
                            : "border-line bg-surface hover:border-accent/40"
                        }`}
                      >
                        <span className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 font-mono text-[10px] ${
                          isSelected ? "border-accent bg-accent text-white" : "border-line"
                        }`}>
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="text-sm">{opt.text}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Nav Buttons */}
              <div className="flex items-center justify-between border-t border-line pt-6 mt-8">
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      if (markedQuestions.has(question._id)) {
                        setMarkedQuestions((prev) => {
                          const next = new Set(prev);
                          next.delete(question._id);
                          return next;
                        });
                      } else {
                        setMarkedQuestions((prev) => {
                          const next = new Set(prev);
                          next.add(question._id);
                          return next;
                        });
                      }
                    }}
                    className="px-4 text-xs"
                  >
                    {markedQuestions.has(question._id) ? "Unmark Review" : "Mark for Review"}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setSelectedOption(null)}
                    disabled={selectedOption === null || isQuestionTimeExpired}
                    className="px-4 text-xs"
                  >
                    Clear Response
                  </Button>
                </div>
                <div className="flex gap-2">
                  {settings.singleQuestionMode ? (
                    <Button
                      onClick={() => {
                        submitAnswerDraft(false);
                        setCurrentQuestionOpen(false);
                      }}
                      disabled={submitting}
                      className="px-5 text-xs cursor-pointer font-semibold shadow-sm"
                    >
                      {submitting ? "Saving..." : "Save & Back to List"}
                    </Button>
                  ) : (
                    <>
                      {settings.allowPreviousQuestion && questionIndex > 0 && (
                        <Button variant="secondary" onClick={handlePrevQuestion} className="px-4 text-xs">
                          Previous
                        </Button>
                      )}
                      {isQuestionTimeExpired ? (
                        <Button onClick={handleNextQuestion} className="px-5 text-xs">
                          {questionIndex + 1 === totalQuestions ? "Review Exam" : "Next Question"}
                        </Button>
                      ) : (
                        <Button onClick={() => submitAnswerDraft(true)} disabled={submitting} className="px-5 text-xs">
                          {submitting ? "Saving..." : questionIndex + 1 === totalQuestions ? "Submit & Review" : "Save & Next"}
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            // Coding View Layout
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
              
              {/* Left Column: Problem details */}
              <div className="w-full lg:w-1/2 border-r border-line bg-surface flex flex-col overflow-y-auto p-6">
                {isQuestionTimeExpired && (
                  <div className="mb-4 p-3 bg-danger/10 border border-danger/25 text-danger text-xs font-semibold rounded-xl flex items-center gap-2">
                    <span>⚠️</span>
                    <span>Time limit for this question has expired. Editing is disabled.</span>
                  </div>
                )}
                <div className="prose prose-invert max-w-none text-sm text-ink mb-6 whitespace-pre-wrap leading-relaxed">
                  {question.statement}
                </div>

                {/* Sample Case Block */}
                {settings.showSampleTestCases && question.sampleTestCases?.length > 0 && (
                  <div className="mt-4 flex flex-col gap-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-ink-secondary">Sample Test Cases</h3>
                    {question.sampleTestCases.map((tc, idx) => (
                      <div key={idx} className="bg-card border border-line rounded-xl p-4 text-xs font-mono">
                        <div className="flex items-center justify-between border-b border-line pb-2 mb-2 text-[10px] uppercase text-ink-secondary">
                          <span>Sample Case {idx + 1}</span>
                          <span className="text-success font-semibold">{tc.points} pts</span>
                        </div>
                        <p className="text-ink-secondary mb-1">Input:</p>
                        <pre className="bg-paper border border-line p-2 rounded-lg whitespace-pre-wrap mb-3 text-ink/90">{tc.input || "(none)"}</pre>
                        <p className="text-ink-secondary mb-1">Expected Output:</p>
                        <pre className="bg-paper border border-line p-2 rounded-lg whitespace-pre-wrap text-ink/90">{tc.expectedOutput}</pre>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Code Editor & Console */}
              <div className="w-full lg:w-1/2 flex flex-col overflow-hidden bg-card">
                
                {/* Editor Header Toolbar */}
                <div className="flex items-center justify-between px-4 py-2 border-b border-line bg-surface shrink-0">
                  <div className="flex items-center gap-3">
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="text-xs border border-line rounded-lg px-2.5 py-1.5 bg-card text-ink font-semibold"
                    >
                      {question.allowedLanguages.map((lang) => (
                        <option key={lang} value={lang}>
                          {lang.toUpperCase()}
                        </option>
                      ))}
                    </select>

                    <div className="flex items-center gap-1 bg-card border border-line rounded-lg p-0.5">
                      <button
                        type="button"
                        onClick={() => setEditorFontSize((prev) => Math.max(10, prev - 1))}
                        className="w-6 h-6 flex items-center justify-center text-xs font-bold text-ink-secondary hover:text-ink hover:bg-line/20 rounded cursor-pointer"
                        title="Zoom Out (Ctrl + '-')"
                      >
                        A-
                      </button>
                      <span className="text-[10px] text-ink font-mono font-bold px-1 select-none">{editorFontSize}px</span>
                      <button
                        type="button"
                        onClick={() => setEditorFontSize((prev) => Math.min(30, prev + 1))}
                        className="w-6 h-6 flex items-center justify-center text-xs font-bold text-ink-secondary hover:text-ink hover:bg-line/20 rounded cursor-pointer"
                        title="Zoom In (Ctrl + '+')"
                      >
                        A+
                      </button>
                    </div>

                    <button
                      onClick={() => setWordWrap(wordWrap === "on" ? "off" : "on")}
                      className={`text-xs border rounded-lg px-2 py-1.5 transition-colors hidden sm:block ${
                        wordWrap === "on" ? "border-accent text-accent bg-accent-soft/30" : "border-line text-ink-secondary"
                      }`}
                    >
                      Wrap
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (markedQuestions.has(question._id)) {
                          setMarkedQuestions((prev) => {
                            const next = new Set(prev);
                            next.delete(question._id);
                            return next;
                          });
                        } else {
                          setMarkedQuestions((prev) => {
                            const next = new Set(prev);
                            next.add(question._id);
                            return next;
                          });
                        }
                      }}
                      className="p-1.5 border border-line text-xs rounded-lg text-ink-secondary hover:text-ink hover:bg-card"
                      title="Mark question for review"
                    >
                      {markedQuestions.has(question._id) ? "Marked" : "Mark"}
                    </button>
                    <button
                      onClick={toggleEditorFullscreen}
                      className="p-1.5 border border-line text-xs rounded-lg text-ink-secondary hover:text-ink hover:bg-card"
                    >
                      {editorFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                    </button>
                  </div>
                </div>

                {/* Monaco Editor Canvas */}
                <div className={`flex-1 relative ${editorFullscreen ? "fixed inset-0 z-50 bg-paper flex flex-col" : ""}`}>
                  {editorFullscreen && (
                    <div className="flex justify-between items-center px-4 py-2 border-b border-line bg-surface">
                      <span className="text-xs font-mono font-semibold">
                        {settings.enableFullScreen ? "Code Editor" : "Monaco Editor"} [Fullscreen] - {language.toUpperCase()}
                      </span>
                      <Button variant="secondary" onClick={toggleEditorFullscreen} className="px-3 py-1 text-xs">Exit Fullscreen</Button>
                    </div>
                  )}
                  <Editor
                    height="100%"
                    language={MONACO_LANG_MAP[language] || "plaintext"}
                    value={code}
                    onChange={(val) => {
                      setCode(val ?? "");
                      saveLocalBackup(val ?? "", null, []);
                    }}
                    onMount={handleEditorMount}
                    theme={editorTheme}
                    options={{
                      fontSize: editorFontSize,
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      wordWrap: wordWrap,
                      automaticLayout: true,
                      readOnly: isQuestionTimeExpired,
                    }}
                  />
                </div>

                {/* Interactive Console Console */}
                <div className="h-60 border-t border-line flex flex-col overflow-hidden bg-paper shrink-0">
                  
                  {/* Console Tabs */}
                  <div className="flex items-center justify-between border-b border-line bg-card px-4 shrink-0">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setConsoleTab("testcases")}
                        className={`px-3 py-2 text-xs font-semibold border-b-2 ${
                          consoleTab === "testcases" ? "border-accent text-accent" : "border-transparent text-ink-secondary hover:text-ink"
                        }`}
                      >
                        Sample Cases
                      </button>
                      <button
                        onClick={() => setConsoleTab("output")}
                        className={`px-3 py-2 text-xs font-semibold border-b-2 ${
                          consoleTab === "output" ? "border-accent text-accent" : "border-transparent text-ink-secondary hover:text-ink"
                        }`}
                      >
                        Run Outcomes
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      {settings.allowCustomInput && (
                        <label className="flex items-center gap-2 text-[10px] font-mono text-ink-secondary cursor-pointer">
                          <input
                            type="checkbox"
                            checked={enableCustomInput}
                            onChange={(e) => setEnableCustomInput(e.target.checked)}
                            className="rounded accent-accent"
                          />
                          <span>Custom Stdin</span>
                        </label>
                      )}

                      <div className="flex gap-2 py-1">
                        {settings.allowRunCode && (
                          <button
                            onClick={handleRunCode}
                            disabled={running || isQuestionTimeExpired}
                            className="bg-card text-ink border border-line px-3 py-1 rounded-lg text-xs font-semibold hover:bg-line/25 disabled:opacity-50 cursor-pointer transition-colors"
                          >
                            {running ? "Running..." : "Run Code"}
                          </button>
                        )}
                        {settings.singleQuestionMode ? (
                          <Button
                            onClick={() => {
                              submitAnswerDraft(false);
                              setCurrentQuestionOpen(false);
                            }}
                            disabled={submitting}
                            className="px-3 py-1 text-xs cursor-pointer font-semibold"
                          >
                            {submitting ? "Saving..." : "Save & Back to List"}
                          </Button>
                        ) : (
                          <>
                            {isQuestionTimeExpired ? (
                              <Button onClick={handleNextQuestion} className="px-3 py-1 text-xs">
                                {questionIndex + 1 === totalQuestions ? "Review Exam" : "Next Question"}
                              </Button>
                            ) : (
                              <Button onClick={() => submitAnswerDraft(true)} disabled={submitting} className="px-3 py-1 text-xs">
                                {submitting ? "Saving..." : questionIndex + 1 === totalQuestions ? "Submit & Review" : "Save & Next"}
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Console Tab Content */}
                  <div className="flex-1 overflow-y-auto p-4 font-mono text-xs text-ink/80">
                    {consoleTab === "testcases" ? (
                      <div className="flex flex-col gap-3">
                        {enableCustomInput ? (
                          <div className="flex flex-col gap-2">
                            <span className="text-[10px] uppercase font-bold text-ink-secondary/70">Provide Standard Input (stdin):</span>
                            <textarea
                              value={customInput}
                              onChange={(e) => setCustomInput(e.target.value)}
                              rows={4}
                              className="w-full bg-surface border border-line rounded-lg p-2 font-mono text-xs text-ink focus:outline-none focus:border-accent"
                              placeholder="e.g. 5\n10 20 30"
                            />
                          </div>
                        ) : (
                          <div>
                            <p className="text-ink-secondary text-[10px] uppercase font-bold mb-2">Executing against these test cases:</p>
                            {question.sampleTestCases?.map((tc, idx) => (
                              <div key={idx} className="border-l-2 border-accent pl-3 py-1.5 mb-2 bg-surface/45 rounded-r-lg">
                                <span className="font-semibold text-accent text-[10px]">Test Case {idx + 1}:</span>
                                <p className="truncate text-ink-secondary">In: {tc.input || "(empty)"} ➜ Out: {tc.expectedOutput}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      // Run outcomes output console
                      <div className="flex flex-col h-full">
                        {running ? (
                          <div className="flex flex-col items-center justify-center py-10 gap-3 text-ink-secondary">
                            <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-xs tracking-wider uppercase font-semibold animate-pulse text-accent">Running code against compiler...</p>
                          </div>
                        ) : runResults ? (
                          runResults.length === 0 ? (
                            <p className="text-ink-secondary/80 text-center py-10 font-bold uppercase tracking-wider text-[10px]">No test cases run.</p>
                          ) : runResults[0].error ? (
                            // Service down or offline error
                            <div className="p-4 bg-danger-soft/10 border border-danger/30 rounded-xl text-danger flex flex-col gap-2">
                              <div className="flex items-center gap-2 font-bold text-sm">
                                <span>⚠️</span>
                                <span>Execution Service Unavailable</span>
                              </div>
                              <p className="text-xs text-ink/80 leading-relaxed font-sans">
                                {runResults[0].error}
                              </p>
                              <p className="text-[10px] text-ink-secondary/80 font-mono">
                                Check that the self-hosted Judge0 CE containers are running on Docker port 2358.
                              </p>
                            </div>
                          ) : (
                            <div className="flex flex-col md:flex-row gap-4 h-full min-h-[160px]">
                              {/* Test Case Tabs Side Panel */}
                              <div className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-y-auto shrink-0 md:w-36 border-b md:border-b-0 md:border-r border-line pb-2 md:pb-0 md:pr-2">
                                {runResults.map((r, idx) => {
                                  const isCustom = enableCustomInput;
                                  const label = isCustom ? "Custom Case" : `Case ${idx + 1}`;
                                  const isSelected = selectedTestCaseIdx === idx;
                                  return (
                                    <button
                                      key={idx}
                                      onClick={() => setSelectedTestCaseIdx(idx)}
                                      className={`px-3 py-1.5 rounded-lg text-left text-xs font-semibold font-mono transition-all duration-150 whitespace-nowrap cursor-pointer flex items-center justify-between gap-2 ${
                                        isSelected
                                          ? "bg-accent/20 text-accent border border-accent/40"
                                          : "text-ink-secondary hover:bg-line/25 hover:text-ink border border-transparent"
                                      }`}
                                    >
                                      <span>{label}</span>
                                      <span className={r.passed ? "text-success font-bold" : "text-danger font-bold"}>
                                        {r.passed ? "✓" : "✗"}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Selected Test Case Details Panel */}
                              {runResults[selectedTestCaseIdx] && (() => {
                                const r = runResults[selectedTestCaseIdx];
                                const statusColor = r.passed ? "text-success bg-success-soft/20 border-success/30" : "text-danger bg-danger-soft/20 border-danger/30";
                                const statusText = r.status?.description || (r.passed ? "Accepted" : "Failed");
                                
                                return (
                                  <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-1">
                                    {/* Status & Execution Details Header */}
                                    <div className="flex flex-wrap items-center justify-between gap-2 bg-card p-3 rounded-lg border border-line">
                                      <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-ink-secondary uppercase font-bold">Status:</span>
                                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${statusColor}`}>
                                          {statusText}
                                        </span>
                                      </div>
                                      
                                      <div className="flex items-center gap-4 text-[11px] text-ink-secondary font-mono">
                                        {r.time !== undefined && (
                                          <div>
                                            <span className="text-ink-secondary">Time:</span> <span className="text-ink font-semibold">{Math.round(r.time * 1000)} ms</span>
                                          </div>
                                        )}
                                        {r.memory !== undefined && (
                                          <div>
                                            <span className="text-ink-secondary">Memory:</span> <span className="text-ink font-semibold">{(r.memory / 1024).toFixed(2)} MB</span>
                                          </div>
                                        )}
                                        {r.exit_code !== undefined && r.exit_code !== null && (
                                          <div>
                                            <span className="text-ink-secondary">Exit Code:</span> <span className="text-ink font-semibold">{r.exit_code}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Compile Errors */}
                                    {r.compileOutput && (
                                      <div className="flex flex-col gap-1">
                                        <span className="text-[10px] uppercase font-bold text-danger">Compiler Errors:</span>
                                        <pre className="text-red-400 bg-red-950/20 p-3 rounded-lg border border-red-900/30 overflow-x-auto whitespace-pre-wrap font-mono text-xs">
                                          {r.compileOutput}
                                        </pre>
                                      </div>
                                    )}

                                    {/* Runtime Errors */}
                                    {r.stderr && (
                                      <div className="flex flex-col gap-1">
                                        <span className="text-[10px] uppercase font-bold text-danger">Runtime Errors:</span>
                                        <pre className="text-red-400 bg-red-950/20 p-3 rounded-lg border border-red-900/30 overflow-x-auto whitespace-pre-wrap font-mono text-xs">
                                          {r.stderr}
                                        </pre>
                                      </div>
                                    )}

                                    {/* Test Case Inputs / Outputs */}
                                    {!r.compileOutput && (
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {/* Input */}
                                        {r.input !== undefined && (
                                          <div className="flex flex-col gap-1">
                                            <span className="text-[10px] uppercase font-bold text-ink-secondary">Stdin:</span>
                                            <pre className="bg-surface p-2.5 rounded-lg border border-line font-mono text-xs text-ink/85 overflow-x-auto min-h-[40px] max-h-[120px]">
                                              {r.input || "(empty)"}
                                            </pre>
                                          </div>
                                        )}

                                        {/* Expected Output */}
                                        {r.expectedOutput !== undefined && !enableCustomInput && (
                                          <div className="flex flex-col gap-1">
                                            <span className="text-[10px] uppercase font-bold text-ink-secondary">Expected Output:</span>
                                            <pre className="bg-surface p-2.5 rounded-lg border border-line font-mono text-xs text-ink/85 overflow-x-auto min-h-[40px] max-h-[120px]">
                                              {r.expectedOutput}
                                            </pre>
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    {/* Your Output */}
                                    {!r.compileOutput && r.stdout !== undefined && (
                                      <div className="flex flex-col gap-1">
                                        <span className="text-[10px] uppercase font-bold text-ink-secondary">Your Output:</span>
                                        <pre className="bg-surface p-3 rounded-lg border border-line font-mono text-xs text-ink/85 overflow-x-auto min-h-[50px] max-h-[200px] whitespace-pre-wrap">
                                          {r.stdout || "(empty stdout)"}
                                        </pre>
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                          )
                        ) : (
                          <p className="text-gray-500 text-center py-10 font-bold uppercase tracking-wider text-[10px]">No code execution results run yet.</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
      )}

      {/* Security alert toast — auto-dismisses, no acknowledgment required */}
      {securityModalMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-lg w-full mx-4 animate-in slide-in-from-top duration-300">
          <div className="bg-surface border border-danger/40 rounded-xl px-5 py-4 shadow-xl flex items-start gap-3">
            <span className="text-danger shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-ink mb-0.5">Security Notice</p>
              <p className="text-xs text-ink-secondary leading-relaxed">{securityModalMsg}</p>
            </div>
            <button
              type="button"
              onClick={() => setSecurityModalMsg("")}
              className="text-ink-secondary hover:text-ink text-xs cursor-pointer shrink-0"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Fullscreen Recovery Alert Modal */}
      {showFullscreenWarning && settings.enableFullScreen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-6 text-center select-none">
          <div className="max-w-md w-full bg-surface border border-line rounded-2xl p-8 shadow-2xl">
            <h3 className="text-xl font-bold text-danger mb-3">Fullscreen Mode Deactivated</h3>
            <p className="text-sm text-ink-secondary leading-relaxed mb-6">
              This exam has strict anti-cheating configurations. You are required to stay in fullscreen mode for the entire duration of this assessment. Exiting fullscreen mode triggers a security alert event logged on the organizer's panel.
            </p>
            <Button onClick={requestFullscreenMode} className="w-full py-3 font-bold">
              Return to Full Screen & Resume
            </Button>
          </div>
        </div>
      )}

      {/* Review & Submit Final Exam Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-[#000000bd] backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-surface border border-line rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-ink mb-4">Final Submission Summary Review</h3>
            
            <div className="grid grid-cols-2 gap-3 mb-6 font-mono text-xs">
              <div className="p-3 bg-card border border-line rounded-xl">
                <span className="text-ink-secondary block">Total Questions</span>
                <span className="text-lg font-bold text-ink">{totalQuestions}</span>
              </div>
              <div className="p-3 bg-success-soft/20 border border-success/30 rounded-xl text-success">
                <span className="block">Answered Questions</span>
                <span className="text-lg font-bold">{answeredCount}</span>
              </div>
              <div className="p-3 bg-warning-soft/20 border border-warning/30 rounded-xl text-warning">
                <span className="block">Marked For Review</span>
                <span className="text-lg font-bold">{markedQuestions.size}</span>
              </div>
              <div className="p-3 bg-card border border-line rounded-xl">
                <span className="text-ink-secondary block">Remaining Unvisited</span>
                <span className="text-lg font-bold text-ink">{remainingCount}</span>
              </div>
            </div>

            {warnings > 0 && (
              <div className="mb-6 p-3 bg-danger-soft/20 border border-danger/30 rounded-xl text-danger text-xs flex items-center gap-2">
                <span>Note: You have accumulated {warnings} violations during this test. Exceeding limits will auto-submit.</span>
              </div>
            )}

            <p className="text-sm text-ink-secondary leading-relaxed mb-6">
              Are you sure you want to submit your final exam answers? Once submitted, your scores will be locked and compiled, and you will not be able to modify any responses or coding blocks.
            </p>

            {submitError && (
              <p className="text-sm font-semibold text-danger mb-4">Submission Error: {submitError}</p>
            )}

            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowReviewModal(false)}
                className="flex-1 py-2.5 font-bold"
              >
                Back to Exam
              </Button>
              <Button
                onClick={finishExam}
                className="flex-1 py-2.5 font-bold"
              >
                Submit Final Exam
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
