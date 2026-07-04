import axios from "axios";

const JUDGE0_LANGUAGE_MAP = {
  c: 50,      // C (GCC 9.2.0)
  cpp: 54,    // C++ (GCC 9.2.0)
  java: 62,   // Java (OpenJDK 13.0.1)
  python: 71, // Python (3.8.1)
};

const decodeBase64 = (str) => {
  if (!str) return "";
  return Buffer.from(str, "base64").toString("utf8");
};

export const runAgainstTestCases = async (sourceCode, language, testCases) => {
  const languageId = JUDGE0_LANGUAGE_MAP[language];
  if (!languageId) {
    throw new Error(`Unsupported language: ${language}`);
  }

  const apiUrl = process.env.JUDGE0_API_URL || "http://localhost:2358";
  const apiKey = process.env.JUDGE0_API_KEY;

  const judge0Headers = {
    "Content-Type": "application/json",
  };
  if (apiKey && apiKey !== "leave_blank_for_now" && apiKey.trim() !== "") {
    judge0Headers["X-RapidAPI-Key"] = apiKey;
    try {
      judge0Headers["X-RapidAPI-Host"] = new URL(apiUrl).hostname;
    } catch (_) {}
  }

  // 1. Submit batch request
  const submissions = testCases.map((tc) => ({
    source_code: Buffer.from(sourceCode).toString("base64"),
    language_id: languageId,
    stdin: Buffer.from(tc.input || "").toString("base64"),
    expected_output: Buffer.from(tc.expectedOutput || "").toString("base64"),
  }));

  let postRes;
  try {
    postRes = await axios.post(
      `${apiUrl}/submissions/batch?base64_encoded=true`,
      { submissions },
      { headers: judge0Headers, timeout: 10000 }
    );
  } catch (err) {
    console.error("Failed to submit code to Judge0:", err.message);
    throw new Error("Code execution service is currently offline or unreachable. Please verify if Docker and Judge0 CE are running.");
  }

  const submissionTokens = postRes.data.map((s) => s.token);
  if (!submissionTokens || submissionTokens.length === 0) {
    throw new Error("Failed to retrieve tokens from code execution service.");
  }

  // 2. Poll until all submissions are done
  let allFinished = false;
  let pollResults = [];
  let attempts = 0;
  const maxAttempts = 30; // max 30 seconds

  while (!allFinished && attempts < maxAttempts) {
    try {
      const getRes = await axios.get(`${apiUrl}/submissions/batch`, {
        params: {
          tokens: submissionTokens.join(","),
          base64_encoded: "true",
          fields: "status_id,status,stdout,stderr,compile_output,time,memory,exit_code",
        },
        headers: judge0Headers,
        timeout: 10000
      });

      const subs = getRes.data.submissions;
      pollResults = subs;

      // Status ID 1 is In Queue, 2 is Processing. If any is <= 2, it is not finished.
      allFinished = subs.every(
        (sub) => sub.status_id > 2 || (sub.status && sub.status.id > 2)
      );

      if (!allFinished) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        attempts++;
      }
    } catch (err) {
      console.error("Error polling Judge0 status:", err.message);
      throw new Error("Error retrieving code execution status from server.");
    }
  }

  if (!allFinished) {
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
      compileError = decodedCompileOutput || "Compilation Error";
    }

    // Accepted (ID 3)
    const passed = sub.status_id === 3 || (sub.status && sub.status.id === 3);
    const pointsEarned = passed ? testCase.points : 0;
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