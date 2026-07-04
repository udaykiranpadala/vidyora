// Generates a short, human-typeable code like "X7K9PQ" for students to join an exam.
// Avoids visually-confusing characters (0/O, 1/I/L) so students can type it accurately.
const SAFE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export const generateAccessCode = (length = 6) => {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += SAFE_CHARS[Math.floor(Math.random() * SAFE_CHARS.length)];
  }
  return code;
};
