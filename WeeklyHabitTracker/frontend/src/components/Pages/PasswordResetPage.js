import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Button, TextField, Typography, Paper, Alert } from '@mui/material';
import { requestPasswordReset, verifyResetToken, resetPassword } from '../../services/auth';

const PasswordResetPage = () => {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState(1); // 1: Request, 2: Token verification, 3: Reset
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  
  // Check if token is in URL
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tokenFromUrl = searchParams.get('token');
    
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
      setStep(2); // Go to token verification step
      verifyToken(tokenFromUrl);
    }
  }, [location]);
  
  // Handle request password reset
  const handleRequestReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    if (!email) {
      setMessage({ type: 'error', text: 'Email is required' });
      setLoading(false);
      return;
    }
    
    try {
      const response = await requestPasswordReset(email);
      setMessage({ 
        type: 'success', 
        text: 'If your email is registered, you will receive reset instructions' 
      });
      
      // For demo purposes only (remove in production)
      if (response.token) {
        setToken(response.token);
        setStep(2);
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to request password reset' 
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Verify token
  const verifyToken = async (tokenToVerify) => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      const response = await verifyResetToken(tokenToVerify);
      setMessage({ type: 'success', text: 'Token is valid. You can reset your password now.' });
      setEmail(response.email || '');
      setStep(3); // Go to reset password step
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Invalid or expired token' 
      });
      setStep(1); // Back to request step
    } finally {
      setLoading(false);
    }
  };
  
  // Handle reset password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    if (!password) {
      setMessage({ type: 'error', text: 'Password is required' });
      setLoading(false);
      return;
    }
    
    if (password.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      setLoading(false);
      return;
    }
    
    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      setLoading(false);
      return;
    }
    
    try {
      await resetPassword(token, password);
      setMessage({ 
        type: 'success', 
        text: 'Password has been reset successfully. You can now login with your new password.' 
      });
      
      // Redirect to login page after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to reset password' 
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Box 
      sx={{ 
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        padding: 2
      }}
    >
      <Paper 
        elevation={3} 
        sx={{ 
          padding: 4, 
          maxWidth: 500,
          width: '100%'
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom>
          {step === 1 && 'Reset Password'}
          {step === 2 && 'Verify Token'}
          {step === 3 && 'Create New Password'}
        </Typography>
        
        {message.text && (
          <Alert 
            severity={message.type} 
            sx={{ mb: 3 }}
            onClose={() => setMessage({ type: '', text: '' })}
          >
            {message.text}
          </Alert>
        )}
        
        {step === 1 && (
          <Box component="form" onSubmit={handleRequestReset}>
            <Typography mb={2}>
              Enter your email address and we'll send you instructions to reset your password.
            </Typography>
            <TextField
              label="Email"
              type="email"
              fullWidth
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button 
              type="submit" 
              variant="contained" 
              fullWidth 
              sx={{ mt: 3 }}
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Button>
            <Button 
              variant="text" 
              fullWidth 
              sx={{ mt: 1 }}
              onClick={() => navigate('/login')}
            >
              Back to Login
            </Button>
          </Box>
        )}
        
        {step === 2 && (
          <Box>
            <Typography mb={2}>
              Verifying your reset token...
            </Typography>
            <TextField
              label="Token"
              fullWidth
              margin="normal"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              disabled
            />
            <Button 
              variant="contained" 
              fullWidth 
              sx={{ mt: 3 }}
              onClick={() => verifyToken(token)}
              disabled={loading}
            >
              {loading ? 'Verifying...' : 'Verify Token'}
            </Button>
            <Button 
              variant="text" 
              fullWidth 
              sx={{ mt: 1 }}
              onClick={() => setStep(1)}
            >
              Back to Reset Request
            </Button>
          </Box>
        )}
        
        {step === 3 && (
          <Box component="form" onSubmit={handleResetPassword}>
            <Typography mb={2}>
              Create a new password for your account.
            </Typography>
            <TextField
              label="Email"
              type="email"
              fullWidth
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled
            />
            <TextField
              label="New Password"
              type="password"
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              helperText="Password must be at least 6 characters"
            />
            <TextField
              label="Confirm New Password"
              type="password"
              fullWidth
              margin="normal"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <Button 
              type="submit" 
              variant="contained" 
              fullWidth 
              sx={{ mt: 3 }}
              disabled={loading}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </Button>
            <Button 
              variant="text" 
              fullWidth 
              sx={{ mt: 1 }}
              onClick={() => navigate('/login')}
            >
              Back to Login
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default PasswordResetPage;