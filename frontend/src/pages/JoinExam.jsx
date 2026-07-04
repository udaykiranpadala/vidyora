import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { attemptApi } from "../api/attempts";
import Navbar from "../components/Navbar";
import Button from "../components/Button";
import Input from "../components/Input";

const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];


const SelectField = ({ label, value, onChange, options, placeholder, required }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-sm font-semibold text-ink">
      {label}
      {required && <span className="text-danger ml-1">*</span>}
    </label>
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full appearance-none bg-card border border-line rounded-xl px-4 py-2.5 text-sm text-ink
                   focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent
                   transition-all cursor-pointer pr-10"
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      {/* Chevron arrow */}
      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
        <svg className="w-4 h-4 text-ink-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  </div>
);

export default function JoinExam() {
  const { accessCode: codeFromUrl } = useParams();
  const navigate = useNavigate();

  const [accessCode, setAccessCode] = useState(codeFromUrl || "");
  const [candidateName, setCandidateName] = useState("");
  const [candidateRollNumber, setCandidateRollNumber] = useState("");
  const [candidateYear, setCandidateYear] = useState("");
  const [candidateSection, setCandidateSection] = useState("");
  const [candidateBranch, setCandidateBranch] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!candidateYear) { setError("Please select your year."); return; }
    if (!candidateSection) { setError("Please select your section."); return; }
    if (!candidateBranch) { setError("Please select your branch."); return; }

    setLoading(true);
    try {
      const res = await attemptApi.join(accessCode.toUpperCase(), {
        candidateName,
        candidateRollNumber,
        candidateYear,
        candidateSection,
        candidateBranch,
        password,
      });
      navigate(`/exam-attempt/${res.data.attemptId}`, {
        state: {
          examTitle: res.data.examTitle,
          totalQuestions: res.data.totalQuestions,
          candidateName,
          candidateRollNumber,
          candidateYear,
          candidateSection,
          candidateBranch,
        },
      });
    } catch (err) {
      setError(err.response?.data?.message || "Could not join exam");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper font-expert">
      <Navbar />

      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 mb-4">
              <svg className="w-7 h-7 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h1 className="font-display text-3xl font-bold text-ink">Join an Exam</h1>
            <p className="text-ink-secondary text-sm mt-2">
              Fill in your details to begin the assessment
            </p>
          </div>

          <div className="bg-surface border border-line rounded-2xl p-8 shadow-sm">
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">

              {/* Exam Code */}
              <Input
                label="Exam code"
                placeholder="e.g. X7K9PQ"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                className="text-center font-mono text-lg tracking-widest"
                maxLength={8}
                required
              />

              {/* Divider */}
              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 h-px bg-line" />
                <span className="text-xs text-ink-secondary font-medium">Your Details</span>
                <div className="flex-1 h-px bg-line" />
              </div>

              {/* Full Name */}
              <Input
                label="Full name"
                placeholder="As it should appear on the leaderboard"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                required
              />

              {/* Roll Number */}
              <Input
                label="Roll number / ID"
                placeholder="e.g. 21CS1042"
                value={candidateRollNumber}
                onChange={(e) => setCandidateRollNumber(e.target.value)}
              />

              {/* Divider */}
              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 h-px bg-line" />
                <span className="text-xs text-ink-secondary font-medium">Academic Info</span>
                <div className="flex-1 h-px bg-line" />
              </div>

              {/* Year + Section side by side */}
              <div className="grid grid-cols-2 gap-4">
                <SelectField
                  label="Year"
                  value={candidateYear}
                  onChange={setCandidateYear}
                  options={YEARS}
                  placeholder="Select year"
                  required
                />
                <Input
                  label="Section"
                  placeholder="e.g. A, B, C..."
                  value={candidateSection}
                  onChange={(e) => setCandidateSection(e.target.value)}
                  required
                />
              </div>

              {/* Branch */}
              <Input
                label="Branch / Department"
                placeholder="e.g. Computer Science Engineering"
                value={candidateBranch}
                onChange={(e) => setCandidateBranch(e.target.value)}
                required
              />

              {/* Exam Password */}
              <Input
                label="Exam password"
                type="password"
                placeholder="Leave blank if not required"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-danger/10 border border-danger/20 text-sm text-danger">
                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <Button type="submit" disabled={loading} className="w-full mt-1 py-3 text-base">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Joining exam...
                  </span>
                ) : "Start Exam →"}
              </Button>

              <p className="text-xs text-center text-ink-secondary leading-relaxed">
                Each question has its own timer. When time runs out, your answer is
                saved automatically and you move to the next question.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
