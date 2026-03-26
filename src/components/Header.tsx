import { Menu, Search, User, ChevronDown, Star, Calendar, Trophy, BarChart3, FileText, ChevronRight } from 'lucide-react';
import { useState, useCallback, useEffect, memo } from 'react';
import logoImage from 'figma:asset/fb3af3c32172bf2cdae204929a43046aace488d6.png';
import { useDivision } from '../contexts/DivisionContext';
import { useNavigation } from '../contexts/NavigationContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from './ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from './ui/sheet';
import { SearchModal } from './SearchModal';

export const Header = memo(function Header() {
  const { selectedDivision, setSelectedDivision, selectedSubDivision, setSelectedSubDivision, divisions, subDivisions } = useDivision();
  const { navigateTo } = useNavigation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedDivision, setExpandedDivision] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  
  const navItems = [
    { label: 'NEWS', page: 'news' as const },
    { label: 'SCHEDULE', page: 'schedule' as const },
    { label: 'STANDINGS', page: 'standings' as const },
    { label: 'STATS', page: 'stats' as const },
    { label: 'TEAMS', page: 'teams' as const },
    { label: 'DIVISIONS', page: 'division-info' as const },
  ];

  const handleNavClick = useCallback((page: 'home' | 'schedule' | 'standings' | 'stats' | 'documents' | 'teams' | 'division-info' | 'news', e: React.MouseEvent) => {
    e.preventDefault();
    
    // If we're on league-info page, navigate back to home first
    if (window.location.pathname === '/league-info') {
      (window as any).navigateToPath('/');
      // Store the intended page in sessionStorage so HomePage can navigate to it
      if (page !== 'home') {
        sessionStorage.setItem('rmll-navigate-to', page);
      }
    } else {
      // We're already on home, use the navigation context
      navigateTo(page);
    }
    setMobileMenuOpen(false);
  }, [navigateTo]);

  const handleLeagueInfoClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    (window as any).navigateToPath('/league-info');
  }, []);

  const handleAdminClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    (window as any).navigateToPath('/cms');
  }, []);

  const handleLogoClick = useCallback(() => {
    if (window.location.pathname === '/') {
      navigateTo('home');
    } else {
      (window as any).navigateToPath('/');
    }
  }, [navigateTo]);
  
  const handleSearchNavigate = useCallback((page: string, params?: Record<string, any>) => {
    if (window.location.pathname !== '/') {
      (window as any).navigateToPath('/');
      if (page !== 'home') {
        sessionStorage.setItem('rmll-navigate-to', page);
        if (params) {
          sessionStorage.setItem('rmll-navigate-params', JSON.stringify(params));
        }
      }
    } else {
      navigateTo(page as any, params);
    }
  }, [navigateTo]);

  const handleSearchNavigatePath = useCallback((path: string) => {
    (window as any).navigateToPath(path);
  }, []);

  // Keyboard shortcut: Ctrl/Cmd + K to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="bg-[#001741] text-white sticky top-0 z-50 shadow-lg">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between py-3 sm:py-4">
          {/* Logo */}
          <div className="flex items-center gap-3 sm:gap-8">
            <button onClick={handleLogoClick} className="hover:opacity-80 transition-opacity">
              <img src={logoImage} alt="RMLL Logo" className="h-12 sm:h-14 lg:h-16 w-auto" />
            </button>
            
            {/* Division Selector - Desktop */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="hidden md:flex items-center gap-2 px-3 lg:px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg border-2 border-[#013fac]/40 hover:border-[#013fac] transition-all duration-200 group">
                  <Star className="w-4 h-4 text-[#013fac] flex-shrink-0" />
                  <span className="font-bold text-xs lg:text-sm tracking-wide truncate max-w-[120px] lg:max-w-none">
                    {selectedDivision}
                    {subDivisions[selectedDivision] && selectedSubDivision !== 'All' && ` - ${selectedSubDivision}`}
                  </span>
                  <ChevronDown className="w-4 h-4 flex-shrink-0 group-data-[state=open]:rotate-180 transition-transform" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                className="w-64 bg-[#001741] border-white/20 text-white"
                align="start"
              >
                <DropdownMenuLabel className="text-gray-300 text-xs tracking-wider">
                  FAVORITE DIVISION
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                {divisions.map((division) => {
                  const hasSubDivisions = subDivisions[division];
                  const isExpanded = expandedDivision === division;
                  const isSelected = selectedDivision === division;
                  
                  return (
                    <div key={division}>
                      <DropdownMenuItem
                        onSelect={(e) => {
                          if (hasSubDivisions) {
                            e.preventDefault(); // Prevent dropdown from closing
                            setExpandedDivision(isExpanded ? null : division);
                          } else {
                            setSelectedDivision(division);
                          }
                        }}
                        className={`cursor-pointer font-bold text-sm py-2.5 px-3 ${
                          isSelected
                            ? 'bg-red-600 text-white focus:bg-red-700 focus:text-white'
                            : 'text-gray-200 hover:bg-white/10 focus:bg-white/10 focus:text-white'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            {isSelected && (
                              <Star className="w-4 h-4 text-red-500 fill-red-500 flex-shrink-0" />
                            )}
                            <span className={isSelected ? '' : 'ml-6'}>
                              {division}
                            </span>
                          </div>
                          {hasSubDivisions && (
                            <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                          )}
                        </div>
                      </DropdownMenuItem>
                      
                      {/* Sub-Division Items */}
                      {hasSubDivisions && isExpanded && (
                        <div className="bg-white/5 border-l-2 border-blue-500 ml-3">
                          {subDivisions[division].map((subDiv) => (
                            <DropdownMenuItem
                              key={subDiv}
                              onSelect={() => {
                                setSelectedDivision(division);
                                setSelectedSubDivision(subDiv);
                              }}
                              className={`cursor-pointer text-sm py-2 px-3 ml-3 ${
                                isSelected && selectedSubDivision === subDiv
                                  ? 'bg-blue-600 text-white focus:bg-blue-700 focus:text-white'
                                  : 'text-gray-300 hover:bg-white/10 focus:bg-white/10 focus:text-white'
                              }`}
                            >
                              <div className="flex items-center gap-2 w-full">
                                <span>
                                  {subDiv === 'All' ? 'All Conferences' : subDiv}
                                </span>
                              </div>
                            </DropdownMenuItem>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Navigation - Desktop */}
          <nav className="hidden lg:flex items-center gap-4 xl:gap-6">
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={(e) => handleNavClick(item.page, e)}
                className="text-xs xl:text-sm font-bold hover:text-red-500 transition-colors tracking-wider whitespace-nowrap"
                style={{ fontFamily: 'var(--font-secondary)' }}
              >
                {item.label}
              </button>
            ))}
            
            {/* League Info Link */}
            <button
              onClick={handleLeagueInfoClick}
              className="text-xs xl:text-sm font-bold hover:text-red-500 transition-colors tracking-wider whitespace-nowrap"
              style={{ fontFamily: 'var(--font-secondary)' }}
            >
              LEAGUE INFO
            </button>
          </nav>

          {/* Mobile Quick Actions - Schedule, Standings, Stats */}
          <div className="flex items-center gap-3 sm:gap-4 lg:hidden">
            <button onClick={() => navigateTo('schedule')} className="hover:text-red-500 transition-colors p-1.5" aria-label="Schedule">
              <Calendar className="w-5 h-5" />
            </button>
            <button onClick={() => navigateTo('standings')} className="hover:text-red-500 transition-colors p-1.5" aria-label="Standings">
              <Trophy className="w-5 h-5" />
            </button>
            <button onClick={() => navigateTo('stats')} className="hover:text-red-500 transition-colors p-1.5" aria-label="Stats">
              <BarChart3 className="w-5 h-5" />
            </button>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
            <button onClick={() => setSearchOpen(true)} className="hover:text-red-500 transition-colors hidden sm:block" aria-label="Search">
              <Search className="w-5 h-5" />
            </button>
            <button 
              onClick={handleAdminClick}
              className="hover:text-yellow-400 transition-colors hidden lg:block" 
              aria-label="Admin"
              title="CMS Admin"
            >
              <User className="w-5 h-5 text-yellow-400" />
            </button>
            
            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <button className="lg:hidden hover:text-red-500 transition-colors p-2" aria-label="Menu">
                  <Menu className="w-6 h-6" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-[#001741] text-white border-white/20 w-[85vw] sm:w-[400px]">
                <SheetHeader className="sr-only">
                  <SheetTitle>Navigation Menu</SheetTitle>
                  <SheetDescription>Mobile navigation menu for the Rocky Mountain Lacrosse League</SheetDescription>
                </SheetHeader>
                
                <div className="mt-8 flex flex-col gap-6">
                  {/* Division Selector - Mobile */}
                  <div className="px-4">
                    <p className="text-xs text-gray-400 mb-3 font-bold tracking-wider">FAVORITE DIVISION</p>
                    <select
                      value={selectedDivision}
                      onChange={(e) => setSelectedDivision(e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      {divisions.map((division) => (
                        <option key={division} value={division} className="bg-[#001741] text-white">
                          {division}
                        </option>
                      ))}
                    </select>
                    
                    {/* Sub-Division Selector - Mobile */}
                    {subDivisions[selectedDivision] && (
                      <div className="mt-3">
                        <p className="text-xs text-gray-400 mb-2 font-bold tracking-wider">CONFERENCE</p>
                        <select
                          value={selectedSubDivision}
                          onChange={(e) => setSelectedSubDivision(e.target.value)}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {subDivisions[selectedDivision].map((subDiv) => (
                            <option key={subDiv} value={subDiv} className="bg-[#001741] text-white">
                              {subDiv}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Navigation Links - Mobile */}
                  <nav className="flex flex-col gap-1">
                    {navItems.map((item) => (
                      <button
                        key={item.label}
                        onClick={(e) => handleNavClick(item.page, e)}
                        className="px-4 py-3 font-bold text-sm tracking-wider hover:bg-white/10 rounded-lg transition-colors text-left"
                        style={{ fontFamily: 'var(--font-secondary)' }}
                      >
                        {item.label}
                      </button>
                    ))}
                    
                    {/* League Info Link */}
                    <button
                      onClick={handleLeagueInfoClick}
                      className="px-4 py-3 font-bold text-sm tracking-wider hover:bg-white/10 rounded-lg transition-colors text-left"
                      style={{ fontFamily: 'var(--font-secondary)' }}
                    >
                      LEAGUE INFO
                    </button>
                  </nav>

                  {/* Mobile Actions */}
                  <div className="pt-4 border-t border-white/20 flex flex-col gap-3">
                    <button
                      onClick={() => { setMobileMenuOpen(false); setSearchOpen(true); }}
                      className="flex items-center gap-3 px-4 py-3 font-bold text-sm hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <Search className="w-5 h-5" />
                      Search
                    </button>
                    <button 
                      onClick={handleAdminClick}
                      className="flex items-center gap-3 px-4 py-3 font-bold text-sm hover:bg-white/10 rounded-lg transition-colors text-left text-yellow-400"
                    >
                      <User className="w-5 h-5" />
                      Admin
                    </button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Search Modal */}
      <SearchModal
        open={searchOpen}
        onOpenChange={setSearchOpen}
        onNavigateTo={handleSearchNavigate}
        onNavigateToPath={handleSearchNavigatePath}
      />
    </header>
  );
});