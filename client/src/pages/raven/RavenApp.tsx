import Hub from '../Hub';
import type { BrandData } from '../../App';

interface Props {
  brand: BrandData | null;
  onBrandRefresh: () => void;
  onLogout: () => void;
}

export default function RavenApp({ brand, onBrandRefresh, onLogout }: Props) {
  return <Hub brand={brand} onBrandRefresh={onBrandRefresh} onLogout={onLogout} />;
}
