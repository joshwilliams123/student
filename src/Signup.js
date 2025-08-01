import React, { useState, useEffect } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "./firebase";
import { setDoc, doc, collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./css/styles.css";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [classOptions, setClassOptions] = useState([]);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

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

  const handleClassChange = (cls) => {
    setSelectedClasses(prev =>
      prev.includes(cls)
        ? prev.filter(c => c !== cls)
        : [...prev, cls]
    );
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        classes: selectedClasses,
      });
      setSuccessMessage("Signup successful! Redirecting to login page...");
      setEmail("");
      setPassword("");
      setSelectedClasses([]);
      setTimeout(() => navigate("/"), 2000);
    } catch (err) {
      if (err.code === "auth/weak-password") {
        setError("The password should be at least 6 characters.");
      } else if (err.code === "auth/email-already-in-use") {
        setError("This email is already in use. Try logging in.");
      } else {
        setError(err.message);
      }
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
              <div className="mb-3">
                <label className="form-label">Select All Classes in Your Schedule</label>
                <div>
                  {classOptions.map((cls, idx) => (
                    <div className="form-check" key={idx}>
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={`class-${idx}`}
                        value={cls}
                        checked={selectedClasses.includes(cls)}
                        onChange={() => handleClassChange(cls)}
                      />
                      <label className="form-check-label" htmlFor={`class-${idx}`}>
                        {cls}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="text-center">
                <button type="submit" className="btn btn-primary">Sign Up</button>
              </div>
            </form>
          </div>
        </div>
      </main>
      {successMessage && (
        <div className="alert alert-success fixed-bottom m-3" style={{ zIndex: 9999 }}>
          <p className="text-center mb-0">{successMessage}</p>
        </div>
      )}
    </div>
  );
};

export default Signup;
