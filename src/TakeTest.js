import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "./firebase";
import { getAuth } from "firebase/auth";
import { setDoc, getDoc, doc, collection, getDocs } from "firebase/firestore";
import "bootstrap/dist/css/bootstrap.min.css";
import "./css/styles.css";
import 'katex/dist/katex.min.css';
import { BlockMath, InlineMath } from 'react-katex';

function TakeTest() {
  const { testId } = useParams();
  const [test, setTest] = useState(null);
  const [error, setError] = useState("");
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [alreadyTaken, setAlreadyTaken] = useState(false);

  const [questionTimes, setQuestionTimes] = useState([]);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [classId, setClassId] = useState("");

  useEffect(() => {
    const fetchTest = async () => {
      try {
        const docRef = doc(db, "tests", testId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setTest(docSnap.data());
        } else {
          setError("Test not found.");
        }
      } catch (error) {
        console.error("Error fetching test:", error);
        setError("An error occurred while fetching the test.");
      }
    };

    const checkIfTaken = async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        setError("User not authenticated.");
        setLoading(false);
        return;
      }
      const scoreDoc = await getDoc(doc(db, "testScores", `${user.uid}_${testId}`));
      if (scoreDoc.exists()) {
        setAlreadyTaken(true);
      }
      setLoading(false);
    };

    const fetchClassId = async () => {
      const storedClassName = localStorage.getItem("studentClassName");
      if (!storedClassName) return;
      try {
        const classSnapshot = await getDocs(collection(db, "classes"));
        const classDoc = classSnapshot.docs.find(
          (doc) =>
            doc.data().className === storedClassName ||
            doc.data().name === storedClassName
        );
        if (classDoc) {
          setClassId(classDoc.id);
        }
      } catch (err) {
        console.error("Error fetching class ID:", err);
      }
    };

    fetchTest();
    checkIfTaken();
    fetchClassId();
  }, [testId]);

  useEffect(() => {
    if (test && test.questions) {
      setQuestionTimes(Array(test.questions.length).fill(0));
      setQuestionStartTime(Date.now());
    }
  }, [test]);

  const updateTimeForCurrentQuestion = () => {
    const now = Date.now();
    setQuestionTimes((prev) => {
      const updated = [...prev];
      updated[currentQuestion] += now - questionStartTime;
      return updated;
    });
    setQuestionStartTime(now);
  };

  const handleAnswerSelect = (questionIndex, selectedOption) => {
    setAnswers((prev) => ({
      ...prev,
      [questionIndex]: selectedOption,
    }));
  };

  const handleSubmit = async () => {
    if (!test || !test.questions) return;

    const now = Date.now();
    const updatedTimes = [...questionTimes];
    updatedTimes[currentQuestion] += now - questionStartTime;

    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      setError("User not authenticated.");
      return;
    }
    const userId = user.uid;
    const userEmail = user.email || "";

    let totalCorrect = 0;
    test.questions.forEach((q, index) => {
      const correctIndex = q.correctAnswer.toLowerCase().charCodeAt(0) - 97;
      if (answers[index] === correctIndex) {
        totalCorrect++;
      }
    });

    setScore(totalCorrect);
    setSubmitted(true);

    let className = "";
    if (test.className) {
      className = test.className;
    } else if (test.name) {
      className = test.name;
    } else {
      className = localStorage.getItem("studentClassName") || "";
    }

    try {
      await setDoc(
        doc(db, "testScores", `${userId}_${testId}`),
        {
          userId,
          userEmail,
          testId,
          testTitle: test.testName || "",
          score: totalCorrect,
          timestamp: Date.now(),
          questionTimes: updatedTimes,
          className: className,
          classId: classId, 
        }
      );
    } catch (err) {
      console.error("Error saving score:", err);
    }
  };

  const numCompleted = Object.keys(answers).length;
  const totalQuestions = test?.questions?.length || 0;
  const progressPercent = totalQuestions > 0 ? (numCompleted / totalQuestions) * 100 : 0;

  const handleBackToTestViewer = () => {
    navigate("/test-viewer");
  };

  const handleNext = () => {
    updateTimeForCurrentQuestion();
    if (currentQuestion < test.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrev = () => {
    updateTimeForCurrentQuestion();
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleJumpToQuestion = (index) => {
    updateTimeForCurrentQuestion();
    setCurrentQuestion(index);
  };

  if (loading) {
    return <div className="container text-center mt-5">Loading...</div>;
  }

  if (alreadyTaken) {
    return (
      <div className="container text-center mt-5">
        <h2>You have already taken this test.</h2>
        <button className="btn btn-primary mt-3" onClick={() => navigate("/test-viewer")}>
          Return to Test Viewer Page
        </button>
      </div>
    );
  }

  return (
    <div className="d-flex" style={{ minHeight: "100vh" }}>
      {test && (
        <div className="sidebar-questions p-3">
          <h5 className="mb-3">Questions</h5>
          <ul className="list-unstyled">
            {test.questions.map((q, idx) => {
              const answered = typeof answers[idx] !== "undefined";
              return (
                <li
                  key={idx}
                  className={`sidebar-q-item mb-2 ${currentQuestion === idx ? "active" : ""}`}
                  style={{ cursor: "pointer" }}
                  onClick={() => handleJumpToQuestion(idx)}
                >
                  <span className="sidebar-q-num">{idx + 1}</span>
                  <span
                    className={`sidebar-q-status ms-2 ${answered ? "answered" : "not-answered"
                      }`}
                  >
                    {answered ? "Answered" : "Not Answered"}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="container">
        <h1 className="text-center my-4">Take Test</h1>
        {error && <p className="text-danger text-center">{error}</p>}
        {!test ? (
          <p className="text-center">Loading...</p>
        ) : (
          <div>
            <h3 className="mb-4">{test.testName}</h3>

            <div className="mb-4">
              <p>
                Progress: {Object.keys(answers).length} / {test.questions.length} completed
              </p>
              <div className="progress">
                <div
                  className="progress-bar"
                  role="progressbar"
                  style={{ width: `${progressPercent}%` }}
                  aria-valuenow={progressPercent}
                  aria-valuemin="0"
                  aria-valuemax="100"
                >
                  {Math.round(progressPercent)}%
                </div>
              </div>
            </div>

            <div className="mb-4 border rounded p-3">
              <h5>{test.questions[currentQuestion].title}</h5>
              <BlockMath math={test.questions[currentQuestion].text} />

              {test.questions[currentQuestion].imageUrl && (
                <div className="mb-3 text-center">
                  <img
                    src={test.questions[currentQuestion].imageUrl}
                    alt={`Question ${currentQuestion + 1}`}
                    style={{ maxWidth: "100%", height: "auto" }}
                  />
                </div>
              )}

              {test.questions[currentQuestion].choices.map((choice, i) => (
                <div key={i} className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    name={`question-${currentQuestion}`}
                    id={`q${currentQuestion}-opt${i}`}
                    checked={answers[currentQuestion] === i}
                    onChange={() => handleAnswerSelect(currentQuestion, i)}
                    disabled={submitted}
                  />
                  <label className="form-check-label" htmlFor={`q${currentQuestion}-opt${i}`}>
                    <InlineMath math={choice} />
                  </label>
                </div>
              ))}
            </div>

            <div className="d-flex justify-content-between">
              <button
                className="btn btn-secondary"
                onClick={handlePrev}
                disabled={currentQuestion === 0}
              >
                Previous
              </button>
              {currentQuestion < test.questions.length - 1 ? (
                <button
                  className="btn btn-secondary"
                  onClick={handleNext}
                  disabled={typeof answers[currentQuestion] === "undefined"}
                >
                  Next
                </button>
              ) : (
                !submitted && (
                  <button
                    className="btn btn-success"
                    onClick={handleSubmit}
                    disabled={Object.keys(answers).length !== test.questions.length}
                  >
                    Submit and Score
                  </button>
                )
              )}
            </div>

            {submitted && (
              <div className="text-center mt-4">
                <h4>
                  You scored {score} out of {test.questions.length}
                </h4>
              </div>
            )}

            <div className="text-center mt-4">
              <button
                className="btn btn-primary"
                onClick={handleBackToTestViewer}
              >
                Return to Test Viewer Page
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TakeTest;