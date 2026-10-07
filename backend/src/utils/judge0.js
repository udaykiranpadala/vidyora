import axios from "axios";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

// Concurrency limiter / semaphore to protect the 512MB Render container
class ExecutionLimiter {
  constructor(maxConcurrent = 2, maxQueue = 10) {
    this.maxConcurrent = maxConcurrent;
    this.maxQueue = maxQueue;
    this.active = 0;
    this.queue = [];
  }

  async acquire() {
    if (this.active < this.maxConcurrent) {
      this.active++;
      return () => this.release();
    }

    if (this.queue.length >= this.maxQueue) {
      const err = new Error("Execution capacity reached. Server is currently grading other submissions. Please try again in a few seconds.");
      err.status = 429;
      err.code = "ERR_CONCURRENCY_LIMIT";
      throw err;
    }

    return new Promise((resolve, reject) => {
      this.queue.push({ resolve, reject });
    });
  }

  release() {
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      next.resolve(() => this.release());
    } else {
      this.active = Math.max(0, this.active - 1);
    }
  }

  getStatus() {
    return {
      active: this.active,
      queued: this.queue.length,
      maxConcurrent: this.maxConcurrent,
      maxQueue: this.maxQueue,
    };
  }
}

const limiter = new ExecutionLimiter(
  parseInt(process.env.MAX_CONCURRENT_EXECUTIONS, 10) || 2,
  parseInt(process.env.MAX_EXECUTION_QUEUE, 10) || 10
);

export const getExecutionStatus = () => limiter.getStatus();

const JUDGE0_LANGUAGE_MAP = {
  c: 50,
  cpp: 54,
  "c++": 54,
  cpp17: 54,
  cpp20: 54,
  java: 62,
  python: 71,
  py: 71,
  python3: 71,
  javascript: 63,
  js: 63,
  node: 63,
  go: 60,
  rust: 73,
};

const decodeBase64 = (str) => {
  if (!str) return "";
  try {
    return Buffer.from(str, "base64").toString("utf8");
  } catch (_) {
    return "";
  }
};

// Circuit-breaker tracking for local Judge0 instance
let localJudge0UnreachableUntil = 0;
const LOCAL_PROBE_COOLDOWN_MS = 5 * 60 * 1000; // 5-minute cool-down when local instance is offline

const resolveProviderUrl = () => {
  const configured = (process.env.JUDGE0_API_URL || "").trim().replace(/\/+$/, "");
  const isLocalhost = !configured || configured.includes("localhost") || configured.includes("127.0.0.1");

  // On Render/Production without a remote Judge0 URL, or when localhost is in cool-down:
  if (isLocalhost) {
    const isCoolingDown = Date.now() < localJudge0UnreachableUntil;
    const isProductionOnRender = process.env.NODE_ENV === "production" && !process.env.FORCE_LOCAL_JUDGE0;

    if (isCoolingDown || isProductionOnRender) {
      return {
        url: "https://ce.judge0.com",
        isPublicCloud: true,
      };
    }
  }

  return {
    url: configured || "http://localhost:2358",
    isPublicCloud: false,
  };
};

