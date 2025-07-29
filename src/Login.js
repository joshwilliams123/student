import React, { useState, useEffect } from "react";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth, db } from "./firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./css/styles.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [className, setClassName] = useState(""); 
  const [classOptions, setClassOptions] = useState([]);
  const [error, setError] = useState("");
  const [resetMessage, setResetMessage] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "classes"));
        const classes = querySnapshot.docs.map(doc => doc.data().className || doc.data().name);
        setClassOptions(classes);
      } catch (err) {
        console.error("Error fetching classes:", err);
      }
    };

    fetchClasses();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (userDoc.exists()) {
        const storedClassName = userDoc.data().className;

        if (className === storedClassName) {
          localStorage.setItem("studentClassName", className);
          navigate("/test-viewer");
        } else {
          setError("Incorrect class name. Please try again.");
        }
      } else {
        setError("Invalid user credentials.");
      }
    } catch (err) {
      setError("Invalid login credentials. Please try again.");
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

              <div className="mb-3 mt-4">
                <label className="form-label">Select Class</label>
                <select
                  className="form-control"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  required
                >
                  <option value="">-- Choose a Class --</option>
                  {classOptions.map((cls, idx) => (
                    <option key={idx} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>

              <div className="text-center">
                <button type="submit" className="btn btn-primary">Login</button>
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
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;