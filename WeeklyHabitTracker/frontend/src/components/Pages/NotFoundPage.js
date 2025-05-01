import React from 'react';
import { Link } from 'react-router-dom';
import PageWrapper from '../PageWrapper';
import Header from '../Header';

function NotFoundPage() {
  return (
    <PageWrapper>
      <Header title="Page Not Found" />
      
      <div className="container text-center my-5">
        <div className="row justify-content-center">
          <div className="col-md-8">
            <h2 className="mb-4">404 - Page Not Found</h2>
            
            <div className="alert alert-warning">
              <p>Sorry, the page you are looking for does not exist.</p>
            </div>
            
            <div className="mt-4">
              <Link to="/" className="btn btn-primary">
                Return to Home Page
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}

export default NotFoundPage;