// Sandboxed local runner for offline local development only (disabled in production on Render)
const runLocallyFallback = async (sourceCode, language, testCases) => {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_LOCAL_EXECUTION !== "true") {
    throw new Error("Code execution service is temporarily unavailable. Please retry in a few moments.");
  }

  const normLang = (language || "").toLowerCase().trim();
  const results = [];
  let totalPointsEarned = 0;
  let compileError = null;

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "vidyora-exec-"));

  try {
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      const inputStr = testCase.input || "";
      const expectedStr = (testCase.expectedOutput || "").trim();

      let cmd = "";
      let fileExt = "";

      if (normLang === "python" || normLang === "py" || normLang === "python3") {
        fileExt = "py";
        const filePath = path.join(tempDir, `script_${i}.${fileExt}`);
        fs.writeFileSync(filePath, sourceCode);
        cmd = `python "${filePath}"`;
      } else if (normLang === "javascript" || normLang === "js" || normLang === "node") {
        fileExt = "js";
        const filePath = path.join(tempDir, `script_${i}.${fileExt}`);
        fs.writeFileSync(filePath, sourceCode);
        cmd = `node "${filePath}"`;
      } else {
        throw new Error(`Compiler runner for '${language}' is not available locally.`);
      }

      // Safe stripped environment to prevent arbitrary user scripts from reading MONGO_URI, JWT_SECRET, etc.
      const safeEnv = {
        PATH: process.env.PATH || "",
        TEMP: os.tmpdir(),
        TMP: os.tmpdir(),
      };

      const { stdout, stderr, code } = await new Promise((resolve) => {
        const child = exec(
          cmd,
          {
            timeout: 4000,
            maxBuffer: 64 * 1024, // 64KB max output buffer
            env: safeEnv,
          },
          (error, stdoutStr, stderrStr) => {
            resolve({
              stdout: stdoutStr || "",
              stderr: stderrStr || (error ? error.message : ""),
              code: error ? error.code || 1 : 0,
            });
          }
        );

        if (inputStr) {
          try {
            child.stdin.write(inputStr);
          } catch (_) {}
        }
        try {
          child.stdin.end();
        } catch (_) {}
      });

      const actualStdout = stdout.trim();
      const passed = code === 0 && actualStdout === expectedStr;
      const pointsEarned = passed ? testCase.points || 0 : 0;
      totalPointsEarned += pointsEarned;

      results.push({
        passed,
        pointsEarned,
        stdout,
        stderr,
        compileOutput: stderr,
        status: {
          id: code === 0 ? (passed ? 3 : 4) : 11,
          description: code === 0 ? (passed ? "Accepted" : "Wrong Answer") : "Runtime Error",
        },
        time: 0.05,
        memory: 1024,
        exit_code: code,
        input: inputStr,
        expectedOutput: testCase.expectedOutput || "",
      });
    }

    return { results, totalPointsEarned, compileError };
  } finally {
    // Guaranteed temporary directory removal
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (_) {}
  }
};

export const runAgainstTestCases = async (sourceCode, language, testCases) => {
  // 1. Pre-flight input validation
  const normalizedLang = (language || "").toLowerCase().trim();
  const languageId = JUDGE0_LANGUAGE_MAP[normalizedLang];

  if (!languageId) {
    throw new Error(`Unsupported language: '${language}'. Supported languages: C, C++, Java, Python, JavaScript.`);
  }

  const cases = Array.isArray(testCases) ? testCases : [];
  if (cases.length === 0) {
    return { results: [], totalPointsEarned: 0, compileError: null };
  }

  // Early exit for empty or whitespace-only code (prevents HTTP 422 "can't be blank" from Judge0)
  if (!sourceCode || !sourceCode.trim()) {
    return {
      results: cases.map((tc) => ({
        passed: false,
        pointsEarned: 0,
        stdout: "",
        stderr: "No code provided to execute.",
        compileOutput: "No code provided to execute.",
        status: { id: 11, description: "Runtime Error (No Code)" },
        time: 0,
        memory: 0,
        exit_code: 1,
        input: tc.input || "",
        expectedOutput: tc.expectedOutput || "",
      })),
      totalPointsEarned: 0,
      compileError: "No code provided to execute.",
    };
  }

  // Acquire concurrency token
  const releaseLimiter = await limiter.acquire();

  try {
    return await executeBounded(sourceCode, languageId, cases, language);
  } finally {
    releaseLimiter();
  }
};

