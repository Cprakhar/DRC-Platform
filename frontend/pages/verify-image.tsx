import React from 'react';
import Head from 'next/head';

const VerifyImagePage: React.FC = () => {
  return (
    <>
      <Head>
        <title>Verify Image | Disaster Response</title>
      </Head>
      <div className="max-w-lg mx-auto mt-10 bg-white rounded-2xl shadow-xl p-8 flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-blue-700 mb-2">Image Verification</h1>
        <p className="text-gray-600 mb-4">Upload an image or paste an image URL to verify its authenticity using AI.</p>
      </div>
    </>
  );
};

export default VerifyImagePage;
