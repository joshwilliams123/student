import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import {
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  doc as firestoreDoc,
} from "firebase/firestore";
import { getAuth, signOut } from "firebase/auth";
import { getDoc, doc } from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./css/styles.css";

function TestViewer() {
  const [tests, setTests] = useState([]);
  const [allClasses, setAllClasses] = useState([]);
  const [error, setError] = useState("");
  const [scores, setScores] = useState({});
  const [showClassSelect, setShowClassSelect] = useState(false);
  const [showScheduleEdit, setShowScheduleEdit] = useState(false);
  const [userClasses, setUserClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(localStorage.getItem("studentClassName") || "");
  const [scheduleClasses, setScheduleClasses] = useState([]);
  const [scheduleOptions, setScheduleOptions] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTestsAndScores = async () => {
      try {
        const storedClassName = localStorage.getItem("studentClassName");
        if (!storedClassName) {
          setError("Class name not found. Please log in again.");
          return;
        }

        const classSnapshot = await getDocs(collection(db, "classes"));
        const classList = classSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setAllClasses(classList);

        const classId = classList.find(
          (cls) =>
            cls.name === storedClassName ||
            cls.className === storedClassName
        )?.id;

        if (!classId) {
          setError("No class found with your class name.");
          return;
        }

        const testQuery = query(
          collection(db, "tests"),
          where("publishedTo", "array-contains", classId)
        );
        const testSnapshot = await getDocs(testQuery);
        const testList = testSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setTests(testList);

        const auth = getAuth();
        const user = auth.currentUser;
        if (user) {
          const scoresObj = {};
          for (const test of testList) {
            const scoreDoc = await getDoc(doc(db, "testScores", `${user.uid}_${test.id}`));
            if (scoreDoc.exists()) {
              scoresObj[test.id] = scoreDoc.data().score;
            }
          }
          setScores(scoresObj);

          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            setUserClasses(userDoc.data().classes || []);
            setScheduleClasses(userDoc.data().classes || []);
            setScheduleOptions(classList.map(c => c.className || c.name));
          }
        }
      } catch (error) {
        console.error("Error fetching tests: ", error);
        setError("Failed to fetch tests. Please try again later.");
      }
    };

    if (!showClassSelect && !showScheduleEdit) {
      fetchTestsAndScores();
    }
  }, [showClassSelect, selectedClass, showScheduleEdit]);

  const handleLogout = async () => {
    const auth = getAuth();
    await signOut(auth);
    localStorage.removeItem("studentClassName");
    navigate("/");
  };

  const handleChangeClass = () => {
    setShowClassSelect(true);
  };

  const handleSelectClass = () => {
    if (selectedClass) {
      localStorage.setItem("studentClassName", selectedClass);
      setShowClassSelect(false);
      setError("");
    }
  };

  const handleEditSchedule = () => {
    setShowScheduleEdit(true);
  };

  const handleScheduleChange = (cls) => {
    setScheduleClasses(prev =>
      prev.includes(cls)
        ? prev.filter(c => c !== cls)
        : [...prev, cls]
    );
  };

  const handleSaveSchedule = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      await updateDoc(firestoreDoc(db, "users", user.uid), {
        classes: scheduleClasses,
      });
      setUserClasses(scheduleClasses);
      setShowScheduleEdit(false);
      if (!scheduleClasses.includes(selectedClass)) {
        setSelectedClass("");
        localStorage.removeItem("studentClassName");
        setShowClassSelect(true);
      }
    }
  };

  return (
    <div className="container-fluid">
      <header>
        <div className="jumbotron jumbotron-fluid bg-light">
          <div className="container text-center">
            <h1>Test Viewer</h1>
          </div>
        </div>
      </header>

      <main className="container">
        {error && <p className="text-danger text-center">{error}</p>}

        {showScheduleEdit ? (
          <div className="w-50 mx-auto mt-4">
            <label className="form-label">Edit Your Class Schedule</label>
            <div>
              {scheduleOptions.map((cls, idx) => (
                <div className="form-check" key={idx}>
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id={`schedule-class-${idx}`}
                    value={cls}
                    checked={scheduleClasses.includes(cls)}
                    onChange={() => handleScheduleChange(cls)}
                  />
                  <label className="form-check-label" htmlFor={`schedule-class-${idx}`}>
                    {cls}
                  </label>
                </div>
              ))}
            </div>
            <div className="text-center mt-3">
              <button
                className="btn btn-success me-2"
                onClick={handleSaveSchedule}
                disabled={scheduleClasses.length === 0}
              >
                Save Schedule
              </button>
              <button
                className="btn btn-outline-secondary"
                onClick={() => setShowScheduleEdit(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : showClassSelect ? (
          <div className="w-50 mx-auto mt-4">
            <label className="form-label">Select Class</label>
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
                onClick={handleSelectClass}
                disabled={!selectedClass}
              >
                Confirm Class
              </button>
            </div>
          </div>
        ) : (
          <>
            {tests.length === 0 && !error ? (
              <p className="text-center">No tests found for your class.</p>
            ) : (
              <div>
                <h3>
                  Available Tests for{" "}
                  <span className="text-primary">
                    {selectedClass}
                  </span>
                </h3>
                <ul className="list-group">
                  {tests.map((test) => (
                    <li key={test.id} className="list-group-item d-flex justify-content-between align-items-center">
                      <div>
                        <h5 className="mb-1">{test.testName}</h5>
                        <p className="mb-1">
                          <strong>Questions:</strong> {test.questions?.length ?? 0}
                        </p>
                      </div>
                      <div>
                        {scores[test.id] !== undefined ? (
                          <span className="badge bg-success fs-6" style={{ fontSize: "1rem", fontFamily: "inherit", padding: "0.6em 1em" }}>
                            Scored {scores[test.id]}/{test.questions?.length ?? 0}
                          </span>
                        ) : (
                          <Link
                            to={`/take-test/${test.id}`}
                            className="btn btn-primary btn-sm"
                            style={{ fontFamily: "inherit", fontWeight: 500, padding: "0.6em 1.2em", fontSize: "1rem" }}
                          >
                            Take Test
                          </Link>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="d-flex justify-content-center gap-3 mt-4">
              <button className="btn btn-secondary" onClick={handleChangeClass}>
                Change Class
              </button>
              <button className="btn btn-info" onClick={handleEditSchedule}>
                Change Class Schedule
              </button>
              <button className="btn btn-danger" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default TestViewer;
