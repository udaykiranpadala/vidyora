import { useState } from "react";
import Input from "./Input";
import Textarea from "./Textarea";
import Button from "./Button";

const LANGUAGES = [
  { value: "c", label: "C" },
  { value: "cpp", label: "C++" },
  { value: "java", label: "Java" },
  { value: "python", label: "Python" },
  { value: "javascript", label: "JavaScript" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
];

const emptyTestCase = () => ({
  input: "",
  expectedOutput: "",
  points: 10,
  isHidden: true,
});

export default function CodingForm({ initial, onSubmit, onCancel, submitting }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [statement, setStatement] = useState(initial?.statement || "");
  const secondsToHms = (totalSeconds) => {
    if (totalSeconds === undefined || totalSeconds === null || totalSeconds < 0) {
      return { hours: 0, minutes: 20, seconds: 0 };
    }
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return { hours, minutes, seconds };
  };

  const [timerHours, setTimerHours] = useState(() => {
    const { hours } = secondsToHms(initial?.timerSeconds);
    return initial ? hours : 0;
  });
  const [timerMinutes, setTimerMinutes] = useState(() => {
    const { minutes } = secondsToHms(initial?.timerSeconds);
    return initial ? minutes : 20;
  });
  const [timerSecondsValue, setTimerSecondsValue] = useState(() => {
    const { seconds } = secondsToHms(initial?.timerSeconds);
    return initial ? seconds : 0;
  });
  const [allowedLanguages, setAllowedLanguages] = useState(
    initial?.allowedLanguages?.length ? initial.allowedLanguages : ["python"]
  );
  const [testCases, setTestCases] = useState(
    initial?.testCases?.length
      ? initial.testCases
      : [
          { ...emptyTestCase(), isHidden: false }, // first one visible as a sample
          emptyTestCase(),
        ]
  );
  const [error, setError] = useState("");

  const toggleLanguage = (lang) => {
    setAllowedLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  const updateTestCase = (idx, field, value) => {
    setTestCases((prev) =>
      prev.map((tc, i) => (i === idx ? { ...tc, [field]: value } : tc))
    );
  };
  const addTestCase = () => setTestCases((prev) => [...prev, emptyTestCase()]);
  const removeTestCase = (idx) =>
    setTestCases((prev) => prev.filter((_, i) => i !== idx));

  const totalPoints = testCases.reduce((sum, tc) => sum + Number(tc.points || 0), 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (allowedLanguages.length === 0) {
      setError("Select at least one allowed language");
      return;
    }
    if (testCases.length === 0) {
      setError("Add at least one test case");
      return;
    }
    if (testCases.some((tc) => !tc.expectedOutput.trim())) {
      setError("Every test case needs an expected output");
      return;
    }

    const timerSeconds = Number(timerHours) * 3600 + Number(timerMinutes) * 60 + Number(timerSecondsValue);
    if (timerSeconds <= 0) {
      setError("Timer must be greater than 0 seconds");
      return;
    }

    onSubmit({
      type: "coding",
      title,
      statement,
      timerSeconds,
      allowedLanguages,
      testCases: testCases.map((tc) => ({ ...tc, points: Number(tc.points) })),
      starterCode: {},
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Problem title"
        placeholder="e.g. Two Sum"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <Textarea
        label="Problem statement"
        rows={5}
        placeholder="Describe the problem, input format, output format, and constraints..."
        value={statement}
        onChange={(e) => setStatement(e.target.value)}
        required
      />

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-ink/80">Allowed languages</label>
        <div className="flex gap-2 flex-wrap">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.value}
              type="button"
              onClick={() => toggleLanguage(lang.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                allowedLanguages.includes(lang.value)
                  ? "bg-accent text-white border-accent"
                  : "bg-surface text-ink/70 border-line hover:border-accent/50"
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-ink/80">Question Timer</label>
        <div className="grid grid-cols-3 gap-2 max-w-sm">
          <input
            type="number"
            min={0}
            placeholder="HH"
            value={timerHours}
            onChange={(e) => setTimerHours(parseInt(e.target.value) || 0)}
            className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink/40 focus:border-accent outline-none text-center"
            required
          />
          <input
            type="number"
            min={0}
            max={59}
            placeholder="MM"
            value={timerMinutes}
            onChange={(e) => setTimerMinutes(parseInt(e.target.value) || 0)}
            className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink/40 focus:border-accent outline-none text-center"
            required
          />
          <input
            type="number"
            min={0}
            max={59}
            placeholder="SS"
            value={timerSecondsValue}
            onChange={(e) => setTimerSecondsValue(parseInt(e.target.value) || 0)}
            className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink/40 focus:border-accent outline-none text-center"
            required
          />
        </div>
        <span className="text-[10px] text-ink-secondary/75">Hours / Minutes / Seconds</span>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-ink/80">
            Test cases <span className="text-ink/50">(total: {totalPoints} pts)</span>
          </label>
        </div>

        {testCases.map((tc, idx) => (
          <div
            key={idx}
            className="border border-line rounded-xl p-4 flex flex-col gap-3 bg-paper"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-ink/60 uppercase tracking-wide">
                Test case {idx + 1}
              </span>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-xs text-ink/60">
                  <input
                    type="checkbox"
                    checked={!tc.isHidden}
                    onChange={(e) => updateTestCase(idx, "isHidden", !e.target.checked)}
                    className="accent-accent"
                  />
                  Visible to student (sample)
                </label>
                {testCases.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTestCase(idx)}
                    className="text-ink/40 hover:text-danger text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Textarea
                label="Input"
                rows={2}
                placeholder="(leave blank if no input)"
                value={tc.input}
                onChange={(e) => updateTestCase(idx, "input", e.target.value)}
                className="font-mono text-xs"
              />
              <Textarea
                label="Expected output"
                rows={2}
                value={tc.expectedOutput}
                onChange={(e) => updateTestCase(idx, "expectedOutput", e.target.value)}
                className="font-mono text-xs"
                required
              />
            </div>
            <Input
              label="Points"
              type="number"
              min={1}
              value={tc.points}
              onChange={(e) => updateTestCase(idx, "points", e.target.value)}
              className="w-32"
            />
          </div>
        ))}
        <button
          type="button"
          onClick={addTestCase}
          className="text-sm text-accent font-medium text-left"
        >
          + Add test case
        </button>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex gap-3 justify-end mt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : "Save question"}
        </Button>
      </div>
    </form>
  );
}
