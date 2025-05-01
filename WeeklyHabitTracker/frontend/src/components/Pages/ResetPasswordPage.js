//frontend/src/components/Pages/ResetPasswordPage.js

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { verifyResetToken, resetPassword } from '../../services/auth';

const ResetPasswordPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isTokenValid, setIsTokenValid] = useState(false);
  const { token } = useParams();
  const navigate = useNavigate();
  
  useEffect(() => {
    const checkToken = async () => {
      try {
        await verifyResetToken(token);
        setIsTokenValid(true);
      } catch (error) {
        setError('Invalid or expired token');
        setIsTokenValid(false);
      }
    };
    
    checkToken();
  }, [token]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    try {
      await resetPassword(token, password);
      setMessage('Password reset successfully');
      setTimeout(() => navigate('/login'), 3000);
    } catch (error) {
      setError(error.message || 'Failed to reset password');
    }
  };
  
  if (!isTokenValid) {
    return (
      <div className="container">
        <div className="alert alert-danger">
          {error || 'Invalid or expired token'}
        </div>
      </div>
    );
  }
  
  return (
    <div className="container">
      <h2>Set New Password</h2>
      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>New Password</label>
          <input 
            type="password" 
            className="form-control" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            minLength="6"
          />
        </div>
        <div className="form-group">
          <label>Confirm Password</label>
          <input 
            type="password" 
            className="form-control" 
            value={confirmPassword} 
            onChange={(e) => setConfirmPassword(e.target.value)} 
            required 
            minLength="6"
          />
        </div>
        <button type="submit" className="btn btn-primary">
          Reset Password
        </button>
      </form>
    </div>
  );
};

export default ResetPasswordPage;