import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Save, AlertCircle, CheckCircle2, Loader2, Info, Calendar, Users, Award, Trophy, FileText, ArrowRightLeft, ExternalLink, Database } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { SeasonInfoEditor } from './SeasonInfoEditor';
import { AwardsEditor } from './AwardsEditor';
import { ChampionshipsEditor } from './ChampionshipsEditor';

const divisions = [
  'Senior B',
  'Senior C',
  'Junior A',
  'Junior B Tier I',
  'Junior B Tier II',
  'Junior B Tier III',
  'Alberta Major Senior Female',
  'Alberta Major Female'
];

interface DivisionData {
  divisionDescription?: string;
  divisionInfo?: {
    teams: string;
    playerAges: string;
    graduatingDraft: string;
    playingRights: string;
    minGames: string;
    outOfProvince: string;
    outOfCountry: string;
    // Additional division-specific fields
    otherJurisdiction?: string;
    regularSeasonStandings?: string;
    tryouts?: string;
    northGraduatingDraft?: string;
    centralGraduatingDraft?: string;
    southGraduatingDraft?: string;
    protectedList?: string;
    draftedProtectedPlayers?: string;
    freeAgent?: string;
    firstYearRegistration?: string;
    // Alberta Major Female specific fields
    instagram?: string;
    draftInfo?: string;
    protectedListInfo?: string;
    calgaryFreeAgents?: string;
    stAlbertDrillers?: string;
    sherwoodParkTitans?: string;
    capitalRegionSaints?: string;
    redDeerRiot?: string;
    freeAgents?: string;
    returningPlayers?: string;
  };
  seasonInfo?: string;
  awards?: string;
  championships?: string;
}

