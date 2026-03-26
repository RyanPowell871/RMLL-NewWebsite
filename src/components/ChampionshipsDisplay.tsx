import React, { useState } from 'react';
import { Card } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Trophy, Medal, Award } from 'lucide-react';

interface ChampionshipResult {
  year: string;
  title?: string; // Junior A format
  gold: string;
  silver?: string | null;
  bronze?: string;
}

interface ChampionshipsData {
  provincial?: {
    title: string;
    description?: string;
    trophy?: {
      name: string;
      description: string;
    };
    results?: ChampionshipResult[];
    winners?: ChampionshipResult[]; // Junior A format
  };
  rmll?: {
    title: string;
    description?: string;
    results?: Array<{
      year: string;
      title: string;
      champion: string;
    }>;
  };
  national?: {
    title: string;
    subtitle?: string;
    description?: string;
    trophy?: {
      name: string;
      description: string;
    };
    results?: Array<{
      year: string;
      medal?: string;
      team?: string;
      gold?: string;
      silver?: string;
      bronze?: string;
    }>;
    history?: string[]; // Junior A format - array of historical paragraphs
    jimMcConaghyAward?: { // Junior A format
      title: string;
      description: string;
    };
  };
  division?: {
    title: string;
    description?: string;
    sections?: Array<{
      name: string;
      subtitle?: string;
      champions: Array<{ year: string; team: string; medal?: string; }>;
    }>;
    north?: {
      title: string;
      results: Array<{ year: string; champion: string; }>;
    };
    south?: {
      title: string;
      results: Array<{ year: string; champion: string; }>;
    };
  };
}

interface ChampionshipsDisplayProps {
  data: string | ChampionshipsData | any;
}

