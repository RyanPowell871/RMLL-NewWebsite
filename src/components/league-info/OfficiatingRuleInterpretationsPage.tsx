export function OfficiatingRuleInterpretationsPage() {
  return (
    <div>
      <p>
        The following rule interpretations have been issued by the RMLL to clarify specific rules and
        regulations as they apply to league play. These interpretations are intended to supplement the
        official CLA Box Lacrosse rulebook and provide consistent guidance to officials, coaches, and
        players.
      </p>

      <h2>Rule 68 Interpretation - Thirty Second Rule</h2>
      <div className="not-prose my-4">
        <div className="bg-blue-50 border-2 border-[#013fac] rounded-lg overflow-hidden">
          <div className="bg-gradient-to-r from-[#013fac] to-[#0149c9] text-white px-4 py-2">
            <span className="text-xs font-bold tracking-wide uppercase">RMLL / Major Lacrosse Only</span>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <p className="text-sm font-bold text-gray-900 mb-1">Question:</p>
              <p className="text-sm text-gray-700">
                At what points of the game does the Thirty-Second Shot Clock run, in Major Lacrosse?
              </p>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 mb-1">Answer:</p>
              <p className="text-sm text-gray-700">
                As soon as a team gains possession of the ball, the Thirty Second Shot Clock will run, in
                all player-strength situations. The Thirty Second Shot Clock will never be held when a team
                is short handed, as per ALA Regulation 15.19.2
              </p>
            </div>
            <div className="border-t border-blue-200 pt-3 mt-3">
              <p className="text-xs font-bold text-[#013fac] mb-1">ALA Regulation 15.19.2:</p>
              <blockquote className="text-sm text-gray-700 italic border-l-4 border-[#013fac] pl-3 ml-0">
                In Major Lacrosse, the shot clock will be run in all situations.
              </blockquote>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
