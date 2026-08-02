import axios from "axios";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

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
  return Buffer.from(str, "base64").toString("utf8");
};

// Fallback executor using local node/python process when Docker/Judge0 is unreachable
const runLocallyFallback = async (sourceCode, language, testCases) => {
  const normLang = (language || "").toLowerCase().trim();
  const results = [];
  let totalPointsEarned = 0;
  let compileError = null;

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "vidyora-exec-"));

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
      // For C/C++/Java without Docker, throw clear error
      fs.rmSync(tempDir, { recursive: true, force: true });
      throw new Error(`Code execution service (Docker/Judge0) is offline, and local compiler runner for '${language}' is not available.`);
    }

    const { stdout, stderr, code } = await new Promise((resolve) => {
      const child = exec(cmd, { timeout: 8000 }, (error, stdout, stderr) => {
        resolve({
          stdout: stdout || "",
          stderr: stderr || (error ? error.message : ""),
          code: error ? error.code || 1 : 0,
        });
      });
      if (inputStr) {
        child.stdin.write(inputStr);
      }
      child.stdin.end();
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
      status: { id: code === 0 ? 3 : 11, description: code === 0 ? (passed ? "Accepted" : "Wrong Answer") : "Runtime Error" },
      time: 0.05,
      memory: 1024,
      exit_code: code,
      input: inputStr,
      expectedOutput: testCase.expectedOutput || "",
    });
  }

  fs.rmSync(tempDir, { recursive: true, force: true });
  return { results, totalPointsEarned, compileError };
};

// Secondary cloud fallback using Piston API (Free open-source execution engine)
const PISTON_LANG_MAP = {
  c: "c",
  cpp: "c++",
  "c++": "c++",
  java: "java",
  python: "python",
  py: "python",
  python3: "python",
  javascript: "javascript",
  js: "javascript",
  node: "javascript",
};

const runPistonFallback = async (sourceCode, language, testCases) => {
  const normLang = (language || "").toLowerCase().trim();
  const pistonLang = PISTON_LANG_MAP[normLang] || normLang;
  
  const results = [];
  let totalPointsEarned = 0;
  let compileError = null;

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    const inputStr = testCase.input || "";
    const expectedStr = (testCase.expectedOutput || "").trim();

    const response = await axios.post(
      "https://emkc.org/api/v2/piston/execute",
      {
        language: pistonLang,
        version: "*",
        files: [{ content: sourceCode }],
        stdin: inputStr
      },
      { timeout: 15000 }
    );

    const data = response.data;
    const compileOutput = data.compile?.stderr || data.compile?.stdout || "";
    const runOutput = data.run || {};
    const stdout = (runOutput.stdout || "").trim();
    const stderr = (runOutput.stderr || "").trim();
    const exitCode = runOutput.code ?? 0;

    if (compileOutput && data.compile?.code !== 0) {
      if (!compileError) compileError = compileOutput;
    }

    const passed = exitCode === 0 && stdout === expectedStr;
    const pointsEarned = passed ? testCase.points || 0 : 0;
    totalPointsEarned += pointsEarned;

    results.push({
      passed,
      pointsEarned,
      stdout: runOutput.stdout || "",
      stderr: stderr,
      compileOutput: compileOutput,
      status: {
        id: exitCode === 0 ? (passed ? 3 : 4) : 11,
        description: exitCode === 0 ? (passed ? "Accepted" : "Wrong Answer") : "Runtime Error"
      },
      time: 0.1,
      memory: 1024,
      exit_code: exitCode,
      input: inputStr,
      expectedOutput: testCase.expectedOutput || "",
    });
  }

  return { results, totalPointsEarned, compileError };
};

