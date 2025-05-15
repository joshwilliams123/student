import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Link } from "react-router-dom";

function AuthRoute() {
  return (
    <div className="container">
      <header className="jumbotron jumbotron-fluid bg-light text-center">
        <div className="container">
          <h1>Welcome!</h1>
          <h5>If you have an account, log in. If you do not have an account, sign up then log in.</h5>
        </div>
      </header>

      <main className="text-center">
        <div className="row justify-content-center mt-4">
          <div className="col-md-4">
            <div className="card">
              <Link to="/signup" className="text-decoration-none text-dark">
                <div className="card-body text-center">
                  <i className="bi bi-person-plus display-4"></i>
                  <h4 className="card-title mt-2">Sign Up</h4>
                </div>
              </Link>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card">
              <Link to="/login" className="text-decoration-none text-dark">
                <div className="card-body text-center">
                  <i className="bi bi-box-arrow-in-right display-4"></i>
                  <h4 className="card-title mt-2">Log In</h4>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AuthRoute;