function SportzSoftDataNotice({ title, description }: { title: string; description: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5 text-teal-600" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-700 rounded-lg p-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-teal-100 dark:bg-teal-800 flex items-center justify-center shrink-0">
              <ExternalLink className="w-5 h-5 text-teal-700 dark:text-teal-300" />
            </div>
            <div>
              <h4 className="font-semibold text-teal-900 dark:text-teal-100 mb-1">
                Powered by SportzSoft API
              </h4>
              <p className="text-sm text-teal-700 dark:text-teal-300 mb-3">
                This data is pulled live from the SportzSoft league management system and displayed automatically on the website. It does not need to be managed through the CMS.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-800 dark:text-teal-200 dark:border-teal-600">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Live Data
                </Badge>
                <Badge variant="outline" className="border-teal-300 text-teal-700 dark:border-teal-600 dark:text-teal-300">
                  Auto-synced
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DivisionManager() {
  const [selectedDivision, setSelectedDivision] = useState(divisions[0]);
  const [activeTab, setActiveTab] = useState('division-info');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Division Description
  const [divisionDescription, setDivisionDescription] = useState('');

  // Division Info fields
  const [teams, setTeams] = useState('');
  const [playerAges, setPlayerAges] = useState('');
  const [graduatingDraft, setGraduatingDraft] = useState('');
  const [playingRights, setPlayingRights] = useState('');
  const [minGames, setMinGames] = useState('');
  const [outOfProvince, setOutOfProvince] = useState('');
  const [outOfCountry, setOutOfCountry] = useState('');

  // Division-specific fields
  const [otherJurisdiction, setOtherJurisdiction] = useState('');
  const [regularSeasonStandings, setRegularSeasonStandings] = useState('');
  const [tryouts, setTryouts] = useState('');
  const [northGraduatingDraft, setNorthGraduatingDraft] = useState('');
  const [centralGraduatingDraft, setCentralGraduatingDraft] = useState('');
  const [southGraduatingDraft, setSouthGraduatingDraft] = useState('');
  const [protectedList, setProtectedList] = useState('');
  const [draftedProtectedPlayers, setDraftedProtectedPlayers] = useState('');
  const [freeAgent, setFreeAgent] = useState('');
  const [firstYearRegistration, setFirstYearRegistration] = useState('');
  // Alberta Major Female specific
  const [instagram, setInstagram] = useState('');
  const [draftInfo, setDraftInfo] = useState('');
  const [protectedListInfo, setProtectedListInfo] = useState('');
  const [calgaryFreeAgents, setCalgaryFreeAgents] = useState('');
  const [stAlbertDrillers, setStAlbertDrillers] = useState('');
  const [sherwoodParkTitans, setSherwoodParkTitans] = useState('');
  const [capitalRegionSaints, setCapitalRegionSaints] = useState('');
  const [redDeerRiot, setRedDeerRiot] = useState('');
  const [freeAgentsAMF, setFreeAgentsAMF] = useState('');
  const [returningPlayers, setReturningPlayers] = useState('');

  // Other tab fields
  const [seasonInfo, setSeasonInfo] = useState('');
  const [awards, setAwards] = useState('');
  const [championships, setChampionships] = useState('');

  // Load division data
  useEffect(() => {
    loadDivisionData();
  }, [selectedDivision]);

  const loadDivisionData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9a1ba23f/division/${encodeURIComponent(selectedDivision)}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data: DivisionData = await response.json();
        
        // Load division description
        setDivisionDescription(data.divisionDescription || '');
        
        // Load division info fields
        setTeams(data.divisionInfo?.teams || '');
        setPlayerAges(data.divisionInfo?.playerAges || '');
        setGraduatingDraft(data.divisionInfo?.graduatingDraft || '');
        setPlayingRights(data.divisionInfo?.playingRights || '');
        setMinGames(data.divisionInfo?.minGames || '');
        setOutOfProvince(data.divisionInfo?.outOfProvince || '');
        setOutOfCountry(data.divisionInfo?.outOfCountry || '');

        // Load division-specific fields
        setOtherJurisdiction(data.divisionInfo?.otherJurisdiction || '');
        setRegularSeasonStandings(data.divisionInfo?.regularSeasonStandings || '');
        setTryouts(data.divisionInfo?.tryouts || '');
        setNorthGraduatingDraft(data.divisionInfo?.northGraduatingDraft || '');
        setCentralGraduatingDraft(data.divisionInfo?.centralGraduatingDraft || '');
        setSouthGraduatingDraft(data.divisionInfo?.southGraduatingDraft || '');
        setProtectedList(data.divisionInfo?.protectedList || '');
        setDraftedProtectedPlayers(data.divisionInfo?.draftedProtectedPlayers || '');
        setFreeAgent(data.divisionInfo?.freeAgent || '');
        setFirstYearRegistration(data.divisionInfo?.firstYearRegistration || '');
        // Alberta Major Female specific
        setInstagram(data.divisionInfo?.instagram || '');
        setDraftInfo(data.divisionInfo?.draftInfo || '');
        setProtectedListInfo(data.divisionInfo?.protectedListInfo || '');
        setCalgaryFreeAgents(data.divisionInfo?.calgaryFreeAgents || '');
        setStAlbertDrillers(data.divisionInfo?.stAlbertDrillers || '');
        setSherwoodParkTitans(data.divisionInfo?.sherwoodParkTitans || '');
        setCapitalRegionSaints(data.divisionInfo?.capitalRegionSaints || '');
        setRedDeerRiot(data.divisionInfo?.redDeerRiot || '');
        setFreeAgentsAMF(data.divisionInfo?.freeAgents || '');
        setReturningPlayers(data.divisionInfo?.returningPlayers || '');

        // Load other tab fields
        setSeasonInfo(data.seasonInfo || '');
        
        // Handle awards - convert to string if it's an object
        if (typeof data.awards === 'object' && data.awards !== null) {
          setAwards(JSON.stringify(data.awards, null, 2));
        } else {
          setAwards(data.awards || '');
        }
        
        // Handle championships - convert to string if it's an object
        if (typeof data.championships === 'object' && data.championships !== null) {
          setChampionships(JSON.stringify(data.championships, null, 2));
        } else {
          setChampionships(data.championships || '');
        }
      }
    } catch (err) {
      console.error('Error loading division data:', err);
      setError('Failed to load division data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const data: DivisionData = {
        divisionDescription,
        divisionInfo: {
          teams,
          playerAges,
          graduatingDraft,
          playingRights,
          minGames,
          outOfProvince,
          outOfCountry,
          // Division-specific fields
          otherJurisdiction,
          regularSeasonStandings,
          tryouts,
          northGraduatingDraft,
          centralGraduatingDraft,
          southGraduatingDraft,
          protectedList,
          draftedProtectedPlayers,
          freeAgent,
          firstYearRegistration,
          // Alberta Major Female specific
          instagram,
          draftInfo,
          protectedListInfo,
          calgaryFreeAgents,
          stAlbertDrillers,
          sherwoodParkTitans,
          capitalRegionSaints,
          redDeerRiot,
          freeAgents: freeAgentsAMF,
          returningPlayers,
        },
        seasonInfo,
        awards,
        championships,
      };

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9a1ba23f/division/${encodeURIComponent(selectedDivision)}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save division data');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving division data:', err);
      setError('Failed to save division data');
    } finally {
      setSaving(false);
    }
  };

  // Check if the current tab has editable content (not SportzSoft tabs)
  const isEditableTab = !['drafts', 'protected-list', 'transactions'].includes(activeTab);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Division Manager</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Manage content for all division pages including rules, season info, awards, and more.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Division data saved successfully!
          </AlertDescription>
        </Alert>
      )}

      {/* Division Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Division</CardTitle>
          <CardDescription>Choose which division to edit</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedDivision} onValueChange={setSelectedDivision}>
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Select Division" />
            </SelectTrigger>
            <SelectContent>
              {divisions.map((division) => (
                <SelectItem key={division} value={division}>
                  {division}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#013fac]" />
        </div>
      ) : (
        <>
          {/* Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-7">
              <TabsTrigger value="division-info" className="text-xs sm:text-sm">
                <Info className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Division </span>Info
              </TabsTrigger>
              <TabsTrigger value="season-info" className="text-xs sm:text-sm">
                <Calendar className="w-4 h-4 mr-1" />
                Season
              </TabsTrigger>
              <TabsTrigger value="drafts" className="text-xs sm:text-sm">
                <Users className="w-4 h-4 mr-1" />
                Drafts
              </TabsTrigger>
              <TabsTrigger value="protected-list" className="text-xs sm:text-sm">
                <FileText className="w-4 h-4 mr-1" />
                Protected
              </TabsTrigger>
              <TabsTrigger value="transactions" className="text-xs sm:text-sm">
                <ArrowRightLeft className="w-4 h-4 mr-1" />
                Transactions
              </TabsTrigger>
              <TabsTrigger value="awards" className="text-xs sm:text-sm">
                <Award className="w-4 h-4 mr-1" />
                Awards
              </TabsTrigger>
              <TabsTrigger value="championships" className="text-xs sm:text-sm">
                <Trophy className="w-4 h-4 mr-1" />
                Championships
              </TabsTrigger>
            </TabsList>

            {/* Division Info Tab */}
            <TabsContent value="division-info" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Division Information</CardTitle>
                  <CardDescription>Rules, eligibility, and regulations for {selectedDivision}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="divisionDescription" className="text-base font-bold">Division Description</Label>
                    <p className="text-xs text-gray-500">This text appears prominently at the top of the division page as an overview/about section. Use line breaks to separate paragraphs.</p>
                    <Textarea
                      id="divisionDescription"
                      value={divisionDescription}
                      onChange={(e) => setDivisionDescription(e.target.value)}
                      placeholder="Enter a description of this division - its history, values, level of play, etc."
                      rows={8}
                      className="font-normal"
                    />
                  </div>

                  <hr className="my-2 border-gray-200" />

                  <div className="space-y-2">
                    <Label htmlFor="teams">Teams</Label>
                    <Textarea
                      id="teams"
                      value={teams}
                      onChange={(e) => setTeams(e.target.value)}
                      placeholder="e.g., 8 teams compete in the Senior B division."
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="playerAges">Player Ages</Label>
                    <Textarea
                      id="playerAges"
                      value={playerAges}
                      onChange={(e) => setPlayerAges(e.target.value)}
                      placeholder="e.g., Players must be 21 years of age or older on January 1st of the current year."
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="graduatingDraft">Graduating Junior Entry Draft</Label>
                    <Textarea
                      id="graduatingDraft"
                      value={graduatingDraft}
                      onChange={(e) => setGraduatingDraft(e.target.value)}
                      placeholder="e.g., Not applicable - Senior divisions do not participate in the draft."
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="playingRights">Playing Rights</Label>
                    <Textarea
                      id="playingRights"
                      value={playingRights}
                      onChange={(e) => setPlayingRights(e.target.value)}
                      placeholder="e.g., Teams may protect up to 15 players from the previous season."
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="minGames">Minimum Games for Playoff Eligibility</Label>
                    <Textarea
                      id="minGames"
                      value={minGames}
                      onChange={(e) => setMinGames(e.target.value)}
                      placeholder="e.g., Players must play a minimum of 8 regular season games to be eligible for playoffs."
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="outOfProvince">Out of Province Players</Label>
                    <Textarea
                      id="outOfProvince"
                      value={outOfProvince}
                      onChange={(e) => setOutOfProvince(e.target.value)}
                      placeholder="e.g., Out-of-province players must have a completed 'Proof of Residency' form on file."
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="outOfCountry">Out of Country Players</Label>
                    <Textarea
                      id="outOfCountry"
                      value={outOfCountry}
                      onChange={(e) => setOutOfCountry(e.target.value)}
                      placeholder="e.g., Must have a completed 'Proof of Medical' form on file with the ALA."
                      rows={2}
                    />
                  </div>

                  {/* Tryouts - Conditional for some divisions */}
                  {['Senior B', 'Senior C', 'Junior A', 'Junior B Tier I', 'Junior B Tier II', 'Junior B Tier III'].includes(selectedDivision) && (
                    <>
                      <hr className="my-2 border-gray-200" />
                      <div className="space-y-2">
                        <Label htmlFor="tryouts">Tryouts</Label>
                        <Textarea
                          id="tryouts"
                          value={tryouts}
                          onChange={(e) => setTryouts(e.target.value)}
                          placeholder="Information about tryouts for this division"
                          rows={2}
                        />
                      </div>
                    </>
                  )}

                  {/* Regular Season Standings - Conditional */}
                  {['Senior B', 'Senior C', 'Junior A', 'Junior B Tier I', 'Junior B Tier II'].includes(selectedDivision) && (
                    <>
                      <hr className="my-2 border-gray-200" />
                      <div className="space-y-2">
                        <Label htmlFor="regularSeasonStandings">Regular Season Standings</Label>
                        <Textarea
                          id="regularSeasonStandings"
                          value={regularSeasonStandings}
                          onChange={(e) => setRegularSeasonStandings(e.target.value)}
                          placeholder="Information about regular season standings"
                          rows={2}
                        />
                      </div>
                    </>
                  )}

                  {/* Other Jurisdiction - Conditional */}
                  {['Senior B', 'Senior C', 'Junior B Tier I', 'Junior B Tier II', 'Junior B Tier III'].includes(selectedDivision) && (
                    <>
                      <hr className="my-2 border-gray-200" />
                      <div className="space-y-2">
                        <Label htmlFor="otherJurisdiction">Other Jurisdiction Players</Label>
                        <Textarea
                          id="otherJurisdiction"
                          value={otherJurisdiction}
                          onChange={(e) => setOtherJurisdiction(e.target.value)}
                          placeholder="Rules for players from other jurisdictions"
                          rows={2}
                        />
                      </div>
                    </>
                  )}

                  {/* Junior B Tier I specific fields */}
                  {selectedDivision === 'Junior B Tier I' && (
                    <>
                      <hr className="my-2 border-gray-200" />
                      <div className="space-y-2">
                        <Label htmlFor="northGraduatingDraft">North Graduating Draft</Label>
                        <Textarea
                          id="northGraduatingDraft"
                          value={northGraduatingDraft}
                          onChange={(e) => setNorthGraduatingDraft(e.target.value)}
                          placeholder="Information about the North graduating draft"
                          rows={2}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="centralGraduatingDraft">Central Graduating Draft</Label>
                        <Textarea
                          id="centralGraduatingDraft"
                          value={centralGraduatingDraft}
                          onChange={(e) => setCentralGraduatingDraft(e.target.value)}
                          placeholder="Information about the Central graduating draft"
                          rows={2}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="southGraduatingDraft">South Graduating Draft</Label>
                        <Textarea
                          id="southGraduatingDraft"
                          value={southGraduatingDraft}
                          onChange={(e) => setSouthGraduatingDraft(e.target.value)}
                          placeholder="Information about the South graduating draft"
                          rows={2}
                        />
                      </div>
                    </>
                  )}

                  {/* Protected List - Conditional */}
                  {['Senior B', 'Senior C', 'Junior B Tier I', 'Junior B Tier II', 'Junior B Tier III'].includes(selectedDivision) && (
                    <>
                      <hr className="my-2 border-gray-200" />
                      <div className="space-y-2">
                        <Label htmlFor="protectedList">Protected List</Label>
                        <Textarea
                          id="protectedList"
                          value={protectedList}
                          onChange={(e) => setProtectedList(e.target.value)}
                          placeholder="Information about protected lists"
                          rows={2}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="draftedProtectedPlayers">Drafted Protected Players</Label>
                        <Textarea
                          id="draftedProtectedPlayers"
                          value={draftedProtectedPlayers}
                          onChange={(e) => setDraftedProtectedPlayers(e.target.value)}
                          placeholder="Information about drafted protected players"
                          rows={2}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="freeAgent">Free Agent</Label>
                        <Textarea
                          id="freeAgent"
                          value={freeAgent}
                          onChange={(e) => setFreeAgent(e.target.value)}
                          placeholder="Information about free agents"
                          rows={2}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="firstYearRegistration">First Year Registration</Label>
                        <Textarea
                          id="firstYearRegistration"
                          value={firstYearRegistration}
                          onChange={(e) => setFirstYearRegistration(e.target.value)}
                          placeholder="Information about first year players"
                          rows={2}
                        />
                      </div>
                    </>
                  )}

                  {/* Alberta Major Female specific fields */}
                  {selectedDivision === 'Alberta Major Female' && (
                    <>
                      <hr className="my-2 border-gray-200" />
                      <div className="space-y-2">
                        <Label htmlFor="instagram">Instagram</Label>
                        <Textarea
                          id="instagram"
                          value={instagram}
                          onChange={(e) => setInstagram(e.target.value)}
                          placeholder="Instagram handle or link"
                          rows={1}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="draftInfo">Draft Info</Label>
                        <Textarea
                          id="draftInfo"
                          value={draftInfo}
                          onChange={(e) => setDraftInfo(e.target.value)}
                          placeholder="Information about the draft"
                          rows={2}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="protectedListInfo">Protected List Info</Label>
                        <Textarea
                          id="protectedListInfo"
                          value={protectedListInfo}
                          onChange={(e) => setProtectedListInfo(e.target.value)}
                          placeholder="Information about protected lists"
                          rows={2}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="calgaryFreeAgents">Calgary Free Agents</Label>
                        <Textarea
                          id="calgaryFreeAgents"
                          value={calgaryFreeAgents}
                          onChange={(e) => setCalgaryFreeAgents(e.target.value)}
                          placeholder="Calgary free agent information"
                          rows={2}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="stAlbertDrillers">St. Albert Drillers</Label>
                        <Textarea
                          id="stAlbertDrillers"
                          value={stAlbertDrillers}
                          onChange={(e) => setStAlbertDrillers(e.target.value)}
                          placeholder="St. Albert Drillers team information"
                          rows={2}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sherwoodParkTitans">Sherwood Park Titans</Label>
                        <Textarea
                          id="sherwoodParkTitans"
                          value={sherwoodParkTitans}
                          onChange={(e) => setSherwoodParkTitans(e.target.value)}
                          placeholder="Sherwood Park Titans team information"
                          rows={2}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="capitalRegionSaints">Capital Region Saints</Label>
                        <Textarea
                          id="capitalRegionSaints"
                          value={capitalRegionSaints}
                          onChange={(e) => setCapitalRegionSaints(e.target.value)}
                          placeholder="Capital Region Saints team information"
                          rows={2}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="redDeerRiot">Red Deer Riot</Label>
                        <Textarea
                          id="redDeerRiot"
                          value={redDeerRiot}
                          onChange={(e) => setRedDeerRiot(e.target.value)}
                          placeholder="Red Deer Riot team information"
                          rows={2}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="freeAgentsAMF">Free Agents</Label>
                        <Textarea
                          id="freeAgentsAMF"
                          value={freeAgentsAMF}
                          onChange={(e) => setFreeAgentsAMF(e.target.value)}
                          placeholder="Free agent information"
                          rows={2}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="returningPlayers">Returning Players</Label>
                        <Textarea
                          id="returningPlayers"
                          value={returningPlayers}
                          onChange={(e) => setReturningPlayers(e.target.value)}
                          placeholder="Returning players information"
                          rows={2}
                        />
                      </div>
                    </>
                  )}

                  {/* Alberta Major Senior Female specific fields */}
                  {selectedDivision === 'Alberta Major Senior Female' && (
                    <>
                      <hr className="my-2 border-gray-200" />
                      <div className="space-y-2">
                        <Label htmlFor="instagram">Instagram</Label>
                        <Textarea
                          id="instagram"
                          value={instagram}
                          onChange={(e) => setInstagram(e.target.value)}
                          placeholder="Instagram handle or link"
                          rows={1}
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Season Info Tab */}
            <TabsContent value="season-info">
              <Card>
                <CardHeader>
                  <CardTitle>Season Information</CardTitle>
                  <CardDescription>Current season details and schedule for {selectedDivision}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <SeasonInfoEditor
                    value={seasonInfo}
                    onChange={setSeasonInfo}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Drafts Tab - SportzSoft Data */}
            <TabsContent value="drafts">
              <SportzSoftDataNotice
                title="Draft Information"
                description={`Entry draft results and history for ${selectedDivision}`}
              />
            </TabsContent>

            {/* Protected List Tab - SportzSoft Data */}
            <TabsContent value="protected-list">
              <SportzSoftDataNotice
                title="Protected Lists"
                description={`Team protected player lists for ${selectedDivision}`}
              />
            </TabsContent>

            {/* Transactions Tab - SportzSoft Data */}
            <TabsContent value="transactions">
              <SportzSoftDataNotice
                title="Transactions"
                description={`Player trades, signings, and transactions for ${selectedDivision}`}
              />
            </TabsContent>

            {/* Awards Tab */}
            <TabsContent value="awards">
              <Card>
                <CardHeader>
                  <CardTitle>Division Awards</CardTitle>
                  <CardDescription>Annual awards and honors for {selectedDivision}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <AwardsEditor
                    value={awards}
                    onChange={setAwards}
                    divisionName={selectedDivision}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Championships Tab */}
            <TabsContent value="championships">
              <Card>
                <CardHeader>
                  <CardTitle>Championship History</CardTitle>
                  <CardDescription>Provincial and National championship results and history for {selectedDivision}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ChampionshipsEditor
                    value={championships}
                    onChange={setChampionships}
                    divisionName={selectedDivision}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Save Button - only show for editable tabs */}
          {isEditableTab && (
            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                disabled={saving}
                size="lg"
                className="min-w-[120px]"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}