import React from 'react';
import Layout from '../components/Layout';
import DisasterForm from '../components/DisasterForm';
import ProtectedRoute from '../components/ProtectedRoute';

const CreatePage: React.FC = () => {
  return (
    <ProtectedRoute>
      <Layout>
        <DisasterForm />
      </Layout>
    </ProtectedRoute>
  );
};

export default CreatePage;
