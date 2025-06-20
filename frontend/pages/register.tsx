import AuthForm from '../components/AuthForm';
import Layout from '../components/Layout';

export default function RegisterPage() {
  return (
    <Layout>
      <div className="max-w-md mx-auto mt-12 bg-white rounded-2xl shadow-md p-8">
        <h1 className="text-2xl font-bold mb-4">Register</h1>
        <AuthForm mode="register" />
      </div>
    </Layout>
  );
}
