import { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { useNavigation } from '../contexts/NavigationContext';
import { fetchNews, fetchNewsArticle, type NewsArticle } from '../services/cms-api';
import { ArrowLeft, Calendar, User, Tag, ChevronRight, Star } from 'lucide-react';

// Team logo imports for image asset resolution
import calgaryIrishLogo from 'figma:asset/20b3d6476fbcd987de5d32696e43ad208f867633.png';
import intentToPlayImg from 'figma:asset/fb92f556df5ab3ca43f7c34cdf316f8049336fad.png';
import axemenLogo from 'figma:asset/64eedd4b445409e8ce842a49079db7489b16d71c.png';
import lacrosseImage1 from 'figma:asset/80f15548150c7733db009ecee4e155e65049cc24.png';
import lacrosseImage2 from 'figma:asset/0916161549f601551450d7c8f472187de0cba509.png';
import lacrosseImage3 from 'figma:asset/4b404a1e3765d57f2e701ffafd068a1707429b83.png';

const IMAGE_ASSET_MAP: Record<string, string> = {
  'calgary-irish-logo': calgaryIrishLogo,
  'intent-to-play-2026': intentToPlayImg,
  'axemen-logo': axemenLogo,
};

const fallbackImages = [lacrosseImage1, lacrosseImage2, lacrosseImage3];

const CATEGORY_LABELS: Record<string, string> = {
  'general': 'General',
  'game-recap': 'Game Recap',
  'player-spotlight': 'Player Spotlight',
  'team-news': 'Team News',
  'league-update': 'League Update',
  'playoffs': 'Playoffs',
  'awards': 'Awards',
  'community': 'Community',
};

const CATEGORY_COLORS: Record<string, string> = {
  'general': 'bg-gray-100 text-gray-700',
  'game-recap': 'bg-blue-100 text-blue-700',
  'player-spotlight': 'bg-purple-100 text-purple-700',
  'team-news': 'bg-red-100 text-red-700',
  'league-update': 'bg-amber-100 text-amber-700',
  'playoffs': 'bg-green-100 text-green-700',
  'awards': 'bg-yellow-100 text-yellow-700',
  'community': 'bg-teal-100 text-teal-700',
};

function resolveImage(article: NewsArticle, index: number): string {
  const assetKey = (article as any)._image_asset_key;
  if (assetKey && IMAGE_ASSET_MAP[assetKey]) return IMAGE_ASSET_MAP[assetKey];
  if (article.featured_image_url) return article.featured_image_url;
  return fallbackImages[index % fallbackImages.length];
}

function isLogoImage(article: NewsArticle): boolean {
  const assetKey = (article as any)._image_asset_key;
  return !!assetKey;
}

function getImagePositionClass(article: NewsArticle): string {
  const pos = article.image_position || 'center';
  if (pos === 'top') return 'object-top';
  if (pos === 'bottom') return 'object-bottom';
  return 'object-center';
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// ============================================
// NEWS LISTING VIEW
// ============================================

function NewsListing({ onSelectArticle }: { onSelectArticle: (slug: string) => void }) {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    try {
      const data = await fetchNews({ published: true });
      setArticles(data);
    } catch (error) {
      console.error('Error loading news articles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const categories = ['all', ...Array.from(new Set(articles.map(a => a.category)))];

  const filtered = selectedCategory === 'all'
    ? articles
    : articles.filter(a => a.category === selectedCategory);

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-500 font-semibold text-sm">Loading news...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
              selectedCategory === cat
                ? 'bg-[#013fac] text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat === 'all' ? 'All News' : (CATEGORY_LABELS[cat] || cat)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg font-semibold">No articles found in this category.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Featured (first) article */}
          {filtered.length > 0 && (
            <button
              onClick={() => onSelectArticle(filtered[0].slug)}
              className="w-full text-left group"
            >
              <div className="grid lg:grid-cols-2 gap-0 lg:gap-8 bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300">
                <div className={`relative h-[220px] sm:h-[280px] lg:h-[380px] overflow-hidden ${
                  isLogoImage(filtered[0]) ? 'bg-gray-50 flex items-center justify-center' : ''
                }`}>
                  <ImageWithFallback
                    src={resolveImage(filtered[0], 0)}
                    alt={filtered[0].title}
                    className={`w-full h-full group-hover:scale-105 transition-transform duration-500 ${
                      isLogoImage(filtered[0]) ? 'object-contain p-8 max-h-[260px]' : `object-cover ${getImagePositionClass(filtered[0])}`
                    }`}
                  />
                </div>
                <div className="p-5 sm:p-6 lg:p-8 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    {filtered[0].is_spotlight && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        Spotlight
                      </span>
                    )}
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold w-fit ${
                      CATEGORY_COLORS[filtered[0].category] || 'bg-gray-100 text-gray-700'
                    }`}>
                      {CATEGORY_LABELS[filtered[0].category] || filtered[0].category}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-3 group-hover:text-red-600 transition-colors leading-tight">
                    {filtered[0].title}
                  </h2>
                  <p className="text-sm sm:text-base text-gray-600 font-medium mb-4 line-clamp-3">
                    {filtered[0].excerpt}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-400 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(filtered[0].published_date)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      {filtered[0].author}
                    </span>
                  </div>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-[#013fac] group-hover:text-red-600 transition-colors">
                    Read Full Article <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </button>
          )}

          {/* Remaining articles grid */}
          {filtered.length > 1 && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.slice(1).map((article, idx) => (
                <button
                  key={article.id || article.slug}
                  onClick={() => onSelectArticle(article.slug)}
                  className="text-left group bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300"
                >
                  <div className={`relative h-[180px] sm:h-[200px] overflow-hidden ${
                    isLogoImage(article) ? 'bg-gray-50 flex items-center justify-center' : ''
                  }`}>
                    <ImageWithFallback
                      src={resolveImage(article, idx + 1)}
                      alt={article.title}
                      className={`w-full h-full group-hover:scale-105 transition-transform duration-500 ${
                        isLogoImage(article) ? 'object-contain p-6 max-h-[160px]' : `object-cover ${getImagePositionClass(article)}`
                      }`}
                    />
                  </div>
                  <div className="p-4 sm:p-5">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold mb-2 ${
                      CATEGORY_COLORS[article.category] || 'bg-gray-100 text-gray-700'
                    }`}>
                      {CATEGORY_LABELS[article.category] || article.category}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 group-hover:text-red-600 transition-colors leading-snug line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 font-medium mb-3 line-clamp-2">
                      {article.excerpt}
                    </p>
                    <div className="flex items-center gap-3 text-[10px] sm:text-xs text-gray-400 font-semibold">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(article.published_date)}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// ARTICLE DETAIL VIEW
// ============================================

function ArticleDetail({ slug, onBack }: { slug: string; onBack: () => void }) {
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadArticle();
  }, [slug]);

  const loadArticle = async () => {
    setIsLoading(true);
    try {
      const data = await fetchNewsArticle(slug);
      setArticle(data);
    } catch (error) {
      console.error('Error loading article:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-500 font-semibold text-sm">Loading article...</p>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Article Not Found</h2>
        <p className="text-gray-500 mb-6">The article you're looking for doesn't exist or has been removed.</p>
        <button onClick={onBack} className="inline-flex items-center gap-2 text-[#013fac] font-bold hover:text-red-600 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to News
        </button>
      </div>
    );
  }

  const heroImage = resolveImage(article, 0);
  const isLogo = isLogoImage(article);
  const tags = article.tags || [];

  return (
    <article className="max-w-4xl mx-auto">
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-[#013fac] transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to All News
      </button>

      {/* Hero image */}
      <div className={`relative rounded-xl overflow-hidden mb-8 ${
        isLogo ? 'bg-gray-50 h-[200px] sm:h-[260px] flex items-center justify-center' : 'h-[250px] sm:h-[350px] lg:h-[420px]'
      }`}>
        <ImageWithFallback
          src={heroImage}
          alt={article.title}
          className={`w-full h-full ${isLogo ? 'object-contain p-8 max-h-[220px]' : `object-cover ${getImagePositionClass(article)}`}`}
        />
      </div>

      {/* Meta info */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
          CATEGORY_COLORS[article.category] || 'bg-gray-100 text-gray-700'
        }`}>
          {CATEGORY_LABELS[article.category] || article.category}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-gray-400 font-semibold">
          <Calendar className="w-3.5 h-3.5" />
          {formatDate(article.published_date)}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-gray-400 font-semibold">
          <User className="w-3.5 h-3.5" />
          {article.author}
        </span>
      </div>

      {/* Title */}
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-6 leading-tight">
        {article.title}
      </h1>

      {/* Divider */}
      <div className="h-1 w-20 bg-[#013fac] rounded mb-8"></div>

      {/* Article content */}
      <div
        className="font-sans prose prose-lg max-w-none
          prose-headings:text-gray-900 prose-headings:font-bold
          prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4
          prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4
          prose-li:text-gray-700 prose-li:leading-relaxed
          prose-ul:my-4 prose-ol:my-4
          prose-a:text-[#013fac] prose-a:font-semibold prose-a:underline hover:prose-a:text-red-600
          prose-strong:text-gray-900
          [&_ul]:list-disc [&_ul]:pl-6
          [&_ol]:list-decimal [&_ol]:pl-6
          [&_li]:mb-2
          [&_a]:text-[#013fac] [&_a]:font-semibold [&_a]:underline
        "
        dangerouslySetInnerHTML={{ __html: article.content }}
      />

      {/* Tags */}
      {tags.length > 0 && (
        <div className="mt-10 pt-6 border-t border-gray-200">
          <div className="flex items-center gap-2 flex-wrap">
            <Tag className="w-4 h-4 text-gray-400" />
            {tags.map(tag => (
              <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Back to news */}
      <div className="mt-10 pt-6 border-t border-gray-200">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-bold text-[#013fac] hover:text-red-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to All News
        </button>
      </div>
    </article>
  );
}

// ============================================
// NEWS PAGE (MAIN EXPORT)
// ============================================

export function NewsPage() {
  const { navigationParams, navigateTo } = useNavigation();
  const [selectedSlug, setSelectedSlug] = useState<string | null>(
    navigationParams?.slug || null
  );

  useEffect(() => {
    if (navigationParams?.slug) {
      setSelectedSlug(navigationParams.slug);
    }
  }, [navigationParams?.slug]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Page header - only show on listing view */}
        {!selectedSlug && (
          <div className="mb-8">
            <div className="flex items-center gap-2 text-sm text-gray-400 font-semibold mb-4">
              <button onClick={() => navigateTo('home')} className="hover:text-[#013fac] transition-colors">Home</button>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-gray-700">News</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-2">RMLL News</h1>
            <div className="h-1 w-20 bg-[#013fac] rounded"></div>
          </div>
        )}

        {/* Breadcrumb for article view */}
        {selectedSlug && (
          <div className="flex items-center gap-2 text-sm text-gray-400 font-semibold mb-6">
            <button onClick={() => navigateTo('home')} className="hover:text-[#013fac] transition-colors">Home</button>
            <ChevronRight className="w-3.5 h-3.5" />
            <button onClick={() => setSelectedSlug(null)} className="hover:text-[#013fac] transition-colors">News</button>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-700">Article</span>
          </div>
        )}

        {selectedSlug ? (
          <ArticleDetail slug={selectedSlug} onBack={() => setSelectedSlug(null)} />
        ) : (
          <NewsListing onSelectArticle={setSelectedSlug} />
        )}
      </div>
      <Footer />
    </div>
  );
}

export default NewsPage;