export const runAgainstTestCases = async (sourceCode, language, testCases) => {
  const normalizedLang = (language || "").toLowerCase().trim();
  const languageId = JUDGE0_LANGUAGE_MAP[normalizedLang];
  
  if (!languageId) {
    throw new Error(`Unsupported language: '${language}'. Supported languages: C, C++, Java, Python, JavaScript.`);
  }

  const rawApiUrl = process.env.JUDGE0_API_URL || "http://localhost:2358";
  const apiUrl = rawApiUrl.trim().replace(/\/+$/, "");
  const apiKey = process.env.JUDGE0_API_KEY;

  const judge0Headers = {
    "Content-Type": "application/json",
  };
  if (apiKey && apiKey !== "leave_blank_for_now" && apiKey.trim() !== "") {
    judge0Headers["X-RapidAPI-Key"] = apiKey.trim();
    try {
      judge0Headers["X-RapidAPI-Host"] = new URL(apiUrl).hostname;
    } catch (_) {}
  }

  // 1. Submit batch request
  const submissions = (testCases || []).map((tc) => ({
    source_code: Buffer.from(sourceCode || "").toString("base64"),
    language_id: languageId,
    stdin: Buffer.from(tc.input || "").toString("base64"),
    expected_output: Buffer.from(tc.expectedOutput || "").toString("base64"),
  }));

  if (submissions.length === 0) {
    return { results: [], totalPointsEarned: 0, compileError: null };
  }

  let postRes;
  let activeApiUrl = apiUrl;

  try {
    postRes = await axios.post(
      `${apiUrl}/submissions/batch?base64_encoded=true`,
      { submissions },
      { headers: judge0Headers, timeout: 12000 }
    );
  } catch (err) {
    // If localhost failed, try 127.0.0.1 explicit IPv4 fallback
    if (apiUrl.includes("localhost")) {
      const fallbackUrl = apiUrl.replace("localhost", "127.0.0.1");
      try {
        postRes = await axios.post(
          `${fallbackUrl}/submissions/batch?base64_encoded=true`,
          { submissions },
          { headers: judge0Headers, timeout: 12000 }
        );
        activeApiUrl = fallbackUrl;
      } catch (err2) {
        console.warn("Judge0 submission failed on localhost/127.0.0.1. Trying Piston Cloud API...");
        try {
          return await runPistonFallback(sourceCode, language, testCases);
        } catch (pistonErr) {
          console.warn("Piston API failed, trying local process fallback...", pistonErr.message);
          return await runLocallyFallback(sourceCode, language, testCases);
        }
      }
    } else {
      console.warn("Judge0 API failed/unreachable. Trying Piston Cloud API...", err.message);
      try {
        return await runPistonFallback(sourceCode, language, testCases);
      } catch (pistonErr) {
        console.warn("Piston API failed, trying local process fallback...", pistonErr.message);
        return await runLocallyFallback(sourceCode, language, testCases);
      }
    }
  }

  const rawBatchData = postRes.data;
  const submissionTokens = Array.isArray(rawBatchData)
    ? rawBatchData.map((s) => s.token)
    : (rawBatchData?.submissions || []).map((s) => s.token);

  if (!submissionTokens || submissionTokens.length === 0) {
    throw new Error("Failed to retrieve execution tokens from Judge0 service.");
  }

  // 2. Poll until all submissions are done
  let allFinished = false;
  let pollResults = [];
  let attempts = 0;
  const maxAttempts = 30; // max 30 seconds

  while (!allFinished && attempts < maxAttempts) {
    try {
      const getRes = await axios.get(`${activeApiUrl}/submissions/batch`, {
        params: {
          tokens: submissionTokens.join(","),
          base64_encoded: "true",
          fields: "status_id,status,stdout,stderr,compile_output,time,memory,exit_code",
        },
        headers: judge0Headers,
        timeout: 15000
      });

      const subs = Array.isArray(getRes.data)
        ? getRes.data
        : (getRes.data?.submissions || []);
        
      pollResults = subs;

      // Status ID 1 is In Queue, 2 is Processing. If all > 2, finished.
      allFinished = subs.length > 0 && subs.every(
        (sub) => sub && ((sub.status_id && sub.status_id > 2) || (sub.status && sub.status.id > 2))
      );

      if (!allFinished) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        attempts++;
      }
    } catch (err) {
      console.warn(`Polling Judge0 attempt ${attempts + 1} transient error:`, err.message);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      attempts++;
    }
  }

  if (!allFinished && pollResults.length === 0) {
    throw new Error("Code execution request timed out. Please try running again.");
  }

  // 3. Process results and calculate scores
  const results = [];
  let totalPointsEarned = 0;
  let compileError = null;

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    const sub = pollResults[i];

    if (!sub) {
      results.push({
        passed: false,
        pointsEarned: 0,
        status: { id: 13, description: "Internal Error" },
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
      status: sub.status || { id: sub.status_id, description: "Unknown" },
      time: sub.time ? parseFloat(sub.time) : 0,
      memory: sub.memory || 0,
      exit_code: sub.exit_code,
      input: testCase.input || "",
      expectedOutput: testCase.expectedOutput || "",
    });
  }

  return { results, totalPointsEarned, compileError };
};