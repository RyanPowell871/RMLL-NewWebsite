import { MapPin, ExternalLink } from 'lucide-react';
import { useFacilities, findFacilityMapLink } from '../hooks/useFacilities';

interface FacilityMapLinkProps {
  venueName?: string | null;
  className?: string;
  iconOnly?: boolean;
  showText?: string;
  target?: '_blank' | '_self';
}

/**
 * Displays a map link for a facility/venue.
 * Uses the facilities API to find the Google Maps link for the venue.
 */
export function FacilityMapLink({
  venueName,
  className = '',
  iconOnly = false,
  showText,
  target = '_blank',
}: FacilityMapLinkProps) {
  const { facilities } = useFacilities();
  const mapLink = venueName ? findFacilityMapLink(facilities, venueName) : undefined;

  // Fallback: generate Google Maps search link if venue name exists
  const fallbackLink = venueName
    ? `https://www.google.com/maps/search/${encodeURIComponent(venueName + ' Alberta')}`
    : undefined;

  const link = mapLink || fallbackLink;

  if (!link) {
    return iconOnly ? (
      <MapPin className={`w-4 h-4 text-gray-300 ${className}`} />
    ) : (
      <span className={`text-gray-400 ${className}`}>
        <MapPin className="w-4 h-4 inline mr-1" />
        {showText || venueName || 'No location'}
      </span>
    );
  }

  if (iconOnly) {
    return (
      <a
        href={link}
        target={target}
        rel="noopener noreferrer"
        className={`inline-flex items-center justify-center p-1.5 text-[#013fac] hover:bg-blue-50 hover:text-[#0149c9] rounded transition-colors ${className}`}
        title={`View ${venueName} on Google Maps`}
      >
        <MapPin className="w-4 h-4" />
      </a>
    );
  }

  return (
    <a
      href={link}
      target={target}
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 text-[#013fac] hover:text-[#0149c9] transition-colors ${className}`}
    >
      <MapPin className="w-4 h-4 shrink-0" />
      <span className="truncate">{showText || venueName}</span>
      <ExternalLink className="w-3 h-3 opacity-60 shrink-0" />
    </a>
  );
}