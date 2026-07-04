import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function GoogleSignInButton({ onError, type = "standard", shape = "rectangular" }) {
  const { login } = useAuth();
  const navigate = useNavigate();

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (!clientId) {
    return null;
  }

  const handleSuccess = async (credentialResponse) => {
    try {
      const res = await api.post("/auth/google", {
        credential: credentialResponse.credential,
      });
      login(res.data.organizer, res.data.token);
      navigate("/dashboard");
    } catch (err) {
      onError?.(err.response?.data?.message || "Google sign-in failed");
    }
  };

  return (
    <div className="flex justify-center">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => onError?.("Google sign-in was cancelled or failed")}
        theme="outline"
        size="large"
        text="signin_with"
        shape={shape}
        type={type}
      />
    </div>
  );
}
