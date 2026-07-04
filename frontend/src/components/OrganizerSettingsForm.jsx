import { useState } from "react";
import Button from "./Button";
import Input from "./Input";

const parseDateString = (dateString) => {
  if (!dateString) return { date: "", hours: 12, minutes: 0, ampm: "AM" };
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return { date: "", hours: 12, minutes: 0, ampm: "AM" };
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const dateVal = String(d.getDate()).padStart(2, "0");
  const dateStr = `${year}-${month}-${dateVal}`;
  
  let hours = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 hour should be 12
  
  return { date: dateStr, hours, minutes, ampm };
};

const buildDateFromParts = (dateStr, hours, minutes, ampm) => {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split("-").map(Number);
  
  let h = Number(hours) || 0;
  const m = Number(minutes) || 0;
  
  if (ampm === "PM" && h < 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  
  const d = new Date(year, month - 1, day, h, m, 0);
  return d.toISOString();
};

export default function OrganizerSettingsForm({ initialSettings = {}, onSave, onCancel, submitting }) {
  const [activeTab, setActiveTab] = useState("general");

  const [startDate, setStartDate] = useState(() => parseDateString(initialSettings.startAt).date);
  const [startTimeHours, setStartTimeHours] = useState(() => parseDateString(initialSettings.startAt).hours);
  const [startTimeMinutes, setStartTimeMinutes] = useState(() => parseDateString(initialSettings.startAt).minutes);
  const [startTimeAmPm, setStartTimeAmPm] = useState(() => parseDateString(initialSettings.startAt).ampm);

  const [endDate, setEndDate] = useState(() => parseDateString(initialSettings.endAt).date);
  const [endTimeHours, setEndTimeHours] = useState(() => parseDateString(initialSettings.endAt).hours);
  const [endTimeMinutes, setEndTimeMinutes] = useState(() => parseDateString(initialSettings.endAt).minutes);
  const [endTimeAmPm, setEndTimeAmPm] = useState(() => parseDateString(initialSettings.endAt).ampm);

  const [settings, setSettings] = useState({
    // General
    duration: initialSettings.duration ?? 60,
    password: initialSettings.password ?? "",
    examVisibility: initialSettings.examVisibility ?? "public",
    registrationEnabled: initialSettings.registrationEnabled ?? true,
    singleQuestionMode: initialSettings.singleQuestionMode ?? false,
    enablePerQuestionTimer: initialSettings.enablePerQuestionTimer ?? false,
    questionListDisplayFormat: initialSettings.questionListDisplayFormat ?? "number_title_points",
    showTimerInQuestionList: initialSettings.showTimerInQuestionList ?? true,
    
    // UI & Question Settings
    showQuestionNumbers: initialSettings.showQuestionNumbers ?? true,
    showQuestionTitles: initialSettings.showQuestionTitles ?? true,
    showMarks: initialSettings.showMarks ?? true,
    showNegativeMarks: initialSettings.showNegativeMarks ?? true,
    showDifficulty: initialSettings.showDifficulty ?? true,
    showTopic: initialSettings.showTopic ?? true,
    showSampleExplanation: initialSettings.showSampleExplanation ?? true,
    showSampleTestCases: initialSettings.showSampleTestCases ?? true,
    allowPreviousQuestion: initialSettings.allowPreviousQuestion ?? true,
    allowNextQuestion: initialSettings.allowNextQuestion ?? true,
    sequentialNavigation: initialSettings.sequentialNavigation ?? false,
    randomNavigation: initialSettings.randomNavigation ?? true,
    shuffleMcqs: initialSettings.shuffleMcqs ?? false,
    shuffleOptions: initialSettings.shuffleOptions ?? false,
    lockQuestions: initialSettings.lockQuestions ?? false,
    allowQuestionReview: initialSettings.allowQuestionReview ?? true,

    // Coding Settings
    allowedLanguages: initialSettings.allowedLanguages ?? ["python", "java", "cpp", "c"],
    allowRunCode: initialSettings.allowRunCode ?? true,
    allowCustomInput: initialSettings.allowCustomInput ?? true,
    visibleTestCases: initialSettings.visibleTestCases ?? true,
    hiddenTestCases: initialSettings.hiddenTestCases ?? false,
    timeLimit: initialSettings.timeLimit ?? 5,
    memoryLimit: initialSettings.memoryLimit ?? 256,
    partialScoring: initialSettings.partialScoring ?? true,

    // Security Settings
    enableFullScreen: initialSettings.enableFullScreen ?? true,
    disableCopy: initialSettings.disableCopy ?? true,
    disablePaste: initialSettings.disablePaste ?? true,
    disableRightClick: initialSettings.disableRightClick ?? true,
    disableRefresh: initialSettings.disableRefresh ?? false,
    warningLimit: initialSettings.warningLimit ?? 3,
    autoSubmit: initialSettings.autoSubmit ?? true,

    // Result Settings
    showScoreImmediately: initialSettings.showScoreImmediately ?? true,
    hideScore: initialSettings.hideScore ?? false,
    showTestCases: initialSettings.showTestCases ?? true,
    hideTestCases: initialSettings.hideTestCases ?? false,
    showRank: initialSettings.showRank ?? true,
    hideRank: initialSettings.hideRank ?? false,
    showLeaderboard: initialSettings.showLeaderboard ?? true,
  });

  const handleChange = (key, value) => {
    setSettings((prev) => {
      const updated = { ...prev, [key]: value };
      
      // Keep navigation modes in sync
      if (key === "sequentialNavigation" && value === true) {
        updated.randomNavigation = false;
        updated.allowPreviousQuestion = false; // Sequential usually blocks going back
      } else if (key === "randomNavigation" && value === true) {
        updated.sequentialNavigation = false;
        updated.allowPreviousQuestion = true;
      }

      // Sync display format dropdown selection with individual boolean flags
      if (key === "questionListDisplayFormat") {
        if (value === "number") {
          updated.showQuestionNumbers = true;
          updated.showQuestionTitles = false;
          updated.showMarks = false;
        } else if (value === "title") {
          updated.showQuestionNumbers = false;
          updated.showQuestionTitles = true;
          updated.showMarks = false;
        } else if (value === "number_title") {
          updated.showQuestionNumbers = true;
          updated.showQuestionTitles = true;
          updated.showMarks = false;
        } else if (value === "number_title_points") {
          updated.showQuestionNumbers = true;
          updated.showQuestionTitles = true;
          updated.showMarks = true;
        }
      }
      return updated;
    });
  };

  const handleLanguageToggle = (lang) => {
    setSettings((prev) => {
      const langs = prev.allowedLanguages.includes(lang)
        ? prev.allowedLanguages.filter((l) => l !== lang)
        : [...prev.allowedLanguages, lang];
      return { ...prev, allowedLanguages: langs };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const startAt = buildDateFromParts(startDate, startTimeHours, startTimeMinutes, startTimeAmPm);
    const endAt = buildDateFromParts(endDate, endTimeHours, endTimeMinutes, endTimeAmPm);
    onSave({
      ...settings,
      startAt,
      endAt
    });
  };

  const tabs = [
    { id: "general", label: "General" },
    { id: "questions", label: "Questions & UI" },
    { id: "coding", label: "Coding Env" },
    { id: "security", label: "Security & Strict Mode" },
    { id: "results", label: "Results & Board" },
  ];

  const availableLanguages = [
    { id: "python", label: "Python 3" },
    { id: "java", label: "Java (OpenJDK)" },
    { id: "cpp", label: "C++ (GCC)" },
    { id: "c", label: "C (GCC)" },
    { id: "javascript", label: "JavaScript (Node)" },
    { id: "go", label: "Go" },
    { id: "rust", label: "Rust" },
    { id: "sql", label: "SQL (Postgres)" },
  ];

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 text-ink">
      {/* Tab Navigation */}
      <div className="flex border-b border-line gap-2 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? "border-accent text-accent"
                : "border-transparent text-ink-secondary hover:text-ink hover:border-line"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div className="min-h-[300px] max-h-[50vh] overflow-y-auto pr-1">
        {activeTab === "general" && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Exam Duration (Minutes)"
                type="number"
                min={1}
                value={settings.duration}
                onChange={(e) => handleChange("duration", parseInt(e.target.value) || 60)}
                required
              />
              <Input
                label="Exam Access Password (Optional)"
                placeholder="Leave blank for no password"
                value={settings.password}
                onChange={(e) => handleChange("password", e.target.value)}
              />
            </div>
            
            {/* Start Date & Time */}
            <div className="border border-line rounded-2xl p-4 flex flex-col gap-3.5 bg-card/25">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-secondary">Scheduled Start Date & Time (Optional)</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Start Date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-ink/80">Start Time (12-hour format)</label>
                  <div className="grid grid-cols-3 gap-2">
                    <select
                      value={startTimeHours}
                      onChange={(e) => setStartTimeHours(parseInt(e.target.value) || 12)}
                      className="rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink focus:border-accent outline-none font-semibold text-center cursor-pointer"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                        <option key={h} value={h}>{String(h).padStart(2, "0")}</option>
                      ))}
                    </select>
                    <select
                      value={startTimeMinutes}
                      onChange={(e) => setStartTimeMinutes(parseInt(e.target.value) || 0)}
                      className="rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink focus:border-accent outline-none font-semibold text-center cursor-pointer"
                    >
                      {Array.from({ length: 60 }, (_, i) => i).map((m) => (
                        <option key={m} value={m}>{String(m).padStart(2, "0")}</option>
                      ))}
                    </select>
                    <select
                      value={startTimeAmPm}
                      onChange={(e) => setStartTimeAmPm(e.target.value)}
                      className="rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink focus:border-accent outline-none font-semibold text-center cursor-pointer"
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                  <span className="text-[10px] text-ink-secondary/70">Hours / Minutes / Period</span>
                </div>
              </div>
            </div>

            {/* End Date & Time */}
            <div className="border border-line rounded-2xl p-4 flex flex-col gap-3.5 bg-card/25">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-secondary">Scheduled End Date & Time (Optional)</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="End Date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-ink/80">End Time (12-hour format)</label>
                  <div className="grid grid-cols-3 gap-2">
                    <select
                      value={endTimeHours}
                      onChange={(e) => setEndTimeHours(parseInt(e.target.value) || 12)}
                      className="rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink focus:border-accent outline-none font-semibold text-center cursor-pointer"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                        <option key={h} value={h}>{String(h).padStart(2, "0")}</option>
                      ))}
                    </select>
                    <select
                      value={endTimeMinutes}
                      onChange={(e) => setEndTimeMinutes(parseInt(e.target.value) || 0)}
                      className="rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink focus:border-accent outline-none font-semibold text-center cursor-pointer"
                    >
                      {Array.from({ length: 60 }, (_, i) => i).map((m) => (
                        <option key={m} value={m}>{String(m).padStart(2, "0")}</option>
                      ))}
                    </select>
                    <select
                      value={endTimeAmPm}
                      onChange={(e) => setEndTimeAmPm(e.target.value)}
                      className="rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink focus:border-accent outline-none font-semibold text-center cursor-pointer"
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                  <span className="text-[10px] text-ink-secondary/70">Hours / Minutes / Period</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-1 mt-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-ink-secondary">
                Exam Visibility
              </label>
              <div className="flex gap-4 mt-1">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="examVisibility"
                    checked={settings.examVisibility === "public"}
                    onChange={() => handleChange("examVisibility", "public")}
                    className="accent-accent"
                  />
                  <span>Public (Joinable via code)</span>
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="examVisibility"
                    checked={settings.examVisibility === "private"}
                    onChange={() => handleChange("examVisibility", "private")}
                    className="accent-accent"
                  />
                  <span>Private (Requires registration/invitation)</span>
                </label>
              </div>
            </div>

            <label className="flex items-center gap-3 mt-4 p-3 bg-card border border-line rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={settings.registrationEnabled}
                onChange={(e) => handleChange("registrationEnabled", e.target.checked)}
                className="w-4 h-4 rounded border-line text-accent focus:ring-accent"
              />
              <div>
                <p className="text-sm font-medium">Enable Pre-Registration</p>
                <p className="text-xs text-ink-secondary">Candidates must fill details before launching the exam.</p>
              </div>
            </label>
          </div>
        )}

        {activeTab === "questions" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5 bg-card/45 border border-line p-4 rounded-2xl">
                <label className="text-xs font-bold uppercase tracking-wider text-ink-secondary">
                  Question List Display Options
                </label>
                <p className="text-[11px] text-ink-secondary mb-1">Choose what students see in the question list during the exam.</p>
                <select
                  value={settings.questionListDisplayFormat}
                  onChange={(e) => handleChange("questionListDisplayFormat", e.target.value)}
                  className="rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink focus:border-accent outline-none font-semibold cursor-pointer"
                >
                  <option value="number">Question Number only</option>
                  <option value="title">Question Title only</option>
                  <option value="number_title">Question Number + Title</option>
                  <option value="number_title_points">Question Number + Title + Points</option>
                </select>
              </div>

              <div className="flex flex-col gap-3 mt-1">
                <h3 className="font-semibold text-xs uppercase tracking-wider text-ink-secondary">
                  Visibility Toggles
                </h3>
                {[
                  { key: "showMarks", label: "Show Marks/Points to Students" },
                  { key: "showNegativeMarks", label: "Show Negative Marks Info" },
                  { key: "showDifficulty", label: "Show Question Difficulty" },
                  { key: "showTopic", label: "Show Topic/Tag" },
                  { key: "showSampleExplanation", label: "Show Sample Case Explanations" },
                  { key: "showSampleTestCases", label: "Show Sample Test Cases" },
                ].map((item) => (
                  <label key={item.key} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings[item.key]}
                      onChange={(e) => handleChange(item.key, e.target.checked)}
                      className="w-4 h-4 rounded border-line text-accent focus:ring-accent"
                    />
                    <span className="text-sm">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 bg-card/45 border border-line p-4 rounded-2xl">
                <h3 className="font-semibold text-xs uppercase tracking-wider text-ink-secondary">
                  Optional Assessment Modes
                </h3>
                
                <label className="flex items-start gap-3 cursor-pointer mt-1">
                  <input
                    type="checkbox"
                    checked={settings.singleQuestionMode}
                    onChange={(e) => handleChange("singleQuestionMode", e.target.checked)}
                    className="w-4 h-4 rounded border-line text-accent focus:ring-accent mt-0.5"
                  />
                  <div>
                    <span className="text-sm font-medium">Single-Question View Mode</span>
                    <p className="text-[11px] text-ink-secondary leading-relaxed mt-0.5">
                      Candidates land on the question list page first. When they click a question, they can only view and work on that question. Other question contents remain hidden.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer mt-2 pt-2 border-t border-line/40">
                  <input
                    type="checkbox"
                    checked={settings.enablePerQuestionTimer}
                    onChange={(e) => handleChange("enablePerQuestionTimer", e.target.checked)}
                    className="w-4 h-4 rounded border-line text-accent focus:ring-accent mt-0.5"
                  />
                  <div>
                    <span className="text-sm font-medium">Per-Question Timer</span>
                    <p className="text-[11px] text-ink-secondary leading-relaxed mt-0.5">
                      Each question's timer works independently. Remaining time is saved and paused when switching between questions, and continues when reopened.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer mt-2 pt-2 border-t border-line/40">
                  <input
                    type="checkbox"
                    checked={settings.showTimerInQuestionList}
                    onChange={(e) => handleChange("showTimerInQuestionList", e.target.checked)}
                    className="w-4 h-4 rounded border-line text-accent focus:ring-accent mt-0.5"
                  />
                  <div>
                    <span className="text-sm font-medium">Show Question Timer in Question List</span>
                    <p className="text-[11px] text-ink-secondary leading-relaxed mt-0.5">
                      If enabled, students can see the remaining time for each question in the question list overview.
                    </p>
                  </div>
                </label>
              </div>

              <div className="flex flex-col gap-3 mt-1">
                <h3 className="font-semibold text-xs uppercase tracking-wider text-ink-secondary">
                  Navigation Rules
                </h3>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.randomNavigation}
                    disabled={settings.singleQuestionMode}
                    onChange={(e) => handleChange("randomNavigation", e.target.checked)}
                    className="w-4 h-4 rounded border-line text-accent focus:ring-accent disabled:opacity-50"
                  />
                  <div>
                    <span className={`text-sm font-medium ${settings.singleQuestionMode ? "text-ink-secondary" : ""}`}>Allow Random Jump Navigation</span>
                    <p className="text-xs text-ink-secondary">Students can click any question from the list to answer it.</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer mt-1">
                  <input
                    type="checkbox"
                    checked={settings.sequentialNavigation}
                    disabled={settings.singleQuestionMode}
                    onChange={(e) => handleChange("sequentialNavigation", e.target.checked)}
                    className="w-4 h-4 rounded border-line text-accent focus:ring-accent disabled:opacity-50"
                  />
                  <div>
                    <span className={`text-sm font-medium ${settings.singleQuestionMode ? "text-ink-secondary" : ""}`}>Enforce Sequential Navigation</span>
                    <p className="text-xs text-ink-secondary">Forces candidates to complete questions in order; cannot go back.</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer mt-1">
                  <input
                    type="checkbox"
                    checked={settings.lockQuestions}
                    disabled={!settings.randomNavigation || settings.singleQuestionMode}
                    onChange={(e) => handleChange("lockQuestions", e.target.checked)}
                    className="w-4 h-4 rounded border-line text-accent focus:ring-accent disabled:opacity-50"
                  />
                  <div>
                    <span className={`text-sm font-medium ${(!settings.randomNavigation || settings.singleQuestionMode) ? "text-ink-secondary" : ""}`}>Lock Question On Submit</span>
                    <p className="text-xs text-ink-secondary">Candidates cannot edit responses once submitted.</p>
                  </div>
                </label>
              </div>

              <h3 className="font-semibold text-xs uppercase tracking-wider text-ink-secondary mt-3">
                Shuffling
              </h3>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.shuffleMcqs}
                  onChange={(e) => handleChange("shuffleMcqs", e.target.checked)}
                  className="w-4 h-4 rounded border-line text-accent focus:ring-accent"
                />
                <span className="text-sm">Shuffle MCQ Questions Order</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.shuffleOptions}
                  onChange={(e) => handleChange("shuffleOptions", e.target.checked)}
                  className="w-4 h-4 rounded border-line text-accent focus:ring-accent"
                />
                <span className="text-sm">Shuffle MCQ Options (A, B, C, D)</span>
              </label>
            </div>
          </div>
        )}

        {activeTab === "coding" && (
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-ink-secondary">
                Allowed Languages
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                {availableLanguages.map((lang) => {
                  const isChecked = settings.allowedLanguages.includes(lang.id);
                  return (
                    <button
                      key={lang.id}
                      type="button"
                      onClick={() => handleLanguageToggle(lang.id)}
                      className={`px-3 py-2 rounded-xl border text-xs font-medium transition-all text-center ${
                        isChecked
                          ? "border-accent bg-accent-soft text-accent"
                          : "border-line bg-surface hover:border-accent/40"
                      }`}
                    >
                      {lang.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <Input
                label="Execution Time Limit (Seconds)"
                type="number"
                value={settings.timeLimit}
                onChange={(e) => handleChange("timeLimit", parseInt(e.target.value) || 5)}
              />
              <Input
                label="Memory Limit (MB)"
                type="number"
                value={settings.memoryLimit}
                onChange={(e) => handleChange("memoryLimit", parseInt(e.target.value) || 256)}
              />
            </div>

            <div className="flex flex-col gap-3 mt-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.allowRunCode}
                  onChange={(e) => handleChange("allowRunCode", e.target.checked)}
                  className="w-4 h-4 rounded border-line text-accent focus:ring-accent"
                />
                <span className="text-sm">Allow Students to Run Code against Sample Cases</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.allowCustomInput}
                  onChange={(e) => handleChange("allowCustomInput", e.target.checked)}
                  className="w-4 h-4 rounded border-line text-accent focus:ring-accent"
                />
                <span className="text-sm">Allow Candidates to Provide Custom Inputs for Testing</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.visibleTestCases}
                  onChange={(e) => handleChange("visibleTestCases", e.target.checked)}
                  className="w-4 h-4 rounded border-line text-accent focus:ring-accent"
                />
                <span className="text-sm">Show Sample Test Case Outcomes on Screen</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.partialScoring}
                  onChange={(e) => handleChange("partialScoring", e.target.checked)}
                  className="w-4 h-4 rounded border-line text-accent focus:ring-accent"
                />
                <span className="text-sm">Enable Partial Test Case Points Scoring</span>
              </label>
            </div>
          </div>
        )}

        {activeTab === "security" && (
          <div className="flex flex-col gap-4">
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs font-medium">
              CRITICAL: Strict anti-cheating controls will block candidates from taking shortcuts.
            </div>

            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableFullScreen}
                  onChange={(e) => handleChange("enableFullScreen", e.target.checked)}
                  className="w-4 h-4 rounded border-line text-accent focus:ring-accent"
                />
                <div>
                  <span className="text-sm font-medium">Enforce Strict Full Screen Mode</span>
                  <p className="text-xs text-ink-secondary">Triggers alerts and log events on fullscreen exit or minimizing.</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.disableCopy}
                  onChange={(e) => handleChange("disableCopy", e.target.checked)}
                  className="w-4 h-4 rounded border-line text-accent focus:ring-accent"
                />
                <span className="text-sm">Disable Copying Text from Question Board</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.disablePaste}
                  onChange={(e) => handleChange("disablePaste", e.target.checked)}
                  className="w-4 h-4 rounded border-line text-accent focus:ring-accent"
                />
                <span className="text-sm">Disable Pasting Text into Monaco Editor</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.disableRightClick}
                  onChange={(e) => handleChange("disableRightClick", e.target.checked)}
                  className="w-4 h-4 rounded border-line text-accent focus:ring-accent"
                />
                <span className="text-sm">Disable Right-Click Context Menu</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                <Input
                  label="Cheating Warning Count Limit"
                  type="number"
                  min={1}
                  value={settings.warningLimit}
                  onChange={(e) => handleChange("warningLimit", parseInt(e.target.value) || 3)}
                />
                <label className="flex items-center gap-3 cursor-pointer pt-6">
                  <input
                    type="checkbox"
                    checked={settings.autoSubmit}
                    onChange={(e) => handleChange("autoSubmit", e.target.checked)}
                    className="w-4 h-4 rounded border-line text-accent focus:ring-accent"
                  />
                  <div>
                    <span className="text-sm font-medium">Auto-Submit Exam on Violation Limit</span>
                    <p className="text-xs text-ink-secondary">Submits the test taker answers if warning limit is breached.</p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === "results" && (
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showScoreImmediately}
                onChange={(e) => handleChange("showScoreImmediately", e.target.checked)}
                className="w-4 h-4 rounded border-line text-accent focus:ring-accent"
              />
              <div>
                <span className="text-sm font-medium">Publish Score Immediately</span>
                <p className="text-xs text-ink-secondary">Candidates see their graded score right after submission.</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={!settings.hideScore}
                onChange={(e) => handleChange("hideScore", !e.target.checked)}
                className="w-4 h-4 rounded border-line text-accent focus:ring-accent"
              />
              <span className="text-sm">Display Detailed Points breakdown to Candidates</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showLeaderboard}
                onChange={(e) => handleChange("showLeaderboard", e.target.checked)}
                className="w-4 h-4 rounded border-line text-accent focus:ring-accent"
              />
              <div>
                <span className="text-sm font-medium">Enable Public Leaderboard</span>
                <p className="text-xs text-ink-secondary">Publishes a public standings score-board after the exam closes.</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showRank}
                onChange={(e) => handleChange("showRank", e.target.checked)}
                className="w-4 h-4 rounded border-line text-accent focus:ring-accent"
              />
              <span className="text-sm">Show Rank Standing to Candidate</span>
            </label>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-line">
        <Button variant="secondary" type="button" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </form>
  );
}
