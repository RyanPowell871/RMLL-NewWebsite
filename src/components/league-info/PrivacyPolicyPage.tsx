'use client';

import { useState, useEffect } from 'react';
import { Shield, Lock, Eye, UserCheck, FileCheck, Mail, LucideIcon } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

const supabase = createClient(`https://${projectId}.supabase.co`, publicAnonKey);

// Icon mapping
const iconMap: Record<string, LucideIcon> = {
  Eye,
  FileCheck,
  UserCheck,
  Lock,
  Shield,
};

// Icon component helper
function IconComponent({ iconName }: { iconName: string }) {
  const Icon = iconMap[iconName] || Shield;
  return <Icon className="w-5 h-5" />;
}

// Default data
const DEFAULT_POLICY_POINTS = [
  {
    icon: 'Eye',
    title: 'Purpose of Collection',
    description:
      'Personal information will be collected to determine eligibility for competitive and recreational opportunities, age related events, to facilitate enrollment, to disseminate information, to communicate, to administer and evaluate programs and promotions that benefit Members, and for insurance and statistical purposes.',
  },
  {
    icon: 'FileCheck',
    title: 'Funding Requirements',
    description:
      'In addition, personal information may be, from time to time, submitted to major funding bodies in order to verify registration and meeting funding requirements.',
  },
  {
    icon: 'UserCheck',
    title: 'Consent',
    description:
      'All information must be collected with the consent of the person or legal guardian.',
  },
  {
    icon: 'Lock',
    title: 'Minimization',
    description:
      'Personal information collection must be limited to what is absolutely necessary.',
  },
  {
    icon: 'Shield',
    title: 'Accuracy',
    description:
      'All efforts must be made to avoid incorrect information, and efforts must be made to verify accuracy, completeness and timeliness of information.',
  },
  {
    icon: 'Lock',
    title: 'Protection',
    description:
      'Reasonable steps will be taken to protect the privacy of all personal information.',
  },
];

export function PrivacyPolicyPage() {
  const [policyPoints, setPolicyPoints] = useState(DEFAULT_POLICY_POINTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: result, error } = await supabase
          .from('rmll_component_content')
          .select('extracted_data')
          .eq('page_id', 'privacy-policy')
          .maybeSingle();

        if (!error && result && result.extracted_data) {
          const extracted = result.extracted_data as Record<string, unknown>;
          const items = extracted.POLICY_POINTS as typeof DEFAULT_POLICY_POINTS;
          if (items && Array.isArray(items) && items.length > 0) {
            setPolicyPoints(items);
          }
        }
      } catch (error) {
        console.error('[PrivacyPolicyPage] Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#013fac]/5 via-white to-red-50 border-2 border-[#013fac]/20 rounded-lg p-6 sm:p-8">
        <div className="flex items-start gap-4 mb-4">
          <div className="p-3 bg-[#013fac] rounded-lg shadow-md">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Privacy Policy</h2>
            <div className="h-1 w-20 bg-[#013fac] rounded"></div>
          </div>
        </div>
        <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
          The Rocky Mountain Lacrosse League is committed to protecting the personal information of its members. The
          following policy outlines how personal information is collected, used, and safeguarded.
        </p>
      </div>

      {/* Policy Points */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {policyPoints.map((point, idx) => (
          <div
            key={idx}
            className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-[#013fac]/10 text-[#013fac] shrink-0">
                <IconComponent iconName={point.icon} />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-1.5">{point.title}</h4>
                <p className="text-sm text-gray-600 leading-relaxed">{point.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Privacy Officer */}
      <div className="bg-gradient-to-r from-[#0F2942] to-[#1a3a5c] text-white rounded-lg p-6 sm:p-8 shadow-lg">
        <h3 className="text-lg sm:text-xl font-bold mb-3 flex items-center gap-2">
          <Mail className="w-5 h-5" /> Privacy Officer
        </h3>
        <div className="space-y-3 text-sm sm:text-base text-blue-100 leading-relaxed">
          <p>
            The President of the RMLL serves as the Privacy Officer for the RMLL.
          </p>
          <p>
            Any member wanting access to their personal information can contact the Privacy Officer at:
          </p>
          <div className="bg-white/10 border border-white/20 rounded-lg p-4 mt-3">
            <p className="font-semibold text-white">Rocky Mountain Lacrosse League</p>
            <p>11759 Groat Rd.</p>
            <p>Edmonton, AB T5M 3K6</p>
            <p className="mt-2">
              Or e-mail the RMLL President as listed under the Executive on the RMLL website{' '}
              <a
                href="https://www.rockymountainlax.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-300 hover:text-white underline transition-colors"
              >
                www.rockymountainlax.com
              </a>
            </p>
          </div>
        </div>
        <p className="text-xs text-blue-300 mt-4 italic">Effective January 21, 2010</p>
      </div>
    </div>
  );
}
