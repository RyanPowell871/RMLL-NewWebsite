'use client';

import { useState } from 'react';
import { BookOpen } from 'lucide-react';

const RECORD_BOOK_TABS = [
  {
    id: 'sr-b',
    label: 'Sr. B',
    src: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRDVrkcecsoKEkU9iOanBZvbuPn5txkTwgq3b0DGosgubcZBepx7vRcPPEq88QII7xLQaK_TkcJEeA9/pubhtml?widget=true&headers=false',
  },
  {
    id: 'sr-c',
    label: 'Sr. C',
    src: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS-ggxDqAuDiYG4U_28zGmHzXF_5s2GCDGIQppzi0rgro6rY7fvXuZIoZRnUI4G2t2JfPiZ_bv5eAaL/pubhtml?widget=true&headers=false',
  },
  {
    id: 'jr-a',
    label: 'Jr. A',
    src: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSsRHwMlut2Wd6sZ_S6YrdJNtlXCk1So5jGIcWU3zHHO-O3_IurPYhW1_5RhFwXBN9x9CuzA4hSs4nV/pubhtml?widget=true&headers=false',
  },
  {
    id: 'jr-b-tier-1',
    label: 'Jr. B Tier 1',
    src: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQR0-psoKL8E6vi198XcLAnts1LBV7RQpBEoTexS3SA3BJNu5JNde97W3dF2G8SuHkTgCFqbW2KEXZn/pubhtml?widget=true&headers=false',
  },
  {
    id: 'jr-b-tier-2',
    label: 'Jr. B Tier 2',
    src: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQPVr8fvd97nGqdoGOLYWrtzAX79MLyQVoKZrRHNmFUrpnjkUrDUIyKcq6HZYb6VTB8VT7zRW47fYT7/pubhtml?widget=true&headers=false',
  },
  {
    id: 'jr-b-tier-3',
    label: 'Jr. B Tier 3',
    src: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTD_ZiqmOzW6NEn2v_4xcZPhmwOsQR0Qp-KZR66IxcmXMKvZ8wQl5_ONXtxogIx3OuxV_R_B4YhBRXW/pubhtml?widget=true&headers=false',
  },
  {
    id: 'sr-ladies',
    label: 'Sr. Ladies',
    src: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ7GsF-1mHXnHyzmnS9k8Gpd6CKSS2C6eJtxHGyI4eBSc1X1CF5jw6K2ul_Ajb4TJXqjhatWOe_ftBH/pubhtml?widget=true&headers=false',
  },
  {
    id: 'jr-ladies',
    label: 'Jr. Ladies',
    src: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRybkKTT8I1ql3lQZxHoFwDRIM74ml1aBYcrW1yqFQUn5iyCaunIr3eUKjGacbNIl0MGKfcz8uSmBW2/pubhtml?widget=true&headers=false',
  },
  {
    id: 'records-broken-2018',
    label: 'Records Broken 2018',
    src: 'https://docs.google.com/document/d/e/2PACX-1vR6tgZtAHFM6mKdwlHCeMuspPjmZyMo02GAV4iyO9IjlmxCTyGREQ8m0wTtLukULQtBffSmOT1a7E3z/pub?embedded=true',
  },
  {
    id: 'rmll-records',
    label: 'RMLL Records',
    src: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTb9IgiNieY7XZ_jqwwPzgVW-eftmsbs4iX3uXvdRyfDcgS4glj4MtZmh5_cC5Ib1s21UlbvsvKvtcT/pubhtml?widget=true&headers=false',
  },
];

export function RecordBooksPage() {
  const [activeTab, setActiveTab] = useState(RECORD_BOOK_TABS[0].id);

  const activeRecord = RECORD_BOOK_TABS.find(t => t.id === activeTab)!;

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-4 sm:-mt-6">
      {/* Description */}
      <div className="px-4 sm:px-6 lg:px-8 py-4 border-b border-gray-200">
        <div className="flex items-start gap-3">
          <BookOpen className="w-5 h-5 text-[#013fac] mt-0.5 flex-shrink-0" />
          <p className="text-sm text-gray-600">
            Historical record books for all RMLL divisions. Select a division tab below to view records. 
            Data is sourced from league archives and updated periodically.
          </p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="border-b-2 border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <div className="flex min-w-max px-4 sm:px-6 lg:px-8 gap-1">
            {RECORD_BOOK_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  px-4 py-2.5 text-sm font-bold whitespace-nowrap transition-colors border-b-4 -mb-[2px]
                  ${activeTab === tab.id
                    ? 'border-[#013fac] text-[#013fac]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Iframe container */}
      <div className="w-full bg-gray-50">
        <iframe
          key={activeTab}
          src={activeRecord.src}
          className="w-full border-0"
          style={{ height: '80vh', minHeight: '600px' }}
          title={`${activeRecord.label} Record Book`}
          allowFullScreen
        />
      </div>
    </div>
  );
}
