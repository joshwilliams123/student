import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";
import "bootstrap/dist/css/bootstrap.min.css";
import "./css/styles.css";

function TakeTest() {
  const { testId } = useParams();
  const [test, setTest] = useState(null);
  const [error, setError] = useState("");
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const navigate = useNavigate();  

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

    fetchTest();
  }, [testId]);

  const handleAnswerSelect = (questionIndex, selectedOption) => {
    setAnswers((prev) => ({
      ...prev,
      [questionIndex]: selectedOption,
    }));
  };

  const handleSubmit = () => {
    if (!test || !test.questions) return;

    let totalCorrect = 0;
    test.questions.forEach((q, index) => {
      const correctIndex = q.correctAnswer.toLowerCase().charCodeAt(0) - 97; 
      if (answers[index] === correctIndex) {
        totalCorrect++;
      }
    });

    setScore(totalCorrect);
    setSubmitted(true);
  };

  const numCompleted = Object.keys(answers).length;
  const totalQuestions = test?.questions?.length || 0;
  const progressPercent = totalQuestions > 0 ? (numCompleted / totalQuestions) * 100 : 0;

  const handleBackToTestViewer = () => {
    navigate("/test-viewer"); 
  };

  return (
    <div className="container">
      <h1 className="text-center my-4">Take Test</h1>
      {error && <p className="text-danger text-center">{error}</p>}
      {!test ? (
        <p className="text-center">Loading...</p>
      ) : (
        <div>
          <h3 className="mb-4">{test.testName}</h3>

          {/* Progress Bar */}
          <div className="mb-4">
            <p>
              Progress: {numCompleted} / {totalQuestions} completed
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

          {test.questions.map((q, index) => (
            <div key={index} className="mb-4 border rounded p-3">
              <h5>{q.title}</h5>
              <p>{q.text}</p>

              {q.imageUrl && (
                <div className="mb-3 text-center">
                  <img
                    src={q.imageUrl}
                    alt={`Question ${index + 1}`}
                    style={{ maxWidth: "100%", height: "auto" }}
                  />
                </div>
              )}

              {q.choices.map((choice, i) => (
                <div key={i} className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    name={`question-${index}`}
                    id={`q${index}-opt${i}`}
                    checked={answers[index] === i}
                    onChange={() => handleAnswerSelect(index, i)}
                    disabled={submitted}
                  />
                  <label className="form-check-label" htmlFor={`q${index}-opt${i}`}>
                    {choice}
                  </label>
                </div>
              ))}
            </div>
          ))}

          {!submitted ? (
            <div className="text-center">
              <button
                className="btn btn-success mt-4"
                onClick={handleSubmit}
                disabled={numCompleted !== totalQuestions}
              >
                Submit and Score
              </button>
              {numCompleted !== totalQuestions && (
                <p className="text-warning mt-2">Please answer all questions before submitting.</p>
              )}
            </div>
          ) : (
            <div className="text-center mt-4">
              <h4>
                You scored {score} out of {totalQuestions}
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
  );
}

export default TakeTest;