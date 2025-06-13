import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Fuel, Coffee, Newspaper, Cigarette, Wheat } from "lucide-react";
import type { Product } from "@shared/schema";

interface ProductGridProps {
  products: Product[];
  selectedCategory: string;
  onAddToCart: (product: Product) => void;
}

const categoryIcons: Record<string, any> = {
  'Drinks': Package,
  'Fuel': Fuel,
  'Food': Wheat,
  'Hot Drinks': Coffee,
  'News': Newspaper,
  'Tobacco': Cigarette,
};

export function ProductGrid({ products, selectedCategory, onAddToCart }: ProductGridProps) {
  const filteredProducts = selectedCategory === 'All Items' 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {filteredProducts.map((product) => {
        const IconComponent = categoryIcons[product.category] || Package;
        const isLowStock = product.stock <= product.minStock;
        
        return (
          <Card
            key={product.id}
            className="p-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onAddToCart(product)}
          >
            <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
              <IconComponent className="text-gray-400 w-8 h-8" />
            </div>
            
            <h3 className="font-medium text-gray-900 text-sm mb-1 truncate">
              {product.name}
            </h3>
            
            {product.barcode && (
              <p className="text-xs text-gray-500 mb-2">{product.barcode}</p>
            )}
            
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-gray-900">
                €{parseFloat(product.price.toString()).toFixed(2)}
              </span>
              
              <div className="text-right">
                {product.category === 'Fuel' ? (
                  <Badge variant="outline" className="text-xs text-success">
                    Available
                  </Badge>
                ) : (
                  <span className={`text-xs ${isLowStock ? 'text-error' : 'text-gray-500'}`}>
                    Stock: {product.stock}
                  </span>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
