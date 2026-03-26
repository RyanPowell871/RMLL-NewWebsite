import { useState } from 'react';
import { ShoppingCart, Heart, Search, ChevronRight, X, Plus, Minus, Star, Package, Truck, Shield } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { ImageWithFallback } from './figma/ImageWithFallback';
import shamrocksLogo from 'figma:asset/451bbc9cb0dc69d999248789df7937a5d31b2bc3.png';
import rockiesLogo from 'figma:asset/7731aebae94e152f358806079868cc4565ee122c.png';
import silvertipsLogo from 'figma:asset/684000dca4c85b66ba1fc0229c1108f3ed19c423.png';
import coloradoLogo from 'figma:asset/7b200b07ad33b0b371963d2489b2746b0467043c.png';
import crudeLogo from 'figma:asset/624710d201f00439999e5d9f4d18a983f346e1b2.png';
import rampageLogo from 'figma:asset/c2b0866dd6acd5ea1a4ca18182e137eb37131c88.png';

interface Product {
  id: string;
  name: string;
  category: 'RMLL Merchandise' | 'Team Merchandise';
  team?: string;
  teamLogo?: string;
  price: number;
  image: string;
  description: string;
  sizes?: string[];
  details?: string;
  features?: string[];
  inStock: boolean;
  rating: number;
  reviews: number;
}

const categories = [
  { id: 'all', name: 'All Products', count: 12 },
  { id: 'rmll', name: 'RMLL Merchandise', count: 6 },
  { id: 'team', name: 'Team Merchandise', count: 6 },
  { id: 'apparel', name: 'Apparel', count: 8 },
  { id: 'accessories', name: 'Accessories', count: 4 },
];

const teams = [
  { name: 'All Teams', logo: '' },
  { name: 'Shamrocks', logo: shamrocksLogo },
  { name: 'Rockies', logo: rockiesLogo },
  { name: 'Silvertips', logo: silvertipsLogo },
  { name: 'Colorado', logo: coloradoLogo },
  { name: 'Crude', logo: crudeLogo },
  { name: 'Rampage', logo: rampageLogo },
];

