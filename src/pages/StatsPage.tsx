import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { StatsSection } from '../components/StatsSection';

export function StatsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <StatsSection />
      <Footer />
    </div>
  );
}