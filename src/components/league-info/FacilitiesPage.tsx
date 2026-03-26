import { useState, useMemo, useEffect, useCallback } from 'react';
import { Search, MapPin, Phone, Building2, Filter, ChevronDown, ChevronRight, ClipboardCheck, RefreshCw, Loader2, AlertTriangle, Globe, FileText, Download } from 'lucide-react';
import { fetchFacilities } from '../../services/sportzsoft/api';

/* ─── Facility Data (normalized from API) ─── */
interface Facility {
  id: number;
  name: string;
  city: string;
  province: string;
  phone?: string;
  postalCode?: string;
  address?: string;
  address2?: string;
  addresslink?: string; // Made optional just in case the API omits it
}

function extractUrlFromHtml(htmlString?: string): string | undefined {
  if (!htmlString) return undefined;
  
  // If it's already a clean URL (starts with http), just return it
  if (htmlString.trim().startsWith('http')) {
    return htmlString.trim();
  }

  // Extract the URL from the href attribute using regex
  const match = htmlString.match(/href=["'](.*?)["']/i);
  return match ? match[1] : undefined;
}

function normalizeFacility(raw: any): Facility {
  return {
    id: raw.FacilityId ?? 0,
    name: raw.FacilityName ?? 'Unknown Facility',
    city: raw.CityName ?? '',
    province: raw.ProvStateCd ?? '',
    phone: raw.PhoneNo || undefined,
    postalCode: raw.PostalZip || undefined,
    address: raw.AddressLine1 || raw.Address || undefined,
    address2: raw.AddressLine2 || undefined,
    // Use the new helper function here:
    addresslink: extractUrlFromHtml(raw.AddressLink),
  };
}

// Get unique provinces from facilities list
function getUniqueProvinces(facilities: Facility[]): string[] {
  return [...new Set(facilities.map(f => f.province).filter(Boolean))].sort();
}

const provinceNames: Record<string, string> = {
  'AB': 'Alberta',
  'BC': 'British Columbia',
  'SK': 'Saskatchewan',
  'MB': 'Manitoba',
  'ON': 'Ontario',
  'QC': 'Quebec',
};

export function FacilitiesPage() {
  const [search, setSearch] = useState('');
  const [provinceFilter, setProvinceFilter] = useState('all');
  const [showSpecs, setShowSpecs] = useState(false);

  // API state
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [rawResponse, setRawResponse] = useState<any>(null);

  const loadFacilities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchFacilities(520);

      setRawResponse(response);

      if (!response || response.Success === false) {
        throw new Error(response?.Message || 'API returned unsuccessful response');
      }

      // The SportzSoft API wraps data in various ways — try common patterns
      let rawList: any[] = [];

      if (Array.isArray(response)) {
        rawList = response;
      } else if (response.Data && Array.isArray(response.Data)) {
        rawList = response.Data;
      } else if (response.Facilities && Array.isArray(response.Facilities)) {
        rawList = response.Facilities;
      } else if (response.Result && Array.isArray(response.Result)) {
        rawList = response.Result;
      } else {
        // Walk the top-level keys looking for the first array
        for (const key of Object.keys(response)) {
          if (Array.isArray(response[key]) && response[key].length > 0) {
            rawList = response[key];
            break;
          }
        }
      }

      if (rawList.length === 0) {
        console.warn('[FacilitiesPage] No facility array found in response. Keys:', Object.keys(response));
        throw new Error('No facilities data found in API response. Check console for raw response.');
      }
      
      const normalized = rawList.map(normalizeFacility);
      // Sort alphabetically by name
      normalized.sort((a, b) => a.name.localeCompare(b.name));
      setFacilities(normalized);
      setLastFetched(new Date());
    } catch (err: any) {
      console.error('[FacilitiesPage] Error loading facilities:', err);
      setError(err.message || 'Failed to load facilities data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFacilities();
  }, [loadFacilities]);

  const provinces = useMemo(() => getUniqueProvinces(facilities), [facilities]);

  const filtered = useMemo(() => {
    return facilities.filter(f => {
      const matchesSearch = !search ||
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        f.city.toLowerCase().includes(search.toLowerCase()) ||
        (f.address && f.address.toLowerCase().includes(search.toLowerCase())) ||
        (f.postalCode && f.postalCode.toLowerCase().includes(search.toLowerCase()));
      const matchesProvince = provinceFilter === 'all' || f.province === provinceFilter;
      return matchesSearch && matchesProvince;
    });
  }, [facilities, search, provinceFilter]);

  const facilitiesByProvince = useMemo(() => {
    const grouped: Record<string, Facility[]> = {};
    filtered.forEach(f => {
      const prov = f.province || 'Unknown';
      if (!grouped[prov]) grouped[prov] = [];
      grouped[prov].push(f);
    });
    return grouped;
  }, [filtered]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-white border-2 border-[#013fac] rounded-lg p-4 sm:p-6">
        <div className="flex items-start gap-3">
          <Building2 className="w-8 h-8 text-[#013fac] shrink-0 mt-1" />
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">RMLL Facilities Directory</h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-green-100 text-green-700 rounded-full border border-green-300">
                <Globe className="w-3 h-3" />
                LIVE DATA
              </span>
            </div>
            <p className="text-sm text-gray-700 mt-2">
              A comprehensive listing of all arenas, recreation centres, and sporting facilities used
              by RMLL teams across Western Canada. Data is sourced live from the SportzSoft league management system.
            </p>
            {!loading && (
              <p className="text-xs text-gray-500 mt-2">
                {facilities.length} facilities listed{provinces.length > 0 ? ` across ${provinces.length} province${provinces.length > 1 ? 's' : ''}` : ''}
                {lastFetched && <> &middot; Last updated {lastFetched.toLocaleTimeString()}</>}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Refresh Button */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={loadFacilities}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-[#013fac] text-white border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-[#0149c9] transition-colors disabled:opacity-50 disabled:hover:bg-[#013fac]"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
      </div>

      {/* ══════════════════════════════════════════════════ */}
      {/* FACILITY SPECIFICATIONS FORM LINK                */}
      {/* ══════════════════════════════════════════════════ */}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-blue-800">
              The <strong>"Facilities Specifications Form"</strong> must be completed for each team home facility.
              The completed form is to be e-mailed to the RMLL Executive Director.
            </p>
            <div className="mt-2">
              <a
                href="/documents"
                className="inline-flex items-center gap-1.5 text-xs font-bold bg-[#013fac] text-white px-3 py-1.5 rounded hover:bg-[#0149c9] transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Go to Documents Library
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════ */}
      {/* REGULATION 6: FACILITY SPECIFICATIONS              */}
      {/* ══════════════════════════════════════════════════ */}

      <div className="border-2 border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <button
          onClick={() => setShowSpecs(!showSpecs)}
          className="w-full flex items-center gap-3 px-4 sm:px-5 py-3 bg-white hover:bg-gray-50 transition-colors text-left"
        >
          <ClipboardCheck className="w-5 h-5 text-[#013fac] shrink-0" />
          <span className="flex-1 font-bold text-gray-900 text-sm sm:text-base">RMLL Regulation 6: Facility Specifications</span>
          {showSpecs
            ? <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
            : <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
          }
        </button>
        {showSpecs && (
          <div className="px-4 sm:px-6 pb-6 pt-3 bg-white border-t border-gray-100 text-sm text-gray-700 leading-relaxed space-y-4">
            {/* 6.1 */}
            <div>
              <p>
                <strong className="text-gray-900">6.1.</strong> Each Franchise is responsible for acquiring their home arena and booking the arena for their home games for the Season (Regular play, Playoff play, RMLL Championship play and Provincial play). Each Division will determine who is responsible for booking an arena for RMLL Championship and Provincial play. The arena must conform to RMLL facility requirements (see Schedule 6), must be available for home games on days and dates as required by the Division (Regular play, Playoff play, RMLL Championship play and Provincial play), must have a Referee Change Room with a shower, and must be approved by the RMLL Executive.
              </p>
            </div>

            {/* 6.1.1 */}
            <div className="ml-4 bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
              <p>
                <strong className="text-gray-900">6.1.1.</strong> Games, (Regular play, Playoff play, RMLL Championship play or Provincial play) may not be held in Soccer Centres or Field Houses unless:
              </p>
              <div className="ml-4 space-y-1 text-sm">
                <p><strong className="text-gray-900">6.1.1.1.</strong> The ALA has approved the facility for Major games and</p>
                <p><strong className="text-gray-900">6.1.1.2.</strong> The majority of teams in the Division vote in favour of using the facility for games and</p>
                <p><strong className="text-gray-900">6.1.1.3.</strong> The RMLL Executive has ratified the use of the facility for games.</p>
              </div>
            </div>

            {/* 6.2 */}
            <div>
              <p>
                <strong className="text-gray-900">6.2.</strong> All Franchises must send to the RMLL Executive Director the specifications of their home arena. See Schedule 6 for Facility Specification Form.
              </p>
            </div>

            {/* 6.3 */}
            <div>
              <p>
                <strong className="text-gray-900">6.3.</strong> All Franchises must enter their home arena and a back-up arena in the RMLL Franchise Management System prior to January 1.
              </p>
            </div>

            {/* 6.4 */}
            <div>
              <p className="font-bold text-gray-900">6.4. The home Franchise is responsible for making sure:</p>
              <div className="ml-4 mt-2 space-y-2">
                <div className="flex gap-2">
                  <span className="font-bold text-gray-900 shrink-0">6.4.1.</span>
                  <span>The arena floor line markings are as per LC Play.</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-bold text-gray-900 shrink-0">6.4.2.</span>
                  <span>The nets are LC approved and the correct size for Division play.</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-bold text-gray-900 shrink-0">6.4.3.</span>
                  <span>The mesh shall be in good condition, black, the correct size and not strung too tightly.</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-bold text-gray-900 shrink-0">6.4.4.</span>
                  <span>Two LC approved shot clocks are installed and operational or a stopwatch and horn is available for the thirty-second timekeeper.</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-bold text-gray-900 shrink-0">6.4.5.</span>
                  <span>The score clock is operational and has an electronic buzzer or gong or bell available for the timekeeper.</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-bold text-gray-900 shrink-0">6.4.6.</span>
                  <span>Score clock to count down penalty minutes.</span>
                </div>
              </div>
            </div>

            {/* 6.5 */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p>
                <strong className="text-gray-900">6.5.</strong> The home Franchise shall be held responsible for assuring the playing area is suitable for all games to the satisfaction of the Referees, and that police protection is provided if the Senior and/or Junior Divisions deem it necessary.
              </p>
            </div>

            <p className="text-xs text-gray-500 italic mt-4">
              Source: RMLL Regulations — Regulation 6: Facilities. See the full Regulations page for complete regulatory text.
              <span className="block mt-1 text-amber-600">
                <strong>Note:</strong> This regulation text is also displayed on the Regulations page. When Regulation 6 is updated there,
                it should also be updated here to maintain consistency.
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-lg border-2 border-gray-200">
          <Loader2 className="w-10 h-10 text-[#013fac] animate-spin mb-4" />
          <p className="text-gray-600 font-medium">Loading facilities from SportzSoft...</p>
          <p className="text-xs text-gray-400 mt-1">Fetching live data from the league management system</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-bold text-red-800 mb-1">Failed to Load Facilities</h3>
              <p className="text-sm text-red-700 mb-3">{error}</p>
              {rawResponse && (
                <details className="mb-3">
                  <summary className="text-xs text-red-600 cursor-pointer hover:underline">Show raw API response</summary>
                  <pre className="mt-2 text-xs bg-red-100 rounded p-3 overflow-auto max-h-48 text-red-800">
                    {JSON.stringify(rawResponse, null, 2)}
                  </pre>
                </details>
              )}
              <button
                onClick={loadFacilities}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content (only when loaded) */}
      {!loading && !error && facilities.length > 0 && (
        <>
          {/* Search & Filters */}
          <div className="bg-white border-2 border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search facilities by name, city, or address..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:border-[#013fac] focus:outline-none transition-colors"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={provinceFilter}
                  onChange={e => setProvinceFilter(e.target.value)}
                  className="pl-9 pr-8 py-2 border-2 border-gray-300 rounded-lg text-sm focus:border-[#013fac] focus:outline-none transition-colors appearance-none bg-white cursor-pointer"
                >
                  <option value="all">All Provinces</option>
                  {provinces.map(p => (
                    <option key={p} value={p}>{provinceNames[p] || p} ({facilities.filter(f => f.province === p).length})</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Showing {filtered.length} of {facilities.length} facilities
              {search && <span> matching "<strong>{search}</strong>"</span>}
            </p>
          </div>

          {/* Facilities Table */}
          {Object.keys(facilitiesByProvince).sort().map(province => (
            <div key={province} className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-0.5 w-4 bg-[#013fac]"></div>
                <h3 className="text-sm font-bold text-[#013fac] uppercase tracking-wider">
                  {provinceNames[province] || province} ({facilitiesByProvince[province].length})
                </h3>
                <div className="h-0.5 flex-1 bg-gradient-to-r from-[#013fac] to-transparent"></div>
              </div>

              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="min-w-full text-xs sm:text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-3 py-2 text-left font-bold text-gray-700 border border-gray-200">Facility</th>
                      <th className="px-3 py-2 text-left font-bold text-gray-700 border border-gray-200 w-28">City</th>
                      <th className="px-3 py-2 text-left font-bold text-gray-700 border border-gray-200 hidden md:table-cell">Address</th>
                      <th className="px-3 py-2 text-left font-bold text-gray-700 border border-gray-200 hidden sm:table-cell whitespace-nowrap">Phone</th>
                      <th className="px-3 py-2 text-center font-bold text-gray-700 border border-gray-200 w-12">Map</th>
                    </tr>
                  </thead>
                  <tbody>
                    {facilitiesByProvince[province].map((f, i) => (
                      <tr key={f.id || `${f.name}-${i}`} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-3 py-2 border border-gray-200">
                          <div className="flex items-start gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-[#013fac] shrink-0 mt-0.5" />
                            <span className="font-semibold text-gray-900">{f.name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 border border-gray-200">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                            <span className="text-gray-700">{f.city}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 border border-gray-200 text-gray-600 hidden md:table-cell">
                          {f.address ? (
                            <span>{f.address}{f.postalCode ? `, ${f.postalCode}` : ''}</span>
                          ) : f.postalCode ? (
                            <span>{f.postalCode}</span>
                          ) : (
                            <span className="text-gray-300">&mdash;</span>
                          )}
                        </td>
                        <td className="px-3 py-2 border border-gray-200 hidden sm:table-cell">
                          {f.phone ? (
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-gray-400 shrink-0" />
                              <a href={`tel:${f.phone}`} className="text-gray-600 font-mono text-xs hover:text-[#013fac] whitespace-nowrap">{f.phone}</a>
                            </div>
                          ) : (
                            <span className="text-gray-300">&mdash;</span>
                          )}
                        </td>
                        <td className="px-3 py-2 border border-gray-200 text-center">
                          {f.addresslink ? (
                            <a
                              href={f.addresslink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center p-1.5 text-[#013fac] hover:bg-blue-50 hover:text-[#0149c9] rounded transition-colors"
                              title="View on Map"
                            >
                              <MapPin className="w-4 h-4" />
                            </a>
                          ) : (
                            <span className="text-gray-300 flex justify-center">&mdash;</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
              <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No facilities found matching your search.</p>
              <p className="text-xs text-gray-400 mt-1">Try adjusting your search terms or province filter.</p>
            </div>
          )}
        </>
      )}

      {/* Empty state when loaded but no data */}
      {!loading && !error && facilities.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No facilities data available.</p>
          <p className="text-xs text-gray-400 mt-1">The API returned an empty result set. Try refreshing.</p>
          <button
            onClick={loadFacilities}
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-[#013fac] text-white rounded hover:bg-[#0149c9] transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      )}

      {/* Footer Note */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
        <p className="font-bold mb-1">Note</p>
        <p>
          Facility data is sourced live from the SportzSoft league management system. Addresses link to Google Maps for directions.
          Facility information is subject to change — contact your division commissioner for the most current venue details.
        </p>
      </div>
    </div>
  );
}