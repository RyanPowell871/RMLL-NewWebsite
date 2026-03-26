import { useState, useEffect } from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { ArrowRight, Star } from 'lucide-react';
import { fetchNews, type NewsArticle } from '../services/cms-api';
import { useNavigation } from '../contexts/NavigationContext';
import lacrosseImage1 from 'figma:asset/80f15548150c7733db009ecee4e155e65049cc24.png';
import lacrosseImage2 from 'figma:asset/0916161549f601551450d7c8f472187de0cba509.png';
import lacrosseImage3 from 'figma:asset/4b404a1e3765d57f2e701ffafd068a1707429b83.png';
import lacrosseImage4 from 'figma:asset/fd786c6823cd81f78208937f436155d975c7d0e0.png';
import lacrosseImage5 from 'figma:asset/b7c4d1c972d03a3755fa2e8e5160f8475603344c.png';

// Fallback images for articles without featured images
const fallbackImages = [lacrosseImage1, lacrosseImage2, lacrosseImage3, lacrosseImage4, lacrosseImage5];

interface NewsItem {
  id: string;
  slug?: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  image: string;
  isSpotlight?: boolean;
  featured?: boolean;
}

// Mock data as fallback
const mockNewsItems: NewsItem[] = [
  {
    id: '1',
    title: 'Sr. Miners Clinch Playoff Spot with Dominant Victory Over Knights',
    excerpt: 'The Miners secured their postseason berth with a commanding 13-4 win in front of a packed home crowd.',
    category: 'GAME RECAP',
    date: 'October 23, 2025',
    image: lacrosseImage4,
    featured: true,
  },
  {
    id: '2',
    title: 'RMLL Player of the Week: Marcus Thompson',
    excerpt: 'The Crude forward recorded 8 goals and 5 assists in two games this week to earn the honor.',
    category: 'PLAYER SPOTLIGHT',
    date: 'October 22, 2025',
    image: lacrosseImage1,
  },
  {
    id: '3',
    title: 'Playoff Picture: What Teams Need to Clinch',
    excerpt: 'A breakdown of the scenarios for each division with three weeks remaining in the regular season.',
    category: 'ANALYSIS',
    date: 'October 21, 2025',
    image: lacrosseImage5,
  },
  {
    id: '4',
    title: 'Rebels Sign Top Junior Prospect From Calgary',
    excerpt: 'The Rebels have signed 2025 junior draft pick Connor Mitchell to a two-year deal.',
    category: 'TRANSACTIONS',
    date: 'October 20, 2025',
    image: lacrosseImage2,
  },
];

export function NewsSection() {
  const [newsItems, setNewsItems] = useState<NewsItem[]>(mockNewsItems);
  const [isLoading, setIsLoading] = useState(true);
  const { navigateTo } = useNavigation();

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    try {
      const articles = await fetchNews({ published: true, limit: 4 });
      
      if (articles.length > 0) {
        // Convert CMS articles to NewsItem format
        const converted: NewsItem[] = articles.map((article, index) => {
          // Resolve image: use featured_image_url from CMS, otherwise fallback
          const resolvedImage = article.featured_image_url || fallbackImages[index % fallbackImages.length];

          return {
            id: article.id,
            slug: article.slug,
            title: article.title,
            excerpt: article.excerpt,
            category: article.category.toUpperCase().replace(/-/g, ' '),
            date: new Date(article.published_date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }),
            image: resolvedImage,
            isSpotlight: !!article.is_spotlight,
            featured: index === 0, // First article is featured
          };
        });
        
        setNewsItems(converted);
      } else {
        // No articles returned, keeping mock data
      }
    } catch (error) {
      console.error('Error loading news:', error);
      // Keep using mock data on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleArticleClick = (item: NewsItem) => {
    if (item.slug) {
      navigateTo('news', { slug: item.slug });
    } else {
      navigateTo('news');
    }
  };

  return (
    <section className="bg-white py-8 sm:py-12 lg:py-16">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-3 sm:gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl text-gray-900 font-bold tracking-tight mb-2">Latest News</h2>
            <div className="h-1 w-16 sm:w-20 bg-[#013fac] rounded"></div>
          </div>
          <button
            onClick={() => navigateTo('news')}
            className="group relative inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 lg:px-5 lg:py-2.5 bg-gradient-to-b from-red-600 to-red-700 text-white rounded font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-red-500 to-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-300 to-transparent opacity-50"></div>
            <span className="relative z-10">View All</span>
            <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 relative z-10 group-hover:translate-x-1 transition-transform duration-200" />
          </button>
        </div>

        <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {/* Featured Story */}
          {newsItems.filter(item => item.featured).map((item) => (
            <div key={item.id} className="lg:col-span-2">
              <button onClick={() => handleArticleClick(item)} className="w-full text-left group block relative overflow-hidden rounded-lg">
                <div className="grid lg:grid-cols-2 gap-0 lg:gap-6 bg-gray-50 rounded-lg overflow-hidden hover:shadow-xl transition-shadow">
                  <div className="relative h-[200px] sm:h-[250px] lg:h-[400px] overflow-hidden">
                    <ImageWithFallback
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full group-hover:scale-105 transition-transform duration-300 object-cover"
                    />
                  </div>
                  <div className="p-4 sm:p-6 lg:p-8 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-2">
                      {item.isSpotlight && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          Spotlight
                        </span>
                      )}
                      <span className="text-[10px] sm:text-xs text-red-600 font-bold tracking-wider">{item.category}</span>
                    </div>
                    <h3 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900 mb-2 sm:mb-3 lg:mb-4 group-hover:text-red-600 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-sm sm:text-base lg:text-lg font-semibold text-gray-600 mb-2 sm:mb-3 lg:mb-4">
                      {item.excerpt}
                    </p>
                    <span className="text-xs sm:text-sm text-gray-500 font-semibold">{item.date}</span>
                  </div>
                </div>
              </button>
            </div>
          ))}

          {/* Other Stories */}
          {newsItems.filter(item => !item.featured).map((item) => (
            <button
              key={item.id}
              onClick={() => handleArticleClick(item)}
              className="text-left group flex flex-col bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="relative h-[180px] sm:h-[200px] lg:h-[240px] overflow-hidden flex-shrink-0">
                <ImageWithFallback
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full group-hover:scale-105 transition-transform duration-300 object-cover"
                />
              </div>
              <div className="p-3 sm:p-4 lg:p-6 flex flex-col flex-1 min-h-0">
                <span className="text-[10px] sm:text-xs text-red-600 mb-1.5 sm:mb-2 block font-bold tracking-wider">{item.category}</span>
                <h3 className="text-base sm:text-lg lg:text-xl xl:text-2xl font-bold text-gray-900 mb-1.5 sm:mb-2 group-hover:text-red-600 transition-colors line-clamp-2">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm lg:text-base text-gray-600 font-semibold mb-2 sm:mb-3 line-clamp-2">
                  {item.excerpt}
                </p>
                <span className="text-[10px] sm:text-xs text-gray-500 font-semibold mt-auto">{item.date}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}