const executeBounded = async (sourceCode, languageId, testCases, rawLanguageName) => {
  // Cap batch submissions to 20 (Judge0 batch size ceiling)
  const boundedTestCases = testCases.slice(0, 20);

  const submissions = boundedTestCases.map((tc) => {
    const sub = {
      source_code: Buffer.from(sourceCode).toString("base64"),
      language_id: languageId,
      stdin: Buffer.from(tc.input || "").toString("base64"),
    };
    if (tc.expectedOutput !== undefined && tc.expectedOutput !== null && tc.expectedOutput !== "") {
      sub.expected_output = Buffer.from(tc.expectedOutput).toString("base64");
    }
    return sub;
  });

  const apiKey = (process.env.JUDGE0_API_KEY || "").trim();
  const baseHeaders = { "Content-Type": "application/json" };
  if (apiKey && apiKey !== "leave_blank_for_now") {
    baseHeaders["X-RapidAPI-Key"] = apiKey;
  }

  const { url: primaryUrl, isPublicCloud } = resolveProviderUrl();

  let activeApiUrl = primaryUrl;
  let activeHeaders = { ...baseHeaders };
  if (!isPublicCloud && apiKey) {
    try {
      activeHeaders["X-RapidAPI-Host"] = new URL(activeApiUrl).hostname;
    } catch (_) {}
  }

  let postRes;

  try {
    postRes = await axios.post(
      `${activeApiUrl}/submissions/batch?base64_encoded=true`,
      { submissions },
      { headers: activeHeaders, timeout: 7000 }
    );
  } catch (err) {
    // Check for HTTP 422 Client Validation Error
    if (err.response && err.response.status === 422) {
      const safeDetail = typeof err.response.data === "object" ? JSON.stringify(err.response.data) : String(err.response.data);
      console.warn(`[Judge0] Rejected submission payload with HTTP 422: ${safeDetail.slice(0, 150)}`);
      return {
        results: boundedTestCases.map((tc) => ({
          passed: false,
          pointsEarned: 0,
          stdout: "",
          stderr: "Submission rejected by compiler engine (HTTP 422). Check code format and language selection.",
          compileOutput: "Submission parameters unprocessable (HTTP 422).",
          status: { id: 13, description: "Unprocessable Submission" },
          time: 0,
          memory: 0,
          exit_code: 1,
          input: tc.input || "",
          expectedOutput: tc.expectedOutput || "",
        })),
        totalPointsEarned: 0,
        compileError: "Submission parameters unprocessable (HTTP 422).",
      };
    }

    // If active URL was local and failed, switch to public Judge0 cloud engine
    if (!activeApiUrl.includes("ce.judge0.com")) {
      console.warn(`Local Judge0 at ${activeApiUrl} unreachable. Enabling 5-minute cooldown and switching to Public Judge0 (ce.judge0.com)...`);
      localJudge0UnreachableUntil = Date.now() + LOCAL_PROBE_COOLDOWN_MS;
      activeApiUrl = "https://ce.judge0.com";
      activeHeaders = { "Content-Type": "application/json" };

      try {
        postRes = await axios.post(
          `https://ce.judge0.com/submissions/batch?base64_encoded=true`,
          { submissions },
          { headers: activeHeaders, timeout: 10000 }
        );
      } catch (cloudErr) {
        if (cloudErr.response && cloudErr.response.status === 422) {
          console.warn("[Judge0 Public] Returned 422. Returning controlled error.");
          return {
            results: boundedTestCases.map((tc) => ({
              passed: false,
              pointsEarned: 0,
              stdout: "",
              stderr: "Submission rejected by compiler engine (HTTP 422).",
              compileOutput: "Submission rejected (HTTP 422).",
              status: { id: 13, description: "Unprocessable Submission" },
              time: 0,
              memory: 0,
              exit_code: 1,
              input: tc.input || "",
              expectedOutput: tc.expectedOutput || "",
            })),
            totalPointsEarned: 0,
            compileError: "Submission parameters unprocessable (HTTP 422).",
          };
        }

        console.warn(`Public Judge0 failed (${cloudErr.message}). Attempting safe fallback...`);
        return await runLocallyFallback(sourceCode, rawLanguageName, boundedTestCases);
      }
    } else {
      console.warn(`Public Judge0 connection failed: ${err.message}. Attempting safe fallback...`);
      return await runLocallyFallback(sourceCode, rawLanguageName, boundedTestCases);
    }
  }

  const rawBatchData = postRes?.data;
  const submissionTokens = Array.isArray(rawBatchData)
    ? rawBatchData.map((s) => s.token).filter(Boolean)
    : (rawBatchData?.submissions || []).map((s) => s.token).filter(Boolean);

  if (!submissionTokens || submissionTokens.length === 0) {
    throw new Error("Failed to retrieve execution tokens from compiler service.");
  }

  // 2. Bounded polling (Max 15 attempts with gentle backoff, max ~20s total)
  let allFinished = false;
  let pollResults = [];
  let attempts = 0;
  const maxAttempts = 15;
  let pollDelayMs = 1000;

  while (!allFinished && attempts < maxAttempts) {
    attempts++;
    try {
      const getRes = await axios.get(`${activeApiUrl}/submissions/batch`, {
        params: {
          tokens: submissionTokens.join(","),
          base64_encoded: "true",
          fields: "status_id,status,stdout,stderr,compile_output,time,memory,exit_code",
        },
        headers: activeHeaders,
        timeout: 8000,
      });

      const subs = Array.isArray(getRes.data)
        ? getRes.data
        : (getRes.data?.submissions || []);

      pollResults = subs;

      // Status ID 1 = In Queue, Status ID 2 = Processing. If all > 2, finished.
      allFinished = subs.length > 0 && subs.every(
        (sub) => sub && ((sub.status_id && sub.status_id > 2) || (sub.status && sub.status.id > 2))
      );

      if (!allFinished) {
        await new Promise((resolve) => setTimeout(resolve, pollDelayMs));
        pollDelayMs = Math.min(2000, pollDelayMs + 200);
      }
    } catch (pollErr) {
      if (attempts >= maxAttempts) break;
      await new Promise((resolve) => setTimeout(resolve, 1200));
    }
  }

  if (!allFinished && pollResults.length === 0) {
    throw new Error("Code execution timed out. Please try running again.");
  }

  // 3. Process execution results safely
  const results = [];
  let totalPointsEarned = 0;
  let compileError = null;

  for (let i = 0; i < boundedTestCases.length; i++) {
    const testCase = boundedTestCases[i];
    const sub = pollResults[i];

    if (!sub) {
      results.push({
        passed: false,
        pointsEarned: 0,
        stdout: "",
        stderr: "No result returned for this test case.",
        compileOutput: "",
        status: { id: 13, description: "Internal Error" },
        time: 0,
        memory: 0,
        exit_code: 1,
        input: testCase.input || "",
        expectedOutput: testCase.expectedOutput || "",
      });
      continue;
    }

    const decodedStdout = decodeBase64(sub.stdout);
    const decodedStderr = decodeBase64(sub.stderr);
    const decodedCompileOutput = decodeBase64(sub.compile_output);

    // Compilation Error (ID 6)
    const isCompileError = sub.status_id === 6 || (sub.status && sub.status.id === 6);
    if (isCompileError && !compileError) {
      compileError = decodedCompileOutput || decodedStderr || "Compilation Error";
    }

    // Accepted (ID 3)
    const passed = sub.status_id === 3 || (sub.status && sub.status.id === 3);
    const pointsEarned = passed ? testCase.points || 0 : 0;
    totalPointsEarned += pointsEarned;

    results.push({
      passed,
      pointsEarned,
      stdout: decodedStdout,
      stderr: decodedStderr,
      compileOutput: decodedCompileOutput,
      status: sub.status || { id: sub.status_id, description: passed ? "Accepted" : "Failed" },
      time: sub.time ? parseFloat(sub.time) : 0,
      memory: sub.memory || 0,
      exit_code: sub.exit_code ?? 0,
      input: testCase.input || "",
      expectedOutput: testCase.expectedOutput || "",
    });
  }

  return { results, totalPointsEarned, compileError };
};