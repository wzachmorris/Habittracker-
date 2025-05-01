import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { usePreviewMode } from '../context/PreviewModeContext';

const LoginPromptModal = () => {
  const { showLoginPrompt, promptMessage, closeLoginPrompt } = usePreviewMode();
  const navigate = useNavigate();
  
  const handleLogin = () => {
    closeLoginPrompt();
    navigate('/login');
  };
  
  const handleRegister = () => {
    closeLoginPrompt();
    navigate('/register');
  };
  
  return (
    <Modal show={showLoginPrompt} onHide={closeLoginPrompt}>
      <Modal.Header closeButton>
        <Modal.Title>Login Required</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>{promptMessage}</p>
        <p>To store your information safely and sync your habits to the cloud, you'll need to create an account or login.</p>
        <p className="text-success"><strong>Don't worry - this app is 100% free!</strong></p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={closeLoginPrompt}>
          Continue Browsing
        </Button>
        <Button variant="primary" onClick={handleLogin}>
          Login
        </Button>
        <Button variant="success" onClick={handleRegister}>
          Create Account
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default LoginPromptModal;