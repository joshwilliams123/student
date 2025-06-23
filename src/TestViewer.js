import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getDoc, doc } from "firebase/firestore";
import { Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./css/styles.css";

function TestViewer() {
  const [tests, setTests] = useState([]);
  const [allClasses, setAllClasses] = useState([]);
  const [error, setError] = useState("");
  const [scores, setScores] = useState({});

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
        }
      } catch (error) {
        console.error("Error fetching tests: ", error);
        setError("Failed to fetch tests. Please try again later.");
      }
    };

    fetchTestsAndScores();
  }, []);

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

        {tests.length === 0 && !error ? (
          <p className="text-center">No tests found for your class.</p>
        ) : (
          <div>
            <h3>Available Tests</h3>
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
      </main>
    </div>
  );
}

export default TestViewer;
