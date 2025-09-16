// Students can sign up here using email/password or Google sign-in. After signing up, they are redirected to the test viewer.

import React, { useState } from "react";
import { createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, db, googleProvider } from "./firebase";
import { setDoc, doc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./css/styles.css";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        classes: []
      });

      navigate("/test-viewer");
    } catch (err) {
      if (err.code === "auth/weak-password") {
        setError("Password must be at least 6 characters.");
      } else if (err.code === "auth/email-already-in-use") {
        setError("Email already in use. Try logging in.");
      } else {
        setError(err.message);
      }
    }
  };

  const handleGoogleSignup = async () => {
    setError("");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        classes: []
      }, { merge: true }); 

      navigate("/test-viewer");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <header>
        <div className="jumbotron jumbotron-fluid bg-light">
          <div className="container text-center">
            <h1>Sign Up</h1>
          </div>
        </div>
      </header>
      <main>
        <div className="container">
          <div className="text-center mb-4">
            <h2>Create Your Account</h2>
          </div>
          {error && <p className="text-danger text-center">{error}</p>}
          <div className="w-50 mx-auto">
            <form onSubmit={handleSignup}>
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
                  Sign Up
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
                  onClick={handleGoogleSignup}
                >
                  <img
                    src="/google.png"
                    alt="Google logo"
                    style={{ width: "24px", height: "24px" }}
                  />
                  Sign Up With Google
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Signup;
