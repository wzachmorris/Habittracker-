import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import PageWrapper from '../PageWrapper';
import { getAllCategories, approveCategory, rejectCategory, getDashboardStats } from '../../services/admin';

function AdminPage() {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ totalUsers: 0, totalCategories: 0, pendingCategories: 0 });
  const [statusMessage, setStatusMessage] = useState('');

  // List of admin emails
  const adminEmails = ['william.zachmorris@gmail.com', 'zacfala@gmail.com'];
  
  // Check if current user is admin
  const isAdmin = user?.email && adminEmails.includes(user.email);

  useEffect(() => {
    if (isAdmin) {
      fetchCategories();
      fetchStats();
    }
  }, [isAdmin]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await getAllCategories();
      setCategories(data);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError(err.message || 'An error occurred while fetching categories');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleApprove = async (categoryId) => {
    try {
      await approveCategory(categoryId);
      setStatusMessage('Category approved successfully!');
      // Update local state to reflect the change
      setCategories(prevCategories => 
        prevCategories.map(cat => 
          cat.id === categoryId ? { ...cat, isActive: true } : cat
        )
      );
      fetchStats(); // Refresh stats
    } catch (err) {
      console.error('Error approving category:', err);
      setError(err.message || 'An error occurred while approving the category');
    }
  };

  const handleReject = async (categoryId) => {
    if (window.confirm('Are you sure you want to reject and delete this category?')) {
      try {
        await rejectCategory(categoryId);
        setStatusMessage('Category rejected and deleted!');
        // Remove from local state
        setCategories(prevCategories => 
          prevCategories.filter(cat => cat.id !== categoryId)
        );
        fetchStats(); // Refresh stats
      } catch (err) {
        console.error('Error rejecting category:', err);
        setError(err.message || 'An error occurred while rejecting the category');
      }
    }
  };

  // Filter for pending categories
  const pendingCategories = categories.filter(cat => !cat.isActive);
  
  // Filter for approved categories
  const approvedCategories = categories.filter(cat => cat.isActive);

  if (!isAdmin) {
    return (
      <PageWrapper>
        <div className="container mt-4">
          <div className="alert alert-danger">
            Access denied. This page is only accessible to administrators.
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="container mt-4">
        <h2>Admin Dashboard</h2>
        
        {/* Stats cards */}
        <div className="row mb-4">
          <div className="col-md-4">
            <div className="card">
              <div className="card-body text-center">
                <h5 className="card-title">Total Users</h5>
                <p className="display-4">{stats.totalUsers}</p>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card">
              <div className="card-body text-center">
                <h5 className="card-title">Active Categories</h5>
                <p className="display-4">{stats.totalCategories - stats.pendingCategories}</p>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card">
              <div className="card-body text-center">
                <h5 className="card-title">Pending Categories</h5>
                <p className="display-4">{stats.pendingCategories}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Status message */}
        {statusMessage && (
          <div className="alert alert-success alert-dismissible fade show" role="alert">
            {statusMessage}
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setStatusMessage('')}
              aria-label="Close"
            ></button>
          </div>
        )}
        
        {/* Error message */}
        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            {error}
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setError(null)}
              aria-label="Close"
            ></button>
          </div>
        )}
        
        {/* Loading indicator */}
        {loading && (
          <div className="text-center my-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        )}
        
        {/* Pending categories section */}
        <div className="card mb-4">
          <div className="card-header">
            <h4 className="mb-0">Pending Categories ({pendingCategories.length})</h4>
          </div>
          <div className="card-body">
            {pendingCategories.length === 0 ? (
              <p className="text-muted">No pending categories to review.</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Emoji</th>
                      <th>Name</th>
                      <th>Description</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingCategories.map(category => (
                      <tr key={category.id}>
                        <td className="fs-4">{category.emoji}</td>
                        <td>{category.name}</td>
                        <td>{category.description || 'No description'}</td>
                        <td>{new Date(category.createdAt).toLocaleDateString()}</td>
                        <td>
                          <button 
                            className="btn btn-success btn-sm me-2"
                            onClick={() => handleApprove(category.id)}
                          >
                            Approve
                          </button>
                          <button 
                            className="btn btn-danger btn-sm"
                            onClick={() => handleReject(category.id)}
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        
        {/* Approved categories section */}
        <div className="card">
          <div className="card-header">
            <h4 className="mb-0">Active Categories ({approvedCategories.length})</h4>
          </div>
          <div className="card-body">
            {approvedCategories.length === 0 ? (
              <p className="text-muted">No active categories.</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Emoji</th>
                      <th>Name</th>
                      <th>Description</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {approvedCategories.map(category => (
                      <tr key={category.id}>
                        <td className="fs-4">{category.emoji}</td>
                        <td>{category.name}</td>
                        <td>{category.description || 'No description'}</td>
                        <td>{new Date(category.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}

export default AdminPage;