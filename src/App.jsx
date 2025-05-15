import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Signup from "./Signup";
import Login from "./Login";
import TestViewer from "./TestViewer";
import TakeTest from "./TakeTest";
import AuthRoute from "./AuthRoute";
import "bootstrap/dist/css/bootstrap.min.css";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AuthRoute />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/test-viewer" element={<TestViewer />} />
        <Route path="/take-test/:testId" element={<TakeTest />} />
      </Routes>
    </Router>
  );
};

export default App;
