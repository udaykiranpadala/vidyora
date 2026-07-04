import { useState } from "react";
import Input from "./Input";
import Textarea from "./Textarea";
import Button from "./Button";

const emptyOption = () => ({ text: "", isCorrect: false });

export default function McqForm({ initial, onSubmit, onCancel, submitting }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [statement, setStatement] = useState(initial?.statement || "");
  const secondsToHms = (totalSeconds) => {
    if (totalSeconds === undefined || totalSeconds === null || totalSeconds < 0) {
      return { hours: 0, minutes: 2, seconds: 0 };
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
    return initial ? minutes : 2;
  });
  const [timerSecondsValue, setTimerSecondsValue] = useState(() => {
    const { seconds } = secondsToHms(initial?.timerSeconds);
    return initial ? seconds : 0;
  });
  const [totalPoints, setTotalPoints] = useState(initial?.totalPoints || 10);
  const [options, setOptions] = useState(
    initial?.options?.length ? initial.options : [emptyOption(), emptyOption()]
  );
  const [error, setError] = useState("");

  const updateOption = (idx, field, value) => {
    setOptions((prev) =>
      prev.map((opt, i) => {
        if (i !== idx) {
          // if marking a new option correct, un-mark the rest (single-correct MCQ)
          return field === "isCorrect" && value ? { ...opt, isCorrect: false } : opt;
        }
        return { ...opt, [field]: value };
      })
    );
  };

  const addOption = () => setOptions((prev) => [...prev, emptyOption()]);
  const removeOption = (idx) =>
    setOptions((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (options.length < 2) {
      setError("Add at least 2 options");
      return;
    }
    if (options.some((o) => !o.text.trim())) {
      setError("All options need text");
      return;
    }
    if (options.filter((o) => o.isCorrect).length !== 1) {
      setError("Mark exactly one option as correct");
      return;
    }

    const timerSeconds = Number(timerHours) * 3600 + Number(timerMinutes) * 60 + Number(timerSecondsValue);
    if (timerSeconds <= 0) {
      setError("Timer must be greater than 0 seconds");
      return;
    }

    onSubmit({
      type: "mcq",
      title,
      statement,
      timerSeconds,
      totalPoints: Number(totalPoints),
      options,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Question title"
        placeholder="e.g. Time Complexity of Binary Search"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <Textarea
        label="Question text"
        rows={3}
        placeholder="What is the question asking?"
        value={statement}
        onChange={(e) => setStatement(e.target.value)}
        required
      />

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-ink/80">Options</label>
        {options.map((opt, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <input
              type="radio"
              name="correct-option"
              checked={opt.isCorrect}
              onChange={() => updateOption(idx, "isCorrect", true)}
              className="accent-accent w-4 h-4 shrink-0"
              title="Mark as correct answer"
            />
            <input
              type="text"
              placeholder={`Option ${idx + 1}`}
              value={opt.text}
              onChange={(e) => updateOption(idx, "text", e.target.value)}
              className="flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-sm focus:border-accent outline-none"
            />
            {options.length > 2 && (
              <button
                type="button"
                onClick={() => removeOption(idx)}
                className="text-ink/40 hover:text-danger text-sm px-1"
              >
                ✕
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addOption}
          className="text-sm text-accent font-medium text-left mt-1"
        >
          + Add option
        </button>
        <p className="text-xs text-ink/50">Select the radio button next to the correct option.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ink/80">Question Timer</label>
          <div className="grid grid-cols-3 gap-2">
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
        <Input
          label="Points for correct answer"
          type="number"
          min={1}
          value={totalPoints}
          onChange={(e) => setTotalPoints(e.target.value)}
          required
        />
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