const products: Product[] = [
  // RMLL Merchandise
  {
    id: '1',
    name: 'RMLL Official Jersey',
    category: 'RMLL Merchandise',
    price: 89.99,
    image: 'https://images.unsplash.com/photo-1540345701062-3676274135b8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYWNyb3NzZSUyMGplcnNleSUyMHNwb3J0fGVufDF8fHx8MTc2MTYwNjQwNHww&ixlib=rb-4.1.0&q=80&w=1080',
    description: 'Official RMLL league jersey with authentic league branding',
    details: 'Show your RMLL pride with this premium quality jersey. Features authentic league branding, breathable fabric, and professional-grade construction.',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    features: ['Moisture-wicking fabric', 'Authentic RMLL branding', 'Officially licensed', 'Machine washable'],
    inStock: true,
    rating: 4.8,
    reviews: 24
  },
  {
    id: '2',
    name: 'RMLL Classic Cap',
    category: 'RMLL Merchandise',
    price: 29.99,
    image: 'https://images.unsplash.com/photo-1620743364195-6915419c6dc6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcG9ydHMlMjBjYXAlMjBoYXR8ZW58MXx8fHwxNzYxNjA2NDA0fDA&ixlib=rb-4.1.0&q=80&w=1080',
    description: 'Adjustable cap with embroidered RMLL logo',
    details: 'Classic adjustable cap featuring high-quality embroidered RMLL logo. Perfect for game days or casual wear.',
    features: ['Adjustable snapback closure', 'Embroidered logo', 'One size fits most', 'Breathable fabric'],
    inStock: true,
    rating: 4.6,
    reviews: 18
  },
  {
    id: '3',
    name: 'RMLL Performance Hoodie',
    category: 'RMLL Merchandise',
    price: 64.99,
    image: 'https://images.unsplash.com/photo-1655823057333-24bcb6d03471?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcG9ydHMlMjBob29kaWUlMjBzd2VhdHNoaXJ0fGVufDF8fHx8MTc2MTYwNjQwNXww&ixlib=rb-4.1.0&q=80&w=1080',
    description: 'Premium fleece hoodie with front pocket',
    details: 'Stay warm and comfortable with this premium fleece hoodie. Features a spacious front pocket and adjustable drawstring hood.',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    features: ['Premium fleece material', 'Front kangaroo pocket', 'Adjustable hood', 'Ribbed cuffs and waistband'],
    inStock: true,
    rating: 4.9,
    reviews: 32
  },
  {
    id: '4',
    name: 'RMLL Water Bottle',
    category: 'RMLL Merchandise',
    price: 19.99,
    image: 'https://images.unsplash.com/photo-1601507793214-77d2a926582a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcG9ydHMlMjB3YXRlciUyMGJvdHRsZXxlbnwxfHx8fDE3NjE2MDY0MDV8MA&ixlib=rb-4.1.0&q=80&w=1080',
    description: 'Insulated 24oz water bottle with RMLL branding',
    details: 'Keep your drinks cold for up to 24 hours with this insulated water bottle featuring RMLL branding.',
    features: ['24oz capacity', 'Double-wall insulation', 'BPA-free', 'Leak-proof lid'],
    inStock: true,
    rating: 4.7,
    reviews: 15
  },
  {
    id: '5',
    name: 'RMLL Backpack',
    category: 'RMLL Merchandise',
    price: 49.99,
    image: 'https://images.unsplash.com/photo-1634843138984-360af3d8a02e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcG9ydHMlMjBiYWNrcGFjayUyMGJhZ3xlbnwxfHx8fDE3NjE1NDMxOTJ8MA&ixlib=rb-4.1.0&q=80&w=1080',
    description: 'Durable backpack with multiple compartments',
    details: 'Spacious and durable backpack perfect for carrying your gear. Features multiple compartments and padded straps.',
    features: ['Multiple compartments', 'Padded shoulder straps', 'Water-resistant material', 'RMLL logo patch'],
    inStock: true,
    rating: 4.5,
    reviews: 20
  },
  {
    id: '6',
    name: 'RMLL T-Shirt',
    category: 'RMLL Merchandise',
    price: 24.99,
    image: 'https://images.unsplash.com/photo-1659081469066-c88ca2dec240?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcG9ydHMlMjB0LXNoaXJ0JTIwdGVlfGVufDF8fHx8MTc2MTYwNjQwN3ww&ixlib=rb-4.1.0&q=80&w=1080',
    description: 'Classic cotton tee with RMLL logo',
    details: 'Comfortable cotton t-shirt with classic RMLL logo. Perfect for everyday wear.',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    features: ['100% cotton', 'Pre-shrunk', 'Classic fit', 'Screen-printed logo'],
    inStock: true,
    rating: 4.4,
    reviews: 28
  },

  // Team Merchandise
  {
    id: '7',
    name: 'Shamrocks Team Jersey',
    category: 'Team Merchandise',
    team: 'Shamrocks',
    teamLogo: shamrocksLogo,
    price: 94.99,
    image: 'https://images.unsplash.com/photo-1540345701062-3676274135b8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYWNyb3NzZSUyMGplcnNleSUyMHNwb3J0fGVufDF8fHx8MTc2MTYwNjQwNHww&ixlib=rb-4.1.0&q=80&w=1080',
    description: 'Official Shamrocks team jersey',
    details: 'Support the Shamrocks with this official team jersey. Features authentic team colors and branding.',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    features: ['Official team colors', 'Moisture-wicking', 'Authentic branding', 'Premium quality'],
    inStock: true,
    rating: 4.9,
    reviews: 35
  },
  {
    id: '8',
    name: 'Rockies Team Cap',
    category: 'Team Merchandise',
    team: 'Rockies',
    teamLogo: rockiesLogo,
    price: 32.99,
    image: 'https://images.unsplash.com/photo-1620743364195-6915419c6dc6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcG9ydHMlMjBjYXAlMjBoYXR8ZW58MXx8fHwxNzYxNjA2NDA0fDA&ixlib=rb-4.1.0&q=80&w=1080',
    description: 'Rockies team cap with embroidered logo',
    details: 'Show your Rockies pride with this premium embroidered cap.',
    features: ['Embroidered team logo', 'Adjustable fit', 'Official team colors', 'Curved brim'],
    inStock: true,
    rating: 4.6,
    reviews: 22
  },
  {
    id: '9',
    name: 'Crude Team Hoodie',
    category: 'Team Merchandise',
    team: 'Crude',
    teamLogo: crudeLogo,
    price: 69.99,
    image: 'https://images.unsplash.com/photo-1655823057333-24bcb6d03471?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcG9ydHMlMjBob29kaWUlMjBzd2VhdHNoaXJ0fGVufDF8fHx8MTc2MTYwNjQwNXww&ixlib=rb-4.1.0&q=80&w=1080',
    description: 'Crude team hoodie with team colors',
    details: 'Stay warm while supporting the Crude with this official team hoodie.',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    features: ['Team colors and logo', 'Fleece lined', 'Kangaroo pocket', 'Drawstring hood'],
    inStock: true,
    rating: 4.8,
    reviews: 19
  },
  {
    id: '10',
    name: 'Silvertips Team T-Shirt',
    category: 'Team Merchandise',
    team: 'Silvertips',
    teamLogo: silvertipsLogo,
    price: 27.99,
    image: 'https://images.unsplash.com/photo-1659081469066-c88ca2dec240?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcG9ydHMlMjB0LXNoaXJ0JTIwdGVlfGVufDF8fHx8MTc2MTYwNjQwN3ww&ixlib=rb-4.1.0&q=80&w=1080',
    description: 'Silvertips team t-shirt',
    details: 'Comfortable Silvertips team t-shirt in official team colors.',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    features: ['Official team design', 'Soft cotton', 'Classic fit', 'Screen-printed graphics'],
    inStock: true,
    rating: 4.5,
    reviews: 26
  },
  {
    id: '11',
    name: 'Colorado Team Jersey',
    category: 'Team Merchandise',
    team: 'Colorado',
    teamLogo: coloradoLogo,
    price: 94.99,
    image: 'https://images.unsplash.com/photo-1540345701062-3676274135b8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYWNyb3NzZSUyMGplcnNleSUyMHNwb3J0fGVufDF8fHx8MTc2MTYwNjQwNHww&ixlib=rb-4.1.0&q=80&w=1080',
    description: 'Official Colorado team jersey',
    details: 'Authentic Colorado team jersey with official branding and team colors.',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    features: ['Authentic team jersey', 'Performance fabric', 'Official branding', 'Premium construction'],
    inStock: true,
    rating: 4.7,
    reviews: 30
  },
  {
    id: '12',
    name: 'Rampage Team Cap',
    category: 'Team Merchandise',
    team: 'Rampage',
    teamLogo: rampageLogo,
    price: 32.99,
    image: 'https://images.unsplash.com/photo-1620743364195-6915419c6dc6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcG9ydHMlMjBjYXAlMjBoYXR8ZW58MXx8fHwxNzYxNjA2NDA0fDA&ixlib=rb-4.1.0&q=80&w=1080',
    description: 'Rampage team cap with embroidered logo',
    details: 'Support the Rampage with this stylish embroidered cap.',
    features: ['Embroidered logo', 'Snapback closure', 'Team colors', 'Structured fit'],
    inStock: true,
    rating: 4.6,
    reviews: 17
  },
];

