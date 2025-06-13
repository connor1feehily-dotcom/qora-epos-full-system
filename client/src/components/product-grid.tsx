import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Fuel, Coffee, Newspaper, Cigarette, Wheat, ShoppingCart, AlertTriangle, Plus } from "lucide-react";
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
  'Convenience': Package,
};

const categoryColors: Record<string, string> = {
  'Drinks': 'from-blue-400 to-blue-600',
  'Fuel': 'from-orange-400 to-red-600',
  'Food': 'from-green-400 to-green-600',
  'Hot Drinks': 'from-amber-400 to-orange-600',
  'News': 'from-gray-400 to-gray-600',
  'Tobacco': 'from-purple-400 to-purple-600',
  'Convenience': 'from-teal-400 to-teal-600',
};

export function ProductGrid({ products, selectedCategory, onAddToCart }: ProductGridProps) {
  const filteredProducts = selectedCategory === 'All Items' 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  if (filteredProducts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500 dark:text-slate-400">
        <Package className="w-16 h-16 mb-4 opacity-50" />
        <p className="text-lg font-medium">No products found</p>
        <p className="text-sm">Try searching for a different product or category</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {filteredProducts.map((product) => {
        const IconComponent = categoryIcons[product.category] || Package;
        const colorClass = categoryColors[product.category] || 'from-slate-400 to-slate-600';
        const isLowStock = product.stock <= product.minStock;
        const isOutOfStock = product.stock === 0 && product.category !== 'Fuel';
        
        return (
          <Card
            key={product.id}
            className={`group relative overflow-hidden bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 cursor-pointer ${
              isOutOfStock ? 'opacity-60' : 'hover:shadow-lg hover:scale-102 transform'
            }`}
            onClick={() => !isOutOfStock && onAddToCart(product)}
          >
            {/* Product Icon Background */}
            <div className={`aspect-square bg-gradient-to-br ${colorClass} rounded-t-lg mb-3 flex items-center justify-center relative overflow-hidden`}>
              <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
              <IconComponent className="text-white w-10 h-10 z-10 drop-shadow-lg" />
              
              {/* Add to Cart Overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center z-20">
                <div className="bg-white/90 dark:bg-slate-800/90 rounded-full p-2">
                  <Plus className="w-6 h-6 text-slate-700 dark:text-slate-300" />
                </div>
              </div>
              
              {/* Stock Warning */}
              {isLowStock && !isOutOfStock && (
                <div className="absolute top-2 right-2 bg-amber-500 text-white rounded-full p-1">
                  <AlertTriangle className="w-3 h-3" />
                </div>
              )}
              
              {isOutOfStock && (
                <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                  <Badge variant="destructive" className="text-xs font-bold">
                    OUT OF STOCK
                  </Badge>
                </div>
              )}
            </div>
            
            <div className="p-4 pt-0">
              {/* Product Name */}
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm mb-2 line-clamp-2 leading-tight">
                {product.name}
              </h3>
              
              {/* Barcode */}
              {product.barcode && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 font-mono bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                  {product.barcode}
                </p>
              )}
              
              {/* Price and Stock */}
              <div className="flex items-center justify-between mt-auto">
                <div>
                  <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    €{parseFloat(product.price.toString()).toFixed(2)}
                  </span>
                </div>
                
                <div className="text-right">
                  {product.category === 'Fuel' ? (
                    <Badge variant="outline" className="text-xs bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
                      Available
                    </Badge>
                  ) : isOutOfStock ? (
                    <Badge variant="destructive" className="text-xs">
                      No Stock
                    </Badge>
                  ) : (
                    <div className="flex flex-col items-end">
                      <span className={`text-xs font-medium ${
                        isLowStock 
                          ? 'text-amber-600 dark:text-amber-400' 
                          : 'text-slate-500 dark:text-slate-400'
                      }`}>
                        {isLowStock ? 'Low Stock' : 'In Stock'}
                      </span>
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        {product.stock} units
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Quick Add Button */}
            {!isOutOfStock && (
              <Button
                size="sm"
                className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-blue-500 hover:bg-blue-600 text-white shadow-lg"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToCart(product);
                }}
              >
                <ShoppingCart className="w-4 h-4" />
              </Button>
            )}
          </Card>
        );
      })}
    </div>
  );
}
