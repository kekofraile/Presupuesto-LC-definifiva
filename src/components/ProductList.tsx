import { Product } from '../types';
import { ProductCard } from './ProductCard';
import { eurPerDayPair } from '../utils/pricing';

interface ProductListProps {
  products: Product[];
  onAddToCompare: (product: Product) => void;
  onAddToBudget: (product: Product) => void;
}

export function ProductList({ products, onAddToCompare, onAddToBudget }: ProductListProps) {
  const sorted = [...products].sort((a, b) => eurPerDayPair(a) - eurPerDayPair(b));

  if (sorted.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        display: 'grid',
        gap: '1.5rem'
      }}
    >
      {sorted.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          highlight={index === 0}
          onAddToCompare={onAddToCompare}
          onAddToBudget={onAddToBudget}
        />
      ))}
    </div>
  );
}
