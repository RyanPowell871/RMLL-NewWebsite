import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { StoreSection } from '../components/StoreSection';

export function StorePageV1() {
  return (
    <div className="min-h-screen">
      <Header />
      <StoreSection />
      <Footer />
    </div>
  );
}
