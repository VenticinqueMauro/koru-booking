import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from './pages/Dashboard';
import Services from './pages/Services';
import Schedule from './pages/Schedule';
import Bookings from './pages/Bookings';
import Settings from './pages/Settings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/services" element={<Services />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
