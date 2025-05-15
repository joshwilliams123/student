import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./css/styles.css";

function TestViewer() {
  const [tests, setTests] = useState([]);
  const [allClasses, setAllClasses] = useState([]);
  const [error, setError] = useState("");

  const getClassIdByName = (name) => {
    const found = allClasses.find(
      (cls) => cls.name === name || cls.className === name
    );
    return found ? found.id : null;
  };

  const getClassNameById = (id) => {
    const found = allClasses.find((cls) => cls.id === id);
    return found ? found.name || found.className : "Unknown Class";
  };

  useEffect(() => {
    const fetchTests = async () => {
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
      } catch (error) {
        console.error("Error fetching tests: ", error);
        setError("Failed to fetch tests. Please try again later.");
      }
    };

    fetchTests();
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
                <li key={test.id} className="list-group-item">
                  <h5>{test.testName}</h5>
                  <p>
                    <strong>Class:</strong>{" "}
                    {getClassNameById(test.publishedTo[0])}
                  </p>
                  <p>
                    <strong>Questions:</strong> {test.questions?.length ?? 0}
                  </p>
                  <Link
                    to={`/take-test/${test.id}`}
                    className="btn btn-primary btn-sm"
                  >
                    Take Test
                  </Link>
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
