'use client';

import { useState, useEffect } from 'react';
import { ExternalLink, ClipboardCheck, AlertTriangle, ChevronRight, Users, DollarSign, ShieldCheck } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

const supabase = createClient(`https://${projectId}.supabase.co`, publicAnonKey);

// Default data
const DEFAULT_DIVISIONS = [
  { name: 'Female Junior', dob: 'DOB 2009, 2008, 2007, 2006, 2005', color: 'bg-pink-50 border-pink-300' },
  { name: 'Female Senior', dob: 'DOB 2004 or earlier', color: 'bg-pink-50 border-pink-300' },
  { name: 'Senior', dob: 'DOB 2004 or earlier', note: 'Sr. B (ASL) or Sr. C', color: 'bg-blue-50 border-blue-300' },
  { name: 'Junior', dob: 'DOB 2009, 2008, 2007, 2006, 2005', note: 'Jr. A, Tier I or Tier II', color: 'bg-blue-50 border-blue-300' },
];

const DEFAULT_STEPS = [
  {
    step: 1,
    title: 'Log in to RAMP',
    description: 'Enter your RAMP login. If you played lacrosse in Alberta in 2025 or if you played for another sport that RAMP hosts the registration for, you will have a RAMP login. If you are new to Alberta lacrosse in 2026 and do not currently have RAMP for registration for another sport, you will need to create a RAMP Account.',
  },
  {
    step: 2,
    title: 'Register as a Participant',
    description: 'Select "Register as a Participant" from the options.',
  },
  {
    step: 3,
    title: 'Select Season',
    description: 'Select "2026 Box Transfer Season".',
  },
  {
    step: 4,
    title: 'Select Family Member',
    description: 'Select which Family Member you want to Register (enter or review that information is correct).',
  },
  {
    step: 5,
    title: 'Select Your Division',
    description: 'Select one of the four RMLL Divisions (see division breakdown below).',
  },
  {
    step: 6,
    title: 'Pay Registration Fee',
    description: 'ALA Player Registration Fee — $87.00 plus admin fee (this payment is submitted directly to the ALA).',
  },
  {
    step: 7,
    title: 'Waivers (Under 18)',
    description: 'Players under 18 will need to have a Parent or Guardian sign the ALA and LC Waivers.',
  },
  {
    step: 8,
    title: 'Complete Registration',
    description: 'Please enter all the requested information. Once complete, you will receive an RMLL Registration Confirmation e-mail.',
  },
];

