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
  const [allClasses, setAllClasses] = useState([]); // eslint-disable-next-line
  const [error, setError] = useState("");
  const [scores, setScores] = useState({});
  const [showClassSelect, setShowClassSelect] = useState(false);
  const [showScheduleEdit, setShowScheduleEdit] = useState(false);
  const [userClasses, setUserClasses] = useState([]);
  const [scheduleClasses, setScheduleClasses] = useState([]);
  const [scheduleOptions, setScheduleOptions] = useState([]);
  const [selectedClass, setSelectedClass] = useState(localStorage.getItem("studentClassName") || "");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) {
          setError("User not signed in.");
          return;
        }

        const classSnapshot = await getDocs(collection(db, "classes"));
        const classList = classSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setAllClasses(classList);
        setScheduleOptions(classList.map(c => c.className || c.name));

        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const classes = userDoc.data().classes || [];
          setUserClasses(classes);
          setScheduleClasses(classes);

          if (classes.length === 0) return;

          let storedClass = localStorage.getItem("studentClassName");
          if (!storedClass || !classes.includes(storedClass)) {
            storedClass = classes[0];
            localStorage.setItem("studentClassName", storedClass);
            setSelectedClass(storedClass);
          }

          await fetchTestsForClass(storedClass, classList, user.uid);
        }
      } catch (err) {
        console.error("Error fetching tests: ", err);
        setError("Failed to fetch tests. Please try again later.");
      }
    };

    if (!showClassSelect && !showScheduleEdit) {
      fetchData();
    }
  }, [showClassSelect, showScheduleEdit]);

  const fetchTestsForClass = async (className, classList, userId) => {
    try {
      const classId = classList.find(
        (cls) => cls.name === className || cls.className === className
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

      const scoresObj = {};
      for (const test of testList) {
        const scoreDoc = await getDoc(doc(db, "testScores", `${userId}_${test.id}`));
        if (scoreDoc.exists()) {
          scoresObj[test.id] = scoreDoc.data().score;
        }
      }
      setScores(scoresObj);
    } catch (err) {
      console.error("Error fetching tests for class: ", err);
      setError("Failed to load tests for this class.");
    }
  };

  const handleLogout = async () => {
    const auth = getAuth();
    await signOut(auth);
    localStorage.removeItem("studentClassName");
    navigate("/");
  };

  const handleChangeClass = () => {
    setShowClassSelect(true);
  };

  const handleSelectClass = async () => {
    if (selectedClass) {
      localStorage.setItem("studentClassName", selectedClass);
      setShowClassSelect(false);
      setError("");

      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        await fetchTestsForClass(selectedClass, allClasses, user.uid);
      }
    }
  };

  const handleScheduleChange = (cls) => {
    setScheduleClasses((prev) =>
      prev.includes(cls)
        ? prev.filter((c) => c !== cls)
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

      if (scheduleClasses.length > 0) {
        localStorage.setItem("studentClassName", scheduleClasses[0]);
        setSelectedClass(scheduleClasses[0]);
      } else {
        localStorage.removeItem("studentClassName");
        setSelectedClass("");
      }
    }
  };

  if (userClasses.length === 0 && !showScheduleEdit) {
    return (
      <div className="container text-center mt-4">
        <h4>You are currently not enrolled in any classes.</h4>
        <p>Please select classes to take tests for.</p>
        <button className="btn btn-primary" onClick={() => setShowScheduleEdit(true)}>
          Select Classes
        </button>
        <div className="mt-3">
          <button className="btn btn-danger" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    );
  }

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
            {tests.length === 0 ? (
              <p className="text-center">No tests found for your class.</p>
            ) : (
              <div>
                <h3>
                  Available Tests for{" "}
                  <span className="text-primary">{selectedClass}</span>
                </h3>
                <ul className="list-group">
                  {tests.map((test) => (
                    <li
                      key={test.id}
                      className="list-group-item d-flex justify-content-between align-items-center"
                    >
                      <div>
                        <h5 className="mb-1">{test.testName}</h5>
                        <p className="mb-1">
                          <strong>Questions:</strong>{" "}
                          {test.questions?.length ?? 0}
                        </p>
                      </div>
                      <div>
                        {scores[test.id] !== undefined ? (
                          <span className="badge bg-success fs-6" style={{ padding: "0.6em 1em" }}>
                            Scored {scores[test.id]}/{test.questions?.length ?? 0}
                          </span>
                        ) : (
                          <Link
                            to={`/take-test/${test.id}`}
                            className="btn btn-primary btn-sm"
                            style={{ padding: "0.6em 1.2em", fontSize: "1rem" }}
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
              <button className="btn btn-info" onClick={() => setShowScheduleEdit(true)}>
                Edit Class Schedule
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
