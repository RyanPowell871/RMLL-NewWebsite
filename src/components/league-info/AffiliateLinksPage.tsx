import { ExternalLink } from 'lucide-react';
import lacrosseCanadaLogo from 'figma:asset/c9f97c2ace1ec9c5173dd5152aa2ea399bde2f4f.png';
import gelcLogo from 'figma:asset/708e73d7e18a9df51b6f893239f613df265ab543.png';
import cdlaLogo from 'figma:asset/fadc27d20bc2a90228465141cace0eca8e3bec68.png';
import callLogo from 'figma:asset/cec84e3f18efda2bdeee61bd5501aab9534097f9.png';
import salaLogo from 'figma:asset/81b1bc52cc06db4c271a437e6e039b6ec87bbd3b.png';
import alraLogo from 'figma:asset/9394520cb3c5ea0a5f585de74559a00e09e176ae.png';
import redDeerLogo from 'figma:asset/562662f4bd5e7fa3574502c673ce3c1cbb47f8f3.png';
import rushLogo from 'figma:asset/d0e3bc6bd5f496159776f1a321da5408fef9863b.png';

interface LinkItem {
  name: string;
  url: string;
  logo?: string;
}

interface LinkSection {
  title: string;
  links: LinkItem[];
}

export function AffiliateLinksPage() {
  const sections: LinkSection[] = [
    {
      title: 'Governing Bodies',
      links: [
        { 
          name: 'Lacrosse Canada', 
          url: 'http://www.lacrosse.ca/',
          logo: lacrosseCanadaLogo
        }
      ]
    },
    {
      title: 'ALA LGBs',
      links: [
        { 
          name: 'Wheatland Association', 
          url: 'http://www.wheatlandlacrosse.com/',
          logo: 'https://www.wheatlandlacrosse.com/cloud/wheatlandlacrosse/css/img/assocLogo.svg'
        },
        { 
          name: 'Greater Edmonton Lacrosse Council (GELC)', 
          url: 'http://gelc.ab.ca/',
          logo: gelcLogo
        },
        { 
          name: 'Central Alberta Lacrosse Association (CALL)', 
          url: 'http://www.centralalbertalacrosse.com/',
          logo: callLogo
        },
        { 
          name: 'Calgary District Lacrosse Association (CDLA)', 
          url: 'http://www.calgarylacrosse.com/',
          logo: cdlaLogo
        },
        { 
          name: 'Southern Alberta Lacrosse Association (SALA)', 
          url: 'http://www.southernalbertalacrosse.com/',
          logo: salaLogo
        }
      ]
    },
    {
      title: 'Provincial MAs',
      links: [
        { 
          name: 'Alberta Lacrosse Association (ALA)', 
          url: 'http://www.albertalacrosse.com/',
          logo: 'https://cloud3.rampinteractive.com/ablax/css/img/assocLogo.svg'
        },
        { 
          name: 'British Columbia Lacrosse Association', 
          url: 'http://www.bclacrosse.com/',
          logo: 'https://www.bclacrosse.com/img/bcla_round_logo.png'
        },
        { 
          name: 'Manitoba Lacrosse Association', 
          url: 'https://manitobalacrosse.com/',
          logo: 'https://manitobalacrosse.com/cloud/manitobalacrosse/css/img/assocLogo.svg'
        },
        { 
          name: 'Saskatchewan Lacrosse Association', 
          url: 'http://sasklacrosse.net/',
          logo: 'https://sasklacrosse.net/cloud/sasklacrosse/css/img/assocLogo.svg'
        },
        { 
          name: 'Ontario Lacrosse Association', 
          url: 'http://www.ontariolacrosse.com/',
          logo: 'https://ontariolacrosse.com/styles/default/images/logo.png'
        }
      ]
    },
    {
      title: 'RMLL',
      links: [
        { 
          name: 'Red Deer Major Lacrosse', 
          url: 'http://www.reddeermajorlacrosse.com/',
          logo: redDeerLogo
        },
        { 
          name: 'Junior A Division', 
          url: 'http://www.abjralacrosse.com',
          logo: 'https://cloud3.rampinteractive.com/ablax/css/img/assocLogo.svg'
        }
      ]
    },
    {
      title: 'Referee Associations',
      links: [
        { 
          name: 'Alberta Referee Association', 
          url: 'http://albertalacrosserefs.ca/',
          logo: alraLogo
        }
      ]
    },
    {
      title: 'NLL Teams',
      links: [
        { 
          name: 'Calgary Roughnecks', 
          url: 'http://www.calgaryroughnecks.com/',
          logo: 'https://calgaryroughnecks.com/wp-content/uploads/2022/09/2021_RN_LOGO_rev300.png'
        },
        { 
          name: 'Saskatchewan Rush', 
          url: 'https://www.saskrush.com/',
          logo: rushLogo
        }
      ]
    }
  ];

  return (
    <div className="space-y-12">
      <div className="prose prose-lg max-w-none">
        <p className="text-lg text-gray-700 leading-relaxed">
          The Rocky Mountain Lacrosse League is proud to be part of a larger lacrosse community. 
          Below are links to our partner organizations, governing bodies, and affiliated leagues across Canada.
        </p>
      </div>

      {sections.map((section, idx) => (
        <section key={idx} className="space-y-6">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-gray-900 pb-2 border-b-4 border-red-600 inline-block">
              {section.title}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {section.links.map((link, linkIdx) => (
              <a
                key={linkIdx}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative bg-white border-2 border-black hover:shadow-[6px_6px_0px_0px_rgba(220,38,38,1)] transition-all duration-200 overflow-hidden"
              >
                <div className="p-4 sm:p-6 flex flex-col items-center text-center gap-3 sm:gap-4">
                  {/* Logo Circle */}
                  <div className="w-16 h-16 sm:w-24 sm:h-24 bg-white rounded-full border-2 border-black flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform duration-200 p-1.5 sm:p-2">
                    {link.logo ? (
                      <img 
                        src={link.logo} 
                        alt={link.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <span className="text-2xl font-bold text-red-600">
                        {link.name.charAt(0)}
                      </span>
                    )}
                  </div>

                  {/* Link Name */}
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 group-hover:text-red-600 transition-colors leading-tight">
                      {link.name}
                    </h3>
                  </div>

                  {/* External Link Icon */}
                  <div className="absolute top-3 right-3">
                    <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-red-600 transition-colors" />
                  </div>
                </div>
              </a>
            ))}
          </div>
        </section>
      ))}

      {/* Footer Note */}
      <div className="mt-12 p-6 bg-red-50 border-l-4 border-red-600">
        <p className="text-sm text-gray-700">
          <strong>Note:</strong> These links will take you to external websites. 
          The RMLL is not responsible for the content on these external sites.
        </p>
      </div>
    </div>
  );
}