import { ExternalLink, BookOpen } from 'lucide-react';

export function OfficiatingRulebookPage() {
  return (
    <div>
      <p>
        The RMLL follows the rules of Box Lacrosse as established by the{' '}
        <strong>Canadian Lacrosse Association (CLA)</strong>. All officials, coaches, players, and
        team staff are expected to be familiar with the current rulebook.
      </p>

      <h2>CLA Box Lacrosse Rulebook</h2>
      <p>
        The official CLA Box Lacrosse rulebook is the governing document for all RMLL play. It covers
        all aspects of the game including playing rules, penalties, equipment standards, and officiating
        mechanics.
      </p>

      <div className="not-prose my-6">
        <a
          href="https://lacrosse.ca/development/officials/rule-books/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-[#013fac] to-[#0149c9] text-white rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-bold text-base"
        >
          <BookOpen className="w-6 h-6" />
          <div>
            <div className="text-sm opacity-80">Lacrosse Canada</div>
            <div>View Box Lacrosse Rulebook</div>
          </div>
          <ExternalLink className="w-5 h-5 ml-2" />
        </a>
      </div>

      <h2>Key Resources for Officials</h2>
      <ul>
        <li>
          <a href="https://lacrosse.ca/development/officials/rule-books/" target="_blank" rel="noopener noreferrer">
            CLA Rule Books & Casebooks
          </a>{' '}
          — Official rules, casebooks, and supplementary materials
        </li>
        <li>
          <a href="https://lacrosse.ca" target="_blank" rel="noopener noreferrer">
            Lacrosse Canada
          </a>{' '}
          — National governing body for lacrosse in Canada
        </li>
      </ul>

      <blockquote>
        <p>
          <strong>Note:</strong> The RMLL may adopt additional regulations that supplement or modify
          the CLA rules for league play. Refer to the{' '}
          <strong>RMLL Regulations</strong> page under Governance for league-specific rules.
        </p>
      </blockquote>
    </div>
  );
}
