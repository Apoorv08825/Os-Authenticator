import { useAuth } from "./hooks/useAuth";
import { AuthPage } from "./pages/AuthPage";
import { DashboardPage } from "./pages/DashboardPage";

const App = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  return user ? <DashboardPage /> : <AuthPage />;
};

export default App;
