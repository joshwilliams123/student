import React, { useState } from "react";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPopup
} from "firebase/auth";
import { auth, db, googleProvider } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./css/styles.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userClasses, setUserClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [error, setError] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [showClassSelect, setShowClassSelect] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await handlePostLogin(userCredential.user);
    } catch (err) {
      setError("Invalid login credentials. Please try again.");
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          email: user.email,
          classes: []
        });
      }

      await handlePostLogin(user);
    } catch (err) {
      console.error("Google login failed:", err);
      setError("Google sign-in failed. Please try again.");
    }
  };

  const handlePostLogin = async (user) => {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
      const classes = userDoc.data().classes || [];
      setUserClasses(classes);

      if (classes.length === 0) {
        navigate("/test-viewer");
      } else {
        setShowClassSelect(true);
      }
    } else {
      setError("User data not found.");
    }
  };

  const handleForgotPassword = async () => {
    setResetMessage("");
    setError("");
    if (!email) {
      setError("Please enter your email to reset your password.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setResetMessage("Password reset email sent! Please check your inbox.");
    } catch (err) {
      setError("Failed to send password reset email. Please check your email address.");
    }
  };

  const handleClassSelect = () => {
    if (selectedClass) {
      localStorage.setItem("studentClassName", selectedClass);
      navigate("/test-viewer");
    }
  };

  return (
    <div>
      <header>
        <div className="jumbotron jumbotron-fluid bg-light">
          <div className="container text-center">
            <h1>Login</h1>
          </div>
        </div>
      </header>
      <main>
        <div className="container">
          {error && <p className="text-danger text-center">{error}</p>}
          {resetMessage && <p className="text-success text-center">{resetMessage}</p>}
          <div className="w-50 mx-auto">
            {!showClassSelect ? (
              <form onSubmit={handleLogin}>
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="d-flex justify-content-center gap-3 mt-3">
                  <button
                    type="submit"
                    className="btn btn-primary flex-fill"
                    style={{ maxWidth: "220px" }}
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    className="btn d-flex align-items-center justify-content-center flex-fill"
                    style={{
                      backgroundColor: "#fff",
                      color: "#000",
                      border: "1px solid #ccc",
                      gap: "8px",
                      maxWidth: "220px"
                    }}
                    onClick={handleGoogleLogin}
                  >
                    <img
                      src="/google.png"
                      alt="Google logo"
                      style={{ width: "24px", height: "24px" }}
                    />
                    Log In with Google
                  </button>
                </div>

                <div style={{ height: "16px" }}></div>
                <div className="mb-3 text-center">
                  <small className="text-muted">
                    Forgot your password? Enter your email above and click below to receive a reset link.
                  </small>
                </div>
                <div className="text-center">
                  <button
                    type="button"
                    className="btn btn-outline-danger"
                    onClick={handleForgotPassword}
                  >
                    Forgot Password?
                  </button>
                </div>
              </form>
            ) : (
              <div className="mb-3 mt-4">
                <label className="form-label">Select Class for Test</label>
                <select
                  className="form-control"
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  required
                >
                  <option value="">-- Choose a Class --</option>
                  {userClasses.map((cls, idx) => (
                    <option key={idx} value={cls}>{cls}</option>
                  ))}
                </select>
                <div className="text-center mt-3">
                  <button
                    className="btn btn-success"
                    onClick={handleClassSelect}
                    disabled={!selectedClass}
                  >
                    Proceed
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
