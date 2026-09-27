import { useHashRoute } from './lib/useHashRoute';
import { ToastProvider } from './lib/toast';
import { MotionPrefsProvider } from './motion/MotionPrefs';
import BankConsole from './pages/BankConsole';
import ClientApp from './pages/ClientApp';
import Landing from './pages/Landing';

export default function App() {
  const route = useHashRoute();
  return (
    <MotionPrefsProvider>
      <ToastProvider>{route === 'client' ? <ClientApp /> : route === 'banque' ? <BankConsole /> : <Landing />}</ToastProvider>
    </MotionPrefsProvider>
  );
}
