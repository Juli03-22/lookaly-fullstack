import { Outlet } from 'react-router';
import Header from '../components/Header';

export default function Root() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <Outlet />
      </main>
    </div>
  );
}