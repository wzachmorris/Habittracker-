//frontend/src/components/Pages/RequestResetPage.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import PageWrapper from '../PageWrapper';
import Header from '../Header';

const RequestResetPage = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // For now, just show a message since the backend isn't implemented yet
    setMessage('This feature is coming soon! For now, please contact support.');
  };
  
  return (
    <PageWrapper>
      <Header title="Reset Password" />
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card">
              <div className="card-header bg-primary text-white">
                <h3 className="mb-0">Reset Password</h3>
              </div>
              <div className="card-body">
                {message && (
                  <div className="alert alert-info" role="alert">
                    {message}
                  </div>
                )}
                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}
                
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                  
                  <div className="d-grid">
                    <button type="submit" className="btn btn-primary">
                      Request Password Reset
                    </button>
                  </div>
                </form>
              </div>
              <div className="card-footer">
                <div className="text-center">
                  <Link to="/login">Back to Login</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default RequestResetPage;