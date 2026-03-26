import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { ScheduleSection } from '../components/ScheduleSection';

export function SchedulePage() {
  return (
    <div className="min-h-screen">
      <Header />
      <ScheduleSection />
      <Footer />
    </div>
  );
}
