import { Target, Heart, Shield, Star, Users, Handshake } from 'lucide-react';

export function MissionStatementPage() {
  return (
    <div className="space-y-8">
      {/* Who We Are */}
      <div className="bg-gradient-to-br from-[#013fac]/5 via-white to-red-50 border-2 border-[#013fac]/20 rounded-lg p-6 sm:p-8">
        <div className="flex items-start gap-4 mb-4">
          <div className="p-3 bg-[#013fac] rounded-lg shadow-md">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Who We Are</h2>
            <div className="h-1 w-20 bg-[#013fac] rounded"></div>
          </div>
        </div>
        <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
          The Rocky Mountain Lacrosse League is a non-profit organization that is the governing body for Alberta amateur
          post midget lacrosse.
        </p>
      </div>

      {/* Mission Statement */}
      <div className="bg-white border-2 border-[#013fac]/20 rounded-lg p-6 sm:p-8 shadow-sm">
        <div className="flex items-start gap-4 mb-5">
          <div className="p-3 bg-[#013fac] rounded-lg shadow-md">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Our Mission</h2>
            <div className="h-1 w-20 bg-[#013fac] rounded"></div>
          </div>
        </div>
        <blockquote className="text-base sm:text-lg text-gray-800 leading-relaxed font-medium italic border-l-4 border-[#013fac] pl-5 ml-1">
          "To govern and promote Alberta amateur post midget box lacrosse and provide continual participant development
          opportunities for the pursuit of excellence and enjoyment while fostering fair play, sportsmanship and a
          general community spirit among our Members."
        </blockquote>
      </div>

      {/* Core Values */}
      <div>
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-red-600 rounded-lg shadow-md">
            <Heart className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Core Values</h2>
            <div className="h-1 w-20 bg-red-600 rounded"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ValueCard
            icon={<Star className="w-5 h-5" />}
            title="Pursuit of Excellence"
            description="We provide continual participant development opportunities for athletes striving for excellence at every level of competition."
            color="blue"
          />
          <ValueCard
            icon={<Handshake className="w-5 h-5" />}
            title="Fair Play & Sportsmanship"
            description="Fair play and sportsmanship are at the heart of everything we do — on the floor, on the bench, and in the stands."
            color="red"
          />
          <ValueCard
            icon={<Users className="w-5 h-5" />}
            title="Community Spirit"
            description="We foster a general community spirit among our Members, building connections through the game of lacrosse across Alberta.<a href="/league-info#documents?doc=b30d0d10-1adf-4f1a-a89b-86b0ef6cffca" target="_blank" rel="noopener noreferrer">2025 Rmll Oic Report</a>"
            color="red"
          />
          <ValueCard
            icon={<Target className="w-5 h-5" />}
            title="Enjoyment"
            description="At every level — from Junior to Senior, Tier II to Sr. B — we believe lacrosse should be enjoyable for players, coaches, officials, and fans alike."
            color="blue"
          />
          <ValueCard
            icon={<Shield className="w-5 h-5" />}
            title="Player Development"
            description="We are committed to providing pathways for athletes to develop their skills, from grassroots play through to national-level competition."
            color="blue"
          />
          <ValueCard
            icon={<Heart className="w-5 h-5" />}
            title="Volunteerism"
            description="Our league is built on the dedication of volunteers — coaches, managers, officials, and board members who give their time to strengthen lacrosse in our communities."
            color="red"
          />
        </div>
      </div>

      {/* Commitment */}
      <div className="bg-gradient-to-r from-[#0F2942] to-[#1a3a5c] text-white rounded-lg p-6 sm:p-8 shadow-lg">
        <h3 className="text-lg sm:text-xl font-bold mb-4">Our Commitment</h3>
        <div className="space-y-3 text-sm sm:text-base text-blue-100 leading-relaxed">
          <p>
            The RMLL is committed to working collaboratively with the Alberta Lacrosse Association (ALA), the Canadian
            Lacrosse Association (CLA), and all member clubs to advance the sport of lacrosse in Western Canada.
          </p>
          <p>
            We recognize that the strength of our league lies in the dedication of our member associations, the passion
            of our players, and the unwavering support of families and communities across Alberta. Together, we are
            building a legacy for future generations of lacrosse players.
          </p>
        </div>
      </div>
    </div>
  );
}

function ValueCard({
  icon,
  title,
  description,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  description: React.ReactNode;
  color: 'blue' | 'red';
}) {
  const colorClasses =
    color === 'blue' ? 'border-l-[#013fac] bg-blue-50/50' : 'border-l-red-600 bg-red-50/30';
  const iconBg = color === 'blue' ? 'bg-[#013fac]/10 text-[#013fac]' : 'bg-red-600/10 text-red-600';

  return (
    <div
      className={`border-l-4 ${colorClasses} border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${iconBg} shrink-0`}>{icon}</div>
        <div className="flex-1">
          <h4 className="font-bold text-gray-900 mb-1.5">{title}</h4>
          <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
}