export function StoreSection() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTeam, setSelectedTeam] = useState('All Teams');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState(1);

  const filteredProducts = products.filter(product => {
    // Category filter
    let categoryMatch = true;
    if (selectedCategory === 'rmll') {
      categoryMatch = product.category === 'RMLL Merchandise';
    } else if (selectedCategory === 'team') {
      categoryMatch = product.category === 'Team Merchandise';
    } else if (selectedCategory === 'apparel') {
      categoryMatch = !!product.sizes;
    } else if (selectedCategory === 'accessories') {
      categoryMatch = !product.sizes;
    }

    const teamMatch = selectedTeam === 'All Teams' || product.team === selectedTeam;
    const searchMatch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       product.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    return categoryMatch && teamMatch && searchMatch;
  });

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setSelectedSize(product.sizes ? product.sizes[0] : '');
    setQuantity(1);
  };

  const handleAddToCart = () => {
    // Add to cart logic here
    setSelectedProduct(null);
  };

  return (
    <section className="bg-gray-50 py-8 sm:py-12 lg:py-16">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-6 sm:mb-8 gap-3 sm:gap-4">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl text-gray-900 font-bold tracking-tight">RMLL Store</h2>
          
          <a href="#" className="group relative inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 lg:px-5 lg:py-2.5 bg-gradient-to-b from-red-600 to-red-700 text-white rounded font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-red-500 to-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-300 to-transparent opacity-50"></div>
            <ShoppingCart className="w-4 h-4 relative z-10" />
            <span className="relative z-10">View Cart (0)</span>
          </a>
        </div>

        <div className="flex gap-6">
          {/* Left Sidebar Navigation */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-md p-5 sticky top-24">
              {/* Search */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent font-semibold"
                  />
                </div>
              </div>

              {/* Categories */}
              <div className="mb-6">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Categories</h3>
                <nav className="space-y-1">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-bold transition-all ${
                        selectedCategory === category.id
                          ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span>{category.name}</span>
                      <span className={`text-xs ${
                        selectedCategory === category.id ? 'text-red-100' : 'text-gray-400'
                      }`}>
                        {category.count}
                      </span>
                    </button>
                  ))}
                </nav>
              </div>

              {/* Teams Filter */}
              <div className="mb-6 pt-6 border-t border-gray-200">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Filter by Team</h3>
                <select
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent font-bold"
                >
                  {teams.map((team) => (
                    <option key={team.name} value={team.name}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Info Section */}
              <div className="pt-6 border-t border-gray-200 space-y-3">
                <div className="flex items-start gap-2 text-xs">
                  <Truck className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-gray-900">Free Shipping</p>
                    <p className="text-gray-600">On orders over $75</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-xs">
                  <Shield className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-gray-900">Secure Payment</p>
                    <p className="text-gray-600">100% secure checkout</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-xs">
                  <Package className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-gray-900">Easy Returns</p>
                    <p className="text-gray-600">30-day return policy</p>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Mobile Filters */}
            <div className="lg:hidden mb-6 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent font-semibold"
                />
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-4 py-2 text-xs font-bold tracking-wide whitespace-nowrap rounded transition-all ${
                      selectedCategory === category.id
                        ? 'text-white shadow-md'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                    }`}
                    style={selectedCategory === category.id ? { background: 'linear-gradient(to bottom, var(--color-primary), var(--color-primary-dark))' } : {}}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Products Count */}
            <div className="mb-4">
              <p className="text-sm text-gray-600 font-semibold">
                Showing {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
              </p>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => handleProductClick(product)}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer"
                >
                  {/* Product Image */}
                  <div className="relative aspect-square overflow-hidden bg-gray-100">
                    <ImageWithFallback
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {product.teamLogo && (
                      <div className="absolute top-3 left-3 bg-white rounded-full p-2 shadow-md">
                        <img src={product.teamLogo} alt="" className="w-8 h-8 object-contain" />
                      </div>
                    )}
                    {product.inStock && (
                      <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
                        In Stock
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <div className="mb-2">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                        {product.category}
                      </span>
                      {product.team && (
                        <span className="text-xs font-bold text-gray-400 ml-2">• {product.team}</span>
                      )}
                    </div>
                    <h3 className="font-bold text-base mb-2 text-gray-900">{product.name}</h3>
                    <p className="text-sm text-gray-600 font-semibold mb-3 line-clamp-2">{product.description}</p>
                    
                    {/* Rating */}
                    <div className="flex items-center gap-1 mb-3">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.floor(product.rating)
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-600 font-semibold">
                        ({product.reviews})
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                      <span className="text-xl font-bold text-gray-900">
                        ${product.price.toFixed(2)}
                      </span>
                      <button className="flex items-center gap-1 px-3 py-2 bg-gradient-to-b from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded font-bold text-sm transition-all shadow-md hover:shadow-lg">
                        View Details
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* No Results */}
            {filteredProducts.length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg shadow-md">
                <p className="text-gray-500 font-bold text-lg">No products found</p>
                <p className="text-gray-400 font-semibold text-sm mt-2">Try adjusting your filters</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Product Detail Modal */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0" aria-describedby="product-description">
          <DialogHeader>
            <DialogTitle className="sr-only">
              {selectedProduct?.name || 'Product Details'}
            </DialogTitle>
            <DialogDescription id="product-description" className="sr-only">
              {selectedProduct?.description || 'Product information and details'}
            </DialogDescription>
          </DialogHeader>
          
          {selectedProduct && (
            <>
              <div className="flex flex-col">
                {/* Close button */}
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="grid md:grid-cols-2 gap-0">
                {/* Product Image */}
                <div className="relative aspect-square bg-gray-100">
                  <ImageWithFallback
                    src={selectedProduct.image}
                    alt={selectedProduct.name}
                    className="w-full h-full object-cover"
                  />
                  {selectedProduct.teamLogo && (
                    <div className="absolute top-6 left-6 bg-white rounded-full p-3 shadow-lg">
                      <img src={selectedProduct.teamLogo} alt="" className="w-12 h-12 object-contain" />
                    </div>
                  )}
                </div>

                {/* Product Details */}
                <div className="p-6 md:p-8">
                  <div className="mb-4">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                      {selectedProduct.category}
                    </span>
                    {selectedProduct.team && (
                      <span className="text-xs font-bold text-gray-400 ml-2">• {selectedProduct.team}</span>
                    )}
                  </div>

                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                    {selectedProduct.name}
                  </h2>

                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-5 h-5 ${
                            i < Math.floor(selectedProduct.rating)
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-bold text-gray-900">
                      {selectedProduct.rating}
                    </span>
                    <span className="text-sm text-gray-600">
                      ({selectedProduct.reviews} reviews)
                    </span>
                  </div>

                  <div className="mb-6">
                    <span className="text-3xl font-black text-gray-900">
                      ${selectedProduct.price.toFixed(2)}
                    </span>
                  </div>

                  <p className="text-gray-700 font-semibold mb-6">
                    {selectedProduct.details}
                  </p>

                  {/* Features */}
                  {selectedProduct.features && (
                    <div className="mb-6">
                      <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Features</h3>
                      <ul className="space-y-2">
                        {selectedProduct.features.map((feature, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-gray-700 font-semibold">
                            <ChevronRight className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Size Selection */}
                  {selectedProduct.sizes && (
                    <div className="mb-6">
                      <label className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">
                        Select Size
                      </label>
                      <div className="flex gap-2">
                        {selectedProduct.sizes.map((size) => (
                          <button
                            key={size}
                            onClick={() => setSelectedSize(size)}
                            className={`px-4 py-2 text-sm font-bold border-2 rounded transition-all ${
                              selectedSize === size
                                ? 'border-red-600 bg-red-50 text-red-600'
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quantity */}
                  <div className="mb-6">
                    <label className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">
                      Quantity
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="p-2 border-2 border-gray-300 rounded hover:border-gray-400 transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-lg font-bold w-12 text-center">{quantity}</span>
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="p-2 border-2 border-gray-300 rounded hover:border-gray-400 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Stock Status */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 text-green-600">
                      <Package className="w-5 h-5" />
                      <span className="font-bold text-sm">In Stock - Ready to Ship</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <button
                      onClick={handleAddToCart}
                      className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-b from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-lg font-bold transition-all shadow-lg hover:shadow-xl"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      Add to Cart
                    </button>
                    <button className="w-full flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-300 hover:border-red-600 text-gray-700 hover:text-red-600 rounded-lg font-bold transition-all">
                      <Heart className="w-5 h-5" />
                      Add to Wishlist
                    </button>
                  </div>

                  {/* Additional Info */}
                  <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
                    <div className="flex items-start gap-2 text-sm">
                      <Truck className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-gray-900">Free Shipping</p>
                        <p className="text-gray-600">On orders over $75</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <Package className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-gray-900">Easy Returns</p>
                        <p className="text-gray-600">30-day return policy</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}