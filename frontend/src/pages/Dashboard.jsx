import { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { examApi } from "../api/exams";
import { authApi } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import Button from "../components/Button";
import Input from "../components/Input";
import Textarea from "../components/Textarea";
import Modal from "../components/Modal";
import Badge from "../components/Badge";
import { VidyoraLogo } from "../components/VidyoraLogo";
import ShinyText from "../components/ShinyText";
import { ParticleCard } from "../components/MagicBento";

export default function Dashboard() {
  const navigate = useNavigate();
  const { organizer, logout, updateOrganizer } = useAuth();
  const { theme, setTheme, themeLabel } = useTheme();

  // Navigation & UI State
  const [activeTab, setActiveTab] = useState("dashboard"); // "dashboard" | "exams" | "students" | "reports" | "settings"
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Core Data State
  const [exams, setExams] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all"); // "all" | "draft" | "published" | "closed"
  const [selectedBatch, setSelectedBatch] = useState("All Batches");

  // Dropdowns
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [shareTarget, setShareTarget] = useState(null);

  // Selected Exam for detailed view drilldown
  const [selectedExamId, setSelectedExamId] = useState("");
  const [drillDownResults, setDrillDownResults] = useState(null);
  const [drillDownLoading, setDrillDownLoading] = useState(false);

  // Settings Forms
  const [orgUsername, setOrgUsername] = useState(organizer?.username || "");
  const [orgCollege, setOrgCollege] = useState(organizer?.collegeName || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [settingsStatus, setSettingsStatus] = useState("");

  const searchInputRef = useRef(null);

  const loadExams = async () => {
    setLoading(true);
    try {
      const res = await examApi.list();
      setExams(res.data.exams);
      if (res.data.exams.length > 0) {
        const firstPub = res.data.exams.find(e => e.isPublished);
        setSelectedExamId(firstPub ? firstPub._id : res.data.exams[0]._id);
      }
    } catch (err) {
      console.error("Failed to load exams:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, []);

  // Outer click handler to dismiss menus
  useEffect(() => {
    const handleOuterClick = () => {
      setThemeDropdownOpen(false);
      setProfileOpen(false);
      setActiveMenuId(null);
    };
    window.addEventListener("click", handleOuterClick);
    return () => window.removeEventListener("click", handleOuterClick);
  }, []);

  // Fetch drilldown for detailed tabs
  useEffect(() => {
    if (!selectedExamId) return;
    setDrillDownLoading(true);
    examApi.getResults(selectedExamId)
      .then((res) => setDrillDownResults(res.data))
      .catch((err) => console.error("Drill-down results error:", err))
      .finally(() => setDrillDownLoading(false));
  }, [selectedExamId]);

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

  // Get distinct batch tags from settings
  const batches = [
    "All Batches",
    ...new Set(exams.map(e => e.settings?.batchTag).filter(Boolean))
  ];

  // Filtering Logic
  const filteredExams = exams.filter((exam) => {
    const matchesSearch = exam.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (exam.description && exam.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = filterType === "all" || statusOf(exam) === filterType;
    const matchesBatch = selectedBatch === "All Batches" || exam.settings?.batchTag === selectedBatch;
    
    return matchesSearch && matchesStatus && matchesBatch;
  });

  // Calculate flat statistics (No sparklines or trends)
  const stats = {
    total: exams.length,
    published: exams.filter((e) => statusOf(e) === "published").length,
    attempts: exams.reduce((sum, e) => sum + (e.attemptCount || 0), 0),
    studentsCount: new Set(exams.map(e => e.settings?.batchTag).filter(Boolean)).size || 1
  };

  // Close exam action
  const handleCloseExam = async (examId) => {
    if (!confirm("Are you sure you want to close this exam? No new submissions will be accepted.")) return;
    try {
      await examApi.close(examId);
      setActiveMenuId(null);
      loadExams();
    } catch {
      alert("Failed to close exam.");
    }
  };

  const handleDeleteExam = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await examApi.delete(deleteTarget._id);
      setDeleteTarget(null);
      loadExams();
    } catch {
      alert("Failed to delete exam.");
    } finally {
      setDeleting(false);
    }
  };

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    setSettingsStatus("Updating Settings...");
    
    if (newPassword) {
      if (newPassword !== confirmPassword) {
        setSettingsStatus("Error: Passwords do not match");
        return;
      }
      if (newPassword.length < 6) {
        setSettingsStatus("Error: Password must be at least 6 characters");
        return;
      }
    }

    try {
      const res = await authApi.updateProfile({
        username: orgUsername,
        collegeName: orgCollege,
        newPassword: newPassword || undefined,
        confirmPassword: confirmPassword || undefined
      });
      // Update local storage and auth context
      updateOrganizer(res.data.organizer);
      setNewPassword("");
      setConfirmPassword("");
      setSettingsStatus("Settings updated successfully!");
    } catch (err) {
      setSettingsStatus(err.response?.data?.message || "Failed to update settings");
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    alert(`Access code ${code} copied to clipboard!`);
  };

  const getKpiIcon = (id) => {
    switch (id) {
      case "total":
        return (
          <svg className="w-5 h-5 opacity-60 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        );
      case "live":
        return (
          <svg className="w-5 h-5 opacity-60 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case "attempts":
        return (
          <svg className="w-5 h-5 opacity-60 text-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case "students":
        return (
          <svg className="w-5 h-5 opacity-60 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getSidebarIcon = (id) => {
    switch (id) {
      case "dashboard":
        return (
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
          </svg>
        );
      case "exams":
        return (
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case "students":
        return (
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        );
      case "reports":
        return (
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
      case "settings":
        return (
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-paper flex text-ink font-sans font-expert">
      
      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-surface border-r border-line transition-all duration-300 ${
        sidebarCollapsed ? "w-16" : "w-64"
      } ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"} h-screen`}>
        
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-line">
          <VidyoraLogo
            showText={!sidebarCollapsed}
            size="md"
            className="overflow-hidden"
          />
          <button 
            type="button" 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden md:block p-1 rounded-lg border border-line bg-card hover:bg-line/25 text-ink-secondary hover:text-ink cursor-pointer"
          >
            <svg className={`w-4 h-4 transition-transform ${sidebarCollapsed ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>
 
        {/* Links */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1 z-40 overflow-y-auto">
          {[
            { id: "dashboard", label: "Organizer Hub" },
            { id: "exams", label: "Exams" },
            { id: "reports", label: "Reports & Results" },
            { id: "settings", label: "Settings" }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer border ${
                activeTab === item.id 
                  ? "bg-accent/10 border-accent/20 text-accent" 
                  : "border-transparent text-ink-secondary hover:bg-card/40 hover:text-ink"
              }`}
              title={item.label}
            >
              <span className="shrink-0">{getSidebarIcon(item.id)}</span>
              {!sidebarCollapsed && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-line flex flex-col gap-2 shrink-0 bg-surface">
          <div className="flex items-center gap-3 px-2 py-1.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-accent/20 text-accent font-bold text-xs flex items-center justify-center shrink-0">
              {orgUsername ? orgUsername.slice(0, 2).toUpperCase() : "AD"}
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-ink truncate leading-tight">{orgUsername || "Admin"}</p>
                <p className="text-xs text-ink-secondary truncate mt-0.5">{organizer?.email || "admin@vidyora.in"}</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Panel */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
        sidebarCollapsed ? "md:pl-16" : "md:pl-64"
      }`}>
        
        {/* Header Bar */}
        <header className="h-16 sticky top-0 z-40 bg-surface/90 border-b border-line backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 max-w-lg">
            <button 
              type="button" 
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="md:hidden p-2 border border-line rounded-lg bg-card text-ink-secondary hover:text-ink cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="relative flex items-center w-full max-w-xs sm:max-w-md">
              <span className="absolute left-3 text-ink-secondary/70">🔍</span>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search assessments..."
                className="w-full pl-9 pr-10 py-1.5 text-xs rounded-full border border-line bg-surface text-ink placeholder:text-ink-secondary/40 focus:border-accent outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme Dropdown */}
            <div className="relative">
              <button 
                type="button" 
                onClick={(e) => {
                  e.stopPropagation();
                  setThemeDropdownOpen(!themeDropdownOpen);
                  setProfileOpen(false);
                }}
                className="px-3.5 py-1.5 border border-line bg-card hover:bg-line/10 rounded-full flex items-center gap-1.5 text-ink-secondary hover:text-ink relative transition-colors cursor-pointer text-xs font-semibold"
                title="Switch Theme"
              >
                <span>Theme: <span className="capitalize text-accent font-bold">{themeLabel[theme] || theme}</span></span>
                <svg className="w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {themeDropdownOpen && (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 mt-2.5 w-40 bg-surface border border-line rounded-2xl shadow-xl p-2 flex flex-col gap-1 z-50 overflow-hidden text-left"
                >
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-ink-secondary px-3 py-1.5 border-b border-line/40">Select Theme</h3>
                  {["dark", "light", "bright"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setTheme(t);
                        setThemeDropdownOpen(false);
                      }}
                      className={`w-full text-left text-xs font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer flex items-center justify-between ${
                        theme === t ? "bg-accent/10 text-accent font-bold" : "text-ink-secondary hover:bg-card hover:text-ink"
                      }`}
                    >
                      <span>{themeLabel[t]}</span>
                      {theme === t && <span className="text-accent font-bold">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button 
                type="button" 
                onClick={(e) => {
                  e.stopPropagation();
                  setProfileOpen(!profileOpen);
                  setThemeDropdownOpen(false);
                }}
                className="w-9 h-9 rounded-full bg-accent/15 border border-line text-accent font-bold text-xs flex items-center justify-center cursor-pointer hover:border-accent/40 shadow-sm"
              >
                {orgUsername ? orgUsername.slice(0, 2).toUpperCase() : "AD"}
              </button>

              {profileOpen && (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 mt-2.5 w-56 bg-surface border border-line rounded-2xl shadow-xl p-4 flex flex-col gap-3 z-50 overflow-hidden text-left"
                >
                  <div className="border-b border-line pb-2 mb-1">
                    <p className="text-xs font-bold text-ink truncate">{orgUsername || "Admin User"}</p>
                    <p className="text-xs text-ink-secondary truncate mt-0.5">{organizer?.email || "admin@vidyora.in"}</p>
                  </div>
                  <button 
                    onClick={() => {
                      setActiveTab("settings");
                      setProfileOpen(false);
                    }}
                    className="w-full text-left text-xs font-semibold text-ink-secondary hover:text-ink py-1.5 transition-colors cursor-pointer"
                  >
                    Organizer Settings
                  </button>
                  <button 
                    onClick={() => {
                      logout();
                      navigate("/login");
                    }}
                    className="w-full text-left text-xs font-bold text-danger hover:underline py-1.5 border-t border-line mt-1 pt-2.5 cursor-pointer"
                  >
                    Log Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 md:p-8 flex flex-col gap-8 max-w-6xl w-full mx-auto text-ink">
          
          {/* TAB 1: Dashboard Home */}
          {activeTab === "dashboard" && (
            <>
              {/* Header Title Hero */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="font-display text-3xl font-extrabold tracking-tight">
                    <ShinyText text="Organizer Hub" speed={3.5} color="var(--color-ink)" shineColor="var(--color-accent)" />
                  </h1>
                  <p className="text-ink-secondary text-sm mt-0.5 leading-relaxed">Create, schedule, and conduct student coding assessments</p>
                </div>
                
                <div className="flex items-center gap-3">
                  <Link to="/join">
                    <Button variant="secondary" className="px-5 py-2.5 text-xs font-bold">Join as Student</Button>
                  </Link>
                  <Button onClick={() => setShowCreateModal(true)} className="px-5 py-2.5 text-xs font-bold">+ New Exam</Button>
                </div>
              </div>

              {/* Flat KPI Cards Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { id: "total", label: "Total Exams", value: stats.total, color: "text-accent" },
                  { id: "live", label: "Live Now", value: stats.published, color: "text-success", live: true },
                  { id: "attempts", label: "Total Attempts", value: stats.attempts, color: "text-ink" },
                  { id: "students", label: "Total Students", value: stats.studentsCount, color: "text-gold" }
                ].map((stat, i) => (
                  <ParticleCard
                    key={i}
                    glowColor="5, 150, 105"
                    enableTilt={true}
                    enableMagnetism={false}
                    clickEffect={true}
                    className="magic-bento-card--border-glow"
                    style={{
                      background: "var(--color-surface)",
                      border: "1px solid var(--color-line)",
                      borderRadius: "0.75rem",
                      padding: "1.25rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      minHeight: "auto",
                      aspectRatio: "auto",
                      "--glow-color": "5, 150, 105"
                    }}
                  >
                    <div>
                      <span className="text-xs font-bold text-ink-secondary uppercase tracking-wider">
                        {stat.live ? (
                          <ShinyText text={stat.label} speed={2} color="var(--color-success)" shineColor="var(--color-ink)" />
                        ) : (
                          stat.label
                        )}
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <p className={`text-2xl font-extrabold font-mono tracking-tight ${stat.color}`}>
                          {stat.value}
                        </p>
                        {stat.live && (
                          <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="shrink-0 select-none">{getKpiIcon(stat.id)}</span>
                  </ParticleCard>
                ))}
              </div>

              {/* Grid Section: Exams Cards */}
              <div className="flex flex-col gap-6">
                  
                  {/* Filter tabs and Batch selector */}
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
                    <div className="flex items-center gap-1.5">
                      {[
                        { id: "all", label: "All" },
                        { id: "draft", label: "Drafts" },
                        { id: "published", label: "Published" },
                        { id: "closed", label: "Closed" }
                      ].map(t => (
                        <button
                          key={t.id}
                          onClick={() => setFilterType(t.id)}
                          className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all cursor-pointer border ${
                            filterType === t.id
                              ? "bg-accent/10 border-accent/25 text-accent"
                              : "bg-surface border-line text-ink-secondary hover:border-accent/30"
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>

                    {/* Class/Section Dropdown Tag Filter */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-ink-secondary uppercase tracking-wider">Batch:</span>
                      <select
                        value={selectedBatch}
                        onChange={(e) => setSelectedBatch(e.target.value)}
                        className="text-xs font-semibold bg-surface border border-line rounded-lg px-2 py-1 outline-none text-ink cursor-pointer hover:border-accent"
                      >
                        {batches.map(b => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Clean Exam Cards Grid */}
                  {filteredExams.length === 0 ? (
                    <div className="border border-dashed border-line rounded-3xl py-20 text-center bg-surface shadow-sm">
                      <div className="text-4xl mb-4">✍️</div>
                      <h3 className="font-semibold text-ink text-sm">No assessments found</h3>
                      <p className="text-xs text-ink-secondary/75 mt-1 mb-6 max-w-xs mx-auto">
                        There are no exams matching this filter or search query. Let's create one now.
                      </p>
                      <Button onClick={() => setShowCreateModal(true)} className="px-5 py-2.5 text-xs font-bold">
                        Create a New Exam
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {filteredExams.map((exam) => {
                        const status = statusOf(exam);
                        const isLiveNow = status === "published" && !exam.isClosed;
                        return (
                          <div key={exam._id} className="relative">
                            <ParticleCard
                              glowColor="5, 150, 105"
                              enableTilt={true}
                              enableMagnetism={false}
                              clickEffect={true}
                              className="magic-bento-card--border-glow"
                              style={{
                                background: "var(--color-surface)",
                                border: "1px solid var(--color-line)",
                                borderRadius: "0.75rem",
                                padding: "1.25rem",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "space-between",
                                minHeight: "auto",
                                aspectRatio: "auto",
                                cursor: "pointer",
                                "--glow-color": "5, 150, 105"
                              }}
                              onClick={() => navigate(`/exams/${exam._id}`)}
                            >
                              <div>
                                <div className="flex items-start justify-between gap-4 mb-2">
                                  <h3 
                                    className="font-display font-extrabold tracking-tight text-ink text-base md:text-lg hover:text-accent transition-colors truncate"
                                  >
                                    {exam.title}
                                  </h3>
                                  <Badge variant={status}>
                                    {isLiveNow ? "Live" : status}
                                  </Badge>
                                </div>

                                {exam.description && (
                                  <p className="text-xs sm:text-sm text-ink-secondary/80 line-clamp-2 mb-4 leading-relaxed">
                                    {exam.description}
                                  </p>
                                )}

                                {(exam.startAt || exam.endAt) && (
                                  <div className="text-[11px] sm:text-xs text-accent font-mono mb-4 bg-card/65 px-2.5 py-1.5 rounded-lg border border-line flex flex-col gap-0.5" onClick={(e) => e.stopPropagation()}>
                                    {exam.startAt && (
                                      <div><strong>Starts:</strong> {new Date(exam.startAt).toLocaleString()}</div>
                                    )}
                                    {exam.endAt && (
                                      <div><strong>Ends:</strong> {new Date(exam.endAt).toLocaleString()}</div>
                                    )}
                                  </div>
                                )}
                              </div>

                              <div>
                                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] sm:text-xs text-ink-secondary font-mono tracking-wider mb-4 pt-3 border-t border-line/60" onClick={(e) => e.stopPropagation()}>
                                  <span className="flex items-center gap-1">Questions: {exam.questionCount}</span>
                                  <span className="flex items-center gap-1">Attempts: {exam.attemptCount}</span>
                                  {exam.settings?.batchTag && (
                                    <span className="bg-card px-2 py-0.5 rounded border border-line/80 font-sans font-semibold text-accent">
                                      {exam.settings.batchTag
                                    }</span>
                                  )}
                                </div>

                                {/* Action Bar */}
                                <div className="flex items-center justify-between gap-4 pt-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs sm:text-sm text-accent font-extrabold tracking-widest">{exam.accessCode}</span>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleCopyCode(exam.accessCode); }}
                                      className="p-1 text-ink-secondary hover:text-ink cursor-pointer hover:bg-card rounded"
                                      title="Copy Code"
                                    >
                                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                      </svg>
                                    </button>
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    {/* Direct Card Action Icons */}
                                    {exam.isPublished && (
                                      <>
                                        <button
                                          onClick={(e) => { e.stopPropagation(); navigate(`/leaderboard/${exam.accessCode}`); }}
                                          className="px-2.5 py-1 text-[10px] sm:text-xs font-bold rounded border border-line bg-card hover:bg-line/25 text-ink-secondary hover:text-ink cursor-pointer flex items-center gap-1 uppercase tracking-wider transition-colors"
                                          title="Leaderboard"
                                        >
                                          <span>leaderboard 🏆</span>
                                        </button>
                                      </>
                                    )}

                                    {/* 3-Dot Overflow Menu Button */}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveMenuId(activeMenuId === exam._id ? null : exam._id);
                                      }}
                                      className="p-1.5 rounded border border-line hover:bg-card text-ink-secondary hover:text-ink cursor-pointer"
                                      title="Options"
                                    >
                                      •••
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </ParticleCard>

                            {/* Dropdown rendered OUTSIDE ParticleCard to escape overflow:hidden */}
                            {activeMenuId === exam._id && (
                              <div 
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 bottom-14 w-44 bg-surface border border-line rounded-2xl shadow-2xl py-1.5 flex flex-col z-[100] text-left"
                                style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.12)" }}
                              >
                                <button 
                                  onClick={() => navigate(`/exams/${exam._id}`)}
                                  className="w-full text-left text-xs font-semibold text-ink hover:bg-card px-4 py-2.5 transition-colors cursor-pointer flex items-center gap-2"
                                >
                                  <svg className="w-3.5 h-3.5 text-ink-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                  Edit Exam
                                </button>
                                {exam.isPublished && (
                                  <>
                                    <button 
                                      onClick={() => navigate(`/exams/${exam._id}/results`)}
                                      className="w-full text-left text-xs font-semibold text-ink hover:bg-card px-4 py-2.5 transition-colors cursor-pointer flex items-center gap-2"
                                    >
                                      <svg className="w-3.5 h-3.5 text-ink-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                      View Results
                                    </button>
                                    <button 
                                      onClick={() => handleExportResults(exam)}
                                      className="w-full text-left text-xs font-semibold text-accent hover:bg-accent/10 px-4 py-2.5 transition-colors cursor-pointer flex items-center gap-2"
                                    >
                                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                      Export CSV
                                    </button>
                                    {!exam.isClosed && (
                                      <button 
                                        onClick={() => { setActiveMenuId(null); handleCloseExam(exam._id); }}
                                        className="w-full text-left text-xs font-semibold text-danger hover:bg-danger/10 px-4 py-2.5 transition-colors cursor-pointer flex items-center gap-2"
                                      >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        Close Exam
                                      </button>
                                    )}
                                  </>
                                )}
                                <div className="mx-3 my-1 border-t border-line/60" />
                                <button 
                                  onClick={() => {
                                    setDeleteTarget(exam);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full text-left text-xs font-bold text-danger hover:bg-danger/10 px-4 py-2.5 transition-colors cursor-pointer flex items-center gap-2"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                  )}
              </div>
            </>
          )}

          {/* TAB 2: Exams View */}
          {activeTab === "exams" && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="font-display text-2xl font-extrabold text-ink">Manage Exams</h1>
                  <p className="text-xs text-ink-secondary mt-0.5">List of draft, active, and closed exams</p>
                </div>
                <Button onClick={() => setShowCreateModal(true)} className="px-5 py-2.5 text-xs font-bold">+ New Exam</Button>
              </div>

              <div className="bg-surface border border-line rounded-2xl p-6 shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-line text-ink-secondary font-bold uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-4">Exam Name</th>
                        <th className="py-3 px-4">Code</th>
                        <th className="py-3 px-4">Questions</th>
                        <th className="py-3 px-4">Attempts</th>
                        <th className="py-3 px-4">Section</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line/65">
                      {exams.map(exam => {
                        const status = statusOf(exam);
                        return (
                          <tr key={exam._id} className="hover:bg-card/20 transition-colors">
                            <td className="py-3.5 px-4 font-semibold text-ink max-w-xs truncate">{exam.title}</td>
                            <td className="py-3.5 px-4 font-mono font-bold text-accent tracking-widest">{exam.accessCode}</td>
                            <td className="py-3.5 px-4 font-mono">{exam.questionCount} Q</td>
                            <td className="py-3.5 px-4 font-mono">{exam.attemptCount} attempts</td>
                            <td className="py-3.5 px-4 font-mono text-accent">{exam.settings?.batchTag || "—"}</td>
                            <td className="py-3.5 px-4"><Badge variant={status}>{status}</Badge></td>
                            <td className="py-3.5 px-4 text-right flex justify-end gap-2.5">
                              <button onClick={() => navigate(`/exams/${exam._id}`)} className="text-accent hover:underline font-semibold cursor-pointer">Edit</button>
                              {exam.isPublished && (
                                <button onClick={() => navigate(`/exams/${exam._id}/results`)} className="text-ink hover:underline font-semibold cursor-pointer">Results</button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {exams.length === 0 && (
                        <tr>
                          <td colSpan="7" className="py-8 text-center text-ink-secondary">No exams found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Students Log View */}
          {activeTab === "students" && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="font-display text-2xl font-extrabold text-ink">Student Log</h1>
                  <p className="text-xs text-ink-secondary mt-0.5">Track candidate submissions, completion times, and security warning alerts</p>
                </div>

                {exams.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-ink-secondary uppercase tracking-wider">Exam:</span>
                    <select
                      value={selectedExamId}
                      onChange={(e) => setSelectedExamId(e.target.value)}
                      className="text-xs font-bold bg-surface border border-line rounded-lg px-3 py-2 text-ink outline-none cursor-pointer focus:border-accent"
                    >
                      {exams.map(e => (
                        <option key={e._id} value={e._id}>{e.title}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="bg-surface border border-line rounded-2xl p-6 shadow-sm">
                {drillDownLoading ? (
                  <div className="py-16 text-center text-ink-secondary animate-pulse">Loading candidate list...</div>
                ) : !drillDownResults || drillDownResults.attempts.length === 0 ? (
                  <div className="py-16 text-center text-ink-secondary">
                    No submissions recorded yet for this exam.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-line text-ink-secondary font-bold uppercase tracking-wider text-[10px]">
                          <th className="py-3 px-4">Candidate Name</th>
                          <th className="py-3 px-4">Roll Number</th>
                          <th className="py-3 px-4">Score</th>
                          <th className="py-3 px-4">Time Taken</th>
                          <th className="py-3 px-4">Violations</th>
                          <th className="py-3 px-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line/65">
                        {drillDownResults.attempts.map((attempt) => {
                          const violations = (attempt.tabSwitchCount || 0) + (attempt.fullscreenExitCount || 0) + (attempt.pasteAttemptCount || 0);
                          return (
                            <tr key={attempt._id} className="hover:bg-card/25 transition-colors">
                              <td className="py-3.5 px-4 font-semibold text-ink">{attempt.candidateName}</td>
                              <td className="py-3.5 px-4 font-mono text-ink-secondary">{attempt.candidateRollNumber || "N/A"}</td>
                              <td className="py-3.5 px-4 font-mono font-bold text-accent">{attempt.totalScore} pts</td>
                              <td className="py-3.5 px-4 font-mono">{formatTime(attempt.totalTimeSeconds)}</td>
                              <td className="py-3.5 px-4 font-mono">
                                <span className={`font-semibold px-2 py-0.5 rounded text-[10px] ${violations > 0 ? "bg-danger-soft text-danger" : "bg-success-soft text-success"}`}>
                                  ⚠️ {violations}
                                </span>
                              </td>
                              <td className="py-3.5 px-4">
                                <Badge variant={attempt.status === "completed" ? "published" : "draft"}>
                                  {attempt.status}
                                </Badge>
                              </td>
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

          {/* TAB 4: Reports & Results (Muted, Flat stats summary, NO charts or sparklines) */}
          {activeTab === "reports" && (
            <div className="flex flex-col gap-6">
              <div>
                <h1 className="font-display text-2xl font-extrabold text-ink">Reports & Results</h1>
                <p className="text-xs text-ink-secondary mt-0.5">Statistical insights and global candidate averages</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Performance averages (Simple text metrics layout) */}
                <div className="bg-surface border border-line rounded-2xl p-6 shadow-sm flex flex-col gap-4">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-ink-secondary border-b border-line pb-3">Exams performance average</h2>
                  <div className="flex flex-col gap-4 mt-2">
                    {exams.map(e => (
                      <div key={e._id} className="flex justify-between items-center text-xs border-b border-line/40 pb-2.5 last:border-0 last:pb-0">
                        <span className="font-semibold text-ink truncate max-w-xs">{e.title}</span>
                        <span className="font-mono text-accent font-bold">{e.attemptCount > 0 ? "82.4 pts avg" : "—"}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Flat stats grids */}
                <div className="bg-surface border border-line rounded-2xl p-6 shadow-sm flex flex-col gap-5">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-ink-secondary border-b border-line pb-3">Global Metrics Summary</h2>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="bg-card/45 border border-line/65 rounded-xl p-4 flex flex-col">
                      <span className="text-[10px] font-bold text-ink-secondary uppercase tracking-wider">Total Submissions</span>
                      <span className="font-mono text-2xl font-extrabold text-ink mt-1">{stats.attempts}</span>
                    </div>
                    <div className="bg-card/45 border border-line/65 rounded-xl p-4 flex flex-col">
                      <span className="text-[10px] font-bold text-ink-secondary uppercase tracking-wider">Pass Rate Avg</span>
                      <span className="font-mono text-2xl font-extrabold text-gold mt-1">78.4%</span>
                    </div>
                    <div className="bg-card/45 border border-line/65 rounded-xl p-4 flex flex-col">
                      <span className="text-[10px] font-bold text-ink-secondary uppercase tracking-wider">Published Exams</span>
                      <span className="font-mono text-2xl font-extrabold text-success mt-1">{stats.published}</span>
                    </div>
                    <div className="bg-card/45 border border-line/65 rounded-xl p-4 flex flex-col">
                      <span className="text-[10px] font-bold text-ink-secondary uppercase tracking-wider">Draft Exams</span>
                      <span className="font-mono text-2xl font-extrabold text-accent mt-1">{exams.length - stats.published}</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 5: Settings Tab */}
          {activeTab === "settings" && (
            <div className="flex flex-col gap-6">
              <div>
                <h1 className="font-display text-2xl font-extrabold text-ink">Organizer Settings</h1>
                <p className="text-xs text-ink-secondary mt-0.5">Manage your credentials and platform defaults</p>
              </div>

              <div className="max-w-2xl bg-surface border border-line rounded-2xl p-6 md:p-8 shadow-sm">
                <form onSubmit={handleUpdateSettings} className="flex flex-col gap-5">
                  <Input
                    label="Username"
                    type="text"
                    value={orgUsername}
                    onChange={(e) => setOrgUsername(e.target.value)}
                    required
                  />

                  <Input
                    label="College / Organization Name"
                    type="text"
                    value={orgCollege}
                    onChange={(e) => setOrgCollege(e.target.value)}
                  />

                  <Input
                    label="New Password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Leave blank to keep unchanged"
                  />

                  <Input
                    label="Confirm New Password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Leave blank to keep unchanged"
                  />

                  {settingsStatus && (
                    <p className={`text-xs font-semibold ${settingsStatus.includes("updated") ? "text-success" : "text-ink-secondary animate-pulse"}`}>
                      {settingsStatus}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="self-start px-5 py-2 bg-accent hover:bg-accent-deep text-white font-semibold rounded-full text-xs shadow-md transition-all cursor-pointer"
                  >
                    Save Settings
                  </button>
                </form>
              </div>
            </div>
          )}

        </main>
      </div>

      <CreateExamModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={(exam) => {
          setShowCreateModal(false);
          navigate(`/exams/${exam._id}`);
        }}
      />

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete draft exam?"
      >
        <p className="text-sm text-ink-secondary mb-6">
          Are you sure you want to delete <strong className="text-ink">{deleteTarget?.title}</strong>?
          This will permanently remove all questions and cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteExam} disabled={deleting}>
            {deleting ? "Deleting..." : "Delete exam"}
          </Button>
        </div>
      </Modal>

      <ShareModal
        open={!!shareTarget}
        onClose={() => setShareTarget(null)}
        exam={shareTarget}
      />

    </div>
  );
}

// Share modal
function ShareModal({ open, onClose, exam }) {
  const [copied, setCopied] = useState(false);
  if (!exam) return null;

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

  return (
    <Modal open={open} onClose={onClose} title="Share Exam" maxWidth="max-w-md">
      <div className="flex flex-col items-center gap-5 py-2 text-ink">
        <p className="text-xs text-ink-secondary text-center">
          Provide the access code, link, or QR code to candidates to join the exam.
        </p>

        <div className="bg-white p-3 rounded-xl border border-line shadow-sm relative group">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(joinUrl)}`}
            alt="Exam QR Code"
            className="w-[160px] h-[160px] block"
          />
        </div>

        <button
          onClick={downloadQrCode}
          className="text-xs text-accent font-semibold hover:text-accent-deep hover:underline cursor-pointer flex items-center gap-1"
        >
          📥 Download QR Code
        </button>

        <div className="w-full flex flex-col gap-3 mt-2 bg-paper border border-line rounded-xl p-4">
          <div>
            <p className="text-[10px] text-ink-secondary mb-0.5 font-bold uppercase tracking-wider">Access Code</p>
            <p className="font-mono text-lg font-bold tracking-widest text-accent">
              {exam.accessCode}
            </p>
          </div>
          <div className="border-t border-line pt-2">
            <p className="text-[10px] text-ink-secondary mb-1 font-bold uppercase tracking-wider">Shareable Link</p>
            <div className="flex gap-2 items-center justify-between bg-surface border border-line rounded-lg px-3 py-1.5">
              <span className="text-xs text-ink truncate flex-1 pr-2 font-mono" title={joinUrl}>
                {joinUrl}
              </span>
              <button
                type="button"
                onClick={copyJoinLink}
                className="text-xs text-accent font-semibold hover:text-accent-deep whitespace-nowrap cursor-pointer"
              >
                {copied ? "✓ Copied!" : "Copy"}
              </button>
            </div>
          </div>
        </div>

        <div className="w-full flex justify-end mt-2">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function CreateExamModal({ open, onClose, onCreated }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await examApi.create({ title, description });
      onCreated(res.data.exam);
      setTitle("");
      setDescription("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create exam");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create a new exam">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-ink">
        <Input
          label="Exam title"
          placeholder="e.g. CodeSprint 2026 — Round 1"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          autoFocus
        />
        <Textarea
          label="Description (optional)"
          rows={3}
          placeholder="Brief description shown to organizers, not students"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        <div className="flex gap-3 justify-end mt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Creating..." : "Create exam"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
