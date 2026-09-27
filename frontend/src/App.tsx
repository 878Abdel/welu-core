import { useHashRoute } from './lib/useHashRoute';
import { MotionPrefsProvider } from './motion/MotionPrefs';
import BankConsole from './pages/BankConsole';
import ClientApp from './pages/ClientApp';
import DemoSplit from './pages/DemoSplit';
import Landing from './pages/Landing';

export default function App() {
  const route = useHashRoute();
  return (
    <MotionPrefsProvider>
      {route === 'client' ? <ClientApp /> : route === 'banque' ? <BankConsole /> : route === 'demo' ? <DemoSplit /> : <Landing />}
    </MotionPrefsProvider>
  );
}