export function RegistrationPage() {
  const [data, setData] = useState({
    DIVISIONS: DEFAULT_DIVISIONS,
    STEPS: DEFAULT_STEPS,
    REGISTRATION_FEE: '$87.00',
    REGISTRATION_URL: 'http://rmll.rampregistrations.com',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: result, error } = await supabase
          .from('rmll_component_content')
          .select('extracted_data')
          .eq('page_id', 'registration')
          .maybeSingle();

        if (!error && result && result.extracted_data) {
          const extracted = result.extracted_data as Record<string, unknown>;
          setData({
            DIVISIONS: (extracted.DIVISIONS as typeof DEFAULT_DIVISIONS) || DEFAULT_DIVISIONS,
            STEPS: (extracted.STEPS as typeof DEFAULT_STEPS) || DEFAULT_STEPS,
            REGISTRATION_FEE: (extracted.REGISTRATION_FEE as string) || '$87.00',
            REGISTRATION_URL: (extracted.REGISTRATION_URL as string) || 'http://rmll.rampregistrations.com',
          });
        }
      } catch (error) {
        console.error('[RegistrationPage] Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const { DIVISIONS, STEPS, REGISTRATION_FEE, REGISTRATION_URL } = data;

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#013fac] to-[#4b5baa] text-white rounded-lg p-5 sm:p-6 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="text-xl sm:text-2xl font-bold mb-2">Welcome to the RMLL 2026 Box Season!</h2>
        <p className="text-sm text-blue-100">
          Complete your Intent-to-Play registration to participate in the upcoming season.
        </p>
      </div>

      {/* Key Info Callout */}
      <div className="bg-amber-50 border-2 border-amber-400 rounded-lg p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-amber-800 text-sm sm:text-base">Important: Intent-to-Play Required</h3>
            <p className="text-sm text-amber-700 mt-1 leading-relaxed">
              In addition to registering directly with a RMLL Franchise, Alberta players must also complete the
              RMLL Intent-to-Play. As per the ALA, only RMLL players completing this Intent-to-Play will be
              allowed to go on the floor with an Alberta RMLL Franchise.
            </p>
            <div className="flex flex-wrap gap-3 mt-3">
              <div className="bg-white border border-amber-300 rounded px-3 py-1.5 text-xs text-amber-800">
                <strong>Exception:</strong> Out-of-province teams — Intent-to-Play does not apply
              </div>
              <div className="bg-white border border-amber-300 rounded px-3 py-1.5 text-xs text-amber-800">
                <strong>Exception:</strong> Minor Lacrosse call-ups do not complete the Intent-to-Play
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Step-by-Step Guide */}
      <div className="border-2 border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <div className="bg-gray-100 border-b-2 border-gray-200 px-4 sm:px-5 py-3 flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5 text-[#013fac]" />
          <h3 className="font-bold text-gray-900 text-sm sm:text-base">Registration Steps</h3>
        </div>
        <div className="p-4 sm:p-5">
          <div className="space-y-3">
            {STEPS.map((s) => (
              <div key={s.step} className="flex items-start gap-3 group">
                <div className="w-7 h-7 rounded-full bg-[#013fac] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  {s.step}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-900 text-sm">{s.title}</h4>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mt-0.5">{s.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Divisions */}
      <div className="border-2 border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <div className="bg-gray-100 border-b-2 border-gray-200 px-4 sm:px-5 py-3 flex items-center gap-2">
          <Users className="w-5 h-5 text-[#013fac]" />
          <h3 className="font-bold text-gray-900 text-sm sm:text-base">RMLL Divisions</h3>
        </div>
        <div className="p-4 sm:p-5">
          <p className="text-sm text-gray-600 mb-4">Select one of the four RMLL Divisions during registration:</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {DIVISIONS.map((d) => (
              <div key={d.name} className={`${d.color} border-2 rounded-lg p-3.5`}>
                <h4 className="font-bold text-gray-900 text-sm">{d.name}</h4>
                <p className="text-xs text-gray-600 mt-1">{d.dob}</p>
                {d.note && (
                  <p className="text-xs text-gray-500 mt-0.5 italic">
                    <ChevronRight className="w-3 h-3 inline -mt-0.5" /> Intending to play {d.note}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fee Info */}
      <div className="border-2 border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <div className="bg-gray-100 border-b-2 border-gray-200 px-4 sm:px-5 py-3 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-[#013fac]" />
          <h3 className="font-bold text-gray-900 text-sm sm:text-base">Registration Fee</h3>
        </div>
        <div className="p-4 sm:p-5">
          <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div>
              <p className="text-2xl font-bold text-[#013fac]">{REGISTRATION_FEE}</p>
              <p className="text-xs text-gray-500">+ admin fee</p>
            </div>
            <div className="h-10 w-px bg-blue-200"></div>
            <div>
              <p className="text-sm text-gray-700 font-medium">ALA Player Registration Fee</p>
              <p className="text-xs text-gray-500">This payment is submitted directly to the ALA</p>
            </div>
          </div>
        </div>
      </div>

      {/* Registration Link */}
      <div className="bg-green-50 border-2 border-green-400 rounded-lg p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2 flex-1">
            <ExternalLink className="w-5 h-5 text-green-700 shrink-0" />
            <div>
              <h3 className="font-bold text-green-800 text-sm">RMLL Intent-to-Play Link</h3>
              <p className="text-xs text-green-600">Complete your registration on RAMP</p>
            </div>
          </div>
          <a
            href={REGISTRATION_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-5 py-2.5 rounded border-2 border-green-800 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] transition-colors text-sm"
          >
            Register Now
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* After Registration */}
      <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-blue-800 text-sm sm:text-base">After Registration</h3>
            <p className="text-sm text-blue-700 mt-1 leading-relaxed">
              Once you have completed entering all the required information, you will receive an{' '}
              <strong>RMLL Registration Confirmation e-mail</strong>.
            </p>
            <p className="text-sm text-blue-700 mt-2 leading-relaxed">
              Please give a copy of this RMLL Registration Confirmation e-mail to each RMLL Franchise
              you are going on the floor with.
            </p>
          </div>
        </div>
      </div>

      {/* Sign-off */}
      <div className="text-sm text-gray-600 border-t border-gray-200 pt-4">
        <p className="italic">Yours in Lacrosse,</p>
        <p className="font-bold text-gray-800">The Rocky Mountain Lacrosse League</p>
      </div>
    </div>
  );
}