export function ChampionshipsDisplay({ data }: ChampionshipsDisplayProps) {
  let champDataParsed: ChampionshipsData;
  
  try {
    // Handle both string and object inputs
    champDataParsed = typeof data === 'string' ? JSON.parse(data) : data;
  } catch (e) {
    return (
      <Card className="border border-gray-200 shadow-sm">
        <div className="p-6">
          <p className="text-sm text-gray-600 italic">Championship history will be updated soon...</p>
        </div>
      </Card>
    );
  }

  const champData = champDataParsed;

  // Determine default tab based on available data
  const defaultTab = champData.provincial ? 'provincial' : champData.national ? 'national' : champData.rmll ? 'rmll' : 'provincial';
  const [activeChampTab, setActiveChampTab] = useState(defaultTab);

  // Determine tab labels based on national championship type
  const isJuniorA = champData.national?.title?.includes('Minto Cup');
  const isCarolPatterson = champData.national?.title?.includes('Carol Patterson');
  const isPresidentsCup = champData.national?.title?.includes('President');
  const nationalTabLabel = isJuniorA ? 'Minto Cup (National)' 
    : isCarolPatterson ? 'Carol Patterson Championship (National)' 
    : isPresidentsCup ? "Presidents' Cup (National)"
    : 'Founders Cup (National)';
  const nationalTabLabelShort = isJuniorA ? 'Minto Cup' 
    : isCarolPatterson ? 'Carol Patterson' 
    : isPresidentsCup ? "Presidents' Cup"
    : 'Founders Cup';

  return (
    <Tabs value={activeChampTab} onValueChange={setActiveChampTab} className="w-full">
      <TabsList className="w-full justify-start mb-6 bg-white border-b border-gray-200 rounded-none h-auto p-0 overflow-x-auto flex-nowrap scrollbar-hide"
        style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {champData.provincial && (
        <TabsTrigger 
          value="provincial" 
          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-3 data-[state=active]:border-b-2 data-[state=active]:border-[#DC2626] data-[state=active]:text-[#DC2626] rounded-none whitespace-nowrap shrink-0"
        >
          <Trophy className="w-4 h-4 hidden sm:block" />
          <span className="font-bold text-xs sm:text-sm">Provincial</span>
        </TabsTrigger>
        )}
        {champData.rmll && (
          <TabsTrigger 
            value="rmll" 
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-3 data-[state=active]:border-b-2 data-[state=active]:border-[#013fac] data-[state=active]:text-[#013fac] rounded-none whitespace-nowrap shrink-0"
          >
            <Award className="w-4 h-4 hidden sm:block" />
            <span className="font-bold text-xs sm:text-sm">RMLL</span>
          </TabsTrigger>
        )}
        {champData.national && (
          <TabsTrigger 
            value="national" 
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-3 data-[state=active]:border-b-2 data-[state=active]:border-[#013fac] data-[state=active]:text-[#013fac] rounded-none whitespace-nowrap shrink-0"
          >
            <Award className="w-4 h-4 hidden sm:block" />
            <span className="font-bold text-xs sm:text-sm"><span className="sm:hidden">{nationalTabLabelShort}</span><span className="hidden sm:inline">{nationalTabLabel}</span></span>
          </TabsTrigger>
        )}
        {champData.division && (
          <TabsTrigger 
            value="division" 
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-3 data-[state=active]:border-b-2 data-[state=active]:border-[#013fac] data-[state=active]:text-[#013fac] rounded-none whitespace-nowrap shrink-0"
          >
            <Medal className="w-4 h-4 hidden sm:block" />
            <span className="font-bold text-xs sm:text-sm">Division</span>
          </TabsTrigger>
        )}
      </TabsList>

      {/* Provincial Championships Tab */}
      <TabsContent value="provincial" className="mt-0">
        {champData.provincial && (
          <Card className="border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-[#DC2626] to-[#991b1b] text-white p-4">
              <div className="flex items-center gap-3">
                <Trophy className="w-6 h-6" />
                <div>
                  <h3 className="text-base uppercase tracking-wide" style={{ fontFamily: 'var(--font-secondary)' }}>
                    {champData.provincial.title}
                  </h3>
                  {champData.provincial.description && (
                    <p className="text-xs text-white/80 mt-1">{champData.provincial.description}</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-5">
              {/* Trophy Info */}
              {champData.provincial.trophy && (
                <div className="bg-blue-50 border-l-4 border-[#DC2626] p-4 mb-5">
                  <h4 className="text-sm font-bold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-secondary)' }}>
                    {champData.provincial.trophy.name}
                  </h4>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                    {champData.provincial.trophy.description}
                  </p>
                </div>
              )}
              <div className="space-y-3">
                {(champData.provincial.results || champData.provincial.winners || []).map((result, idx) => (
                  <Card 
                    key={idx} 
                    className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow bg-white"
                  >
                    <div className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Year Badge */}
                        <div className="flex-shrink-0">
                          <div className="bg-[#DC2626] text-white px-3 py-2 rounded-lg">
                            <p className="text-lg font-bold text-center" style={{ fontFamily: 'var(--font-secondary)' }}>
                              {result.year}
                            </p>
                            {result.title && (
                              <p className="text-xs text-white/80 text-center mt-1 leading-tight">
                                {result.title.replace('Jr. A Provincial Champions', '').replace('Provincial Champions', '').replace('Alberta Champions', '').replace('ALA Provincial Winners', '').trim()}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {/* Results */}
                        <div className="flex-1 space-y-2">
                          {/* Gold */}
                          <div className="flex items-center gap-2">
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-yellow-400 flex-shrink-0">
                              <Medal className="w-4 h-4 text-yellow-700" />
                            </div>
                            <div>
                              <span className="text-xs font-bold text-gray-500 uppercase mr-2">Gold</span>
                              <span className="text-sm font-bold text-gray-900">{result.gold}</span>
                            </div>
                          </div>
                          
                          {/* Silver */}
                          {result.silver && (
                            <div className="flex items-center gap-2">
                              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-300 flex-shrink-0">
                                <Medal className="w-4 h-4 text-gray-600" />
                              </div>
                              <div>
                                <span className="text-xs font-bold text-gray-500 uppercase mr-2">Silver</span>
                                <span className="text-sm font-semibold text-gray-800">{result.silver}</span>
                              </div>
                            </div>
                          )}
                          
                          {/* Bronze */}
                          {result.bronze && (
                            <div className="flex items-center gap-2">
                              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-400 flex-shrink-0">
                                <Medal className="w-4 h-4 text-orange-700" />
                              </div>
                              <div>
                                <span className="text-xs font-bold text-gray-500 uppercase mr-2">Bronze</span>
                                <span className="text-sm font-semibold text-gray-800">{result.bronze}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </Card>
        )}
      </TabsContent>

      {/* RMLL Championships Tab */}
      <TabsContent value="rmll" className="mt-0">
        {champData.rmll && (
          <Card className="border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-[#013fac] to-[#0F2942] text-white p-4">
              <div className="flex items-center gap-3">
                <Award className="w-6 h-6" />
                <div>
                  <h3 className="text-base uppercase tracking-wide" style={{ fontFamily: 'var(--font-secondary)' }}>
                    {champData.rmll.title}
                  </h3>
                  {champData.rmll.description && (
                    <p className="text-xs text-white/80 mt-1">{champData.rmll.description}</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-5">
              {/* Results */}
              {champData.rmll.results && champData.rmll.results.length > 0 && (
                <div className="space-y-3">
                  {champData.rmll.results.map((result, idx) => (
                    <Card 
                      key={idx} 
                      className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow bg-white"
                    >
                      <div className="p-4">
                        <div className="flex items-start gap-4">
                          {/* Year Badge */}
                          <div className="flex-shrink-0">
                            <div className="bg-[#013fac] text-white px-3 py-2 rounded-lg">
                              <p className="text-lg font-bold text-center" style={{ fontFamily: 'var(--font-secondary)' }}>
                                {result.year}
                              </p>
                            </div>
                          </div>
                          
                          {/* Results */}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-yellow-400 flex-shrink-0">
                                <Trophy className="w-4 h-4 text-yellow-700" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-gray-500 uppercase mb-1">{result.title}</p>
                                <p className="text-sm font-bold text-gray-900">{result.champion}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </Card>
        )}
      </TabsContent>

      {/* National Championships (Founders Cup) Tab */}
      <TabsContent value="national" className="mt-0">
        {champData.national && (
          <Card className="border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-[#013fac] to-[#0F2942] text-white p-4">
              <div className="flex items-center gap-3">
                <Award className="w-6 h-6" />
                <div>
                  <h3 className="text-base uppercase tracking-wide" style={{ fontFamily: 'var(--font-secondary)' }}>
                    {champData.national.title}
                  </h3>
                  {champData.national.subtitle && (
                    <p className="text-xs text-white/80 mt-1">{champData.national.subtitle}</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-5">
              {/* Description */}
              {champData.national.description && (
                <div className="bg-blue-50 border-l-4 border-[#013fac] p-4 mb-5">
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                    {champData.national.description}
                  </p>
                </div>
              )}
              
              {/* History */}
              {champData.national.history && (
                <div className="space-y-3 mb-5">
                  {champData.national.history.map((paragraph, idx) => (
                    <p key={idx} className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                      {paragraph}
                    </p>
                  ))}
                </div>
              )}
              
              {/* Jim McConaghy Award */}
              {champData.national.jimMcConaghyAward && (
                <div className="bg-blue-50 border-l-4 border-[#013fac] p-4 mb-5">
                  <h4 className="text-sm font-bold text-gray-700 leading-relaxed whitespace-pre-line">
                    {champData.national.jimMcConaghyAward.title}
                  </h4>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                    {champData.national.jimMcConaghyAward.description}
                  </p>
                </div>
              )}
              
              {/* Results */}
              {champData.national.results && champData.national.results.length > 0 && (
                <div className="space-y-3">
                  {champData.national.results.map((result, idx) => (
                    <Card 
                      key={idx} 
                      className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow bg-white"
                    >
                      <div className="p-4">
                        <div className="flex items-start gap-4">
                          {/* Year Badge */}
                          <div className="flex-shrink-0">
                            <div className="bg-[#013fac] text-white px-3 py-2 rounded-lg">
                              <p className="text-lg font-bold text-center" style={{ fontFamily: 'var(--font-secondary)' }}>
                                {result.year}
                              </p>
                            </div>
                          </div>
                          
                          {/* Results */}
                          <div className="flex-1 space-y-2">
                            {/* Gold */}
                            {result.gold && (
                              <div className="flex items-center gap-2">
                                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-yellow-400 flex-shrink-0">
                                  <Medal className="w-4 h-4 text-yellow-700" />
                                </div>
                                <div>
                                  <span className="text-xs font-bold text-gray-500 uppercase mr-2">Gold</span>
                                  <span className="text-sm font-bold text-gray-900">{result.gold}</span>
                                </div>
                              </div>
                            )}
                            
                            {/* Silver */}
                            {result.silver && (
                              <div className="flex items-center gap-2">
                                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-300 flex-shrink-0">
                                  <Medal className="w-4 h-4 text-gray-600" />
                                </div>
                                <div>
                                  <span className="text-xs font-bold text-gray-500 uppercase mr-2">Silver</span>
                                  <span className="text-sm font-semibold text-gray-800">{result.silver}</span>
                                </div>
                              </div>
                            )}
                            
                            {/* Bronze */}
                            {result.bronze && (
                              <div className="flex items-center gap-2">
                                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-400 flex-shrink-0">
                                  <Medal className="w-4 h-4 text-orange-700" />
                                </div>
                                <div>
                                  <span className="text-xs font-bold text-gray-500 uppercase mr-2">Bronze</span>
                                  <span className="text-sm font-semibold text-gray-800">{result.bronze}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </Card>
        )}
      </TabsContent>

      {/* Division Championships Tab */}
      <TabsContent value="division" className="mt-0">
        {champData.division && (
          <div className="space-y-6">
            {/* Sections Format (for multiple divisions/championships) */}
            {champData.division.sections && champData.division.sections.map((section, sectionIdx) => (
              <Card key={sectionIdx} className="border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-[#013fac] to-[#0F2942] text-white p-4">
                  <div className="flex items-center gap-3">
                    <Trophy className="w-6 h-6" />
                    <div>
                      <h3 className="text-base uppercase tracking-wide" style={{ fontFamily: 'var(--font-secondary)' }}>
                        {section.name}
                      </h3>
                      {section.subtitle && (
                        <p className="text-xs text-white/80 mt-1">{section.subtitle}</p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="p-5">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {section.champions.map((champ, idx) => (
                      <div 
                        key={idx}
                        className="bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200 rounded-lg p-3 hover:shadow-md transition-shadow"
                      >
                        <div className="text-center">
                          <p className="text-lg font-bold text-blue-600 mb-1" style={{ fontFamily: 'var(--font-secondary)' }}>
                            {champ.year}
                          </p>
                          <p className="text-xs font-semibold text-gray-800 leading-tight">
                            {champ.team}
                          </p>
                          {champ.medal && (
                            <p className="text-xs text-gray-500 mt-1 uppercase">
                              {champ.medal}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ))}

            {/* North Division */}
            {champData.division.north && (
              <Card className="border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4">
                  <div className="flex items-center gap-3">
                    <Trophy className="w-6 h-6" />
                    <h3 className="text-base uppercase tracking-wide" style={{ fontFamily: 'var(--font-secondary)' }}>
                      {champData.division.north.title}
                    </h3>
                  </div>
                </div>
                
                <div className="p-5">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {champData.division.north.results.map((result, idx) => (
                      <div 
                        key={idx}
                        className="bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200 rounded-lg p-3 hover:shadow-md transition-shadow"
                      >
                        <div className="text-center">
                          <p className="text-lg font-bold text-blue-600 mb-1" style={{ fontFamily: 'var(--font-secondary)' }}>
                            {result.year}
                          </p>
                          <p className="text-xs font-semibold text-gray-800 leading-tight">
                            {result.champion}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* South Division */}
            {champData.division.south && (
              <Card className="border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-[#DC2626] to-[#991b1b] text-white p-4">
                  <div className="flex items-center gap-3">
                    <Trophy className="w-6 h-6" />
                    <h3 className="text-base uppercase tracking-wide" style={{ fontFamily: 'var(--font-secondary)' }}>
                      {champData.division.south.title}
                    </h3>
                  </div>
                </div>
                
                <div className="p-5">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {champData.division.south.results.map((result, idx) => (
                      <div 
                        key={idx}
                        className="bg-gradient-to-br from-red-50 to-white border-2 border-red-200 rounded-lg p-3 hover:shadow-md transition-shadow"
                      >
                        <div className="text-center">
                          <p className="text-lg font-bold text-[#DC2626] mb-1" style={{ fontFamily: 'var(--font-secondary)' }}>
                            {result.year}
                          </p>
                          <p className="text-xs font-semibold text-gray-800 leading-tight">
                            {result.champion}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}