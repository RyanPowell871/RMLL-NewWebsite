import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { StandingsSection } from '../components/StandingsSection';

export function StandingsPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <StandingsSection />
      <Footer />
    </div>
  );
}
