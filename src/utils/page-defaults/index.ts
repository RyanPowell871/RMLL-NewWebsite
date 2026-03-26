/**
 * Default content schemas for all League Info pages.
 * 
 * Each page's content is expressed as structured blocks.
 * The CMS can override any of these — overrides are stored in KV
 * and merged at render time.
 */
import type { PageContentSchema } from '../page-content-types';

// Import individual page defaults
import { missionStatementDefaults } from './mission-statement';
import { codeOfConductDefaults } from './code-of-conduct';
import { executiveDefaults } from './executive';
import { registrationDefaults } from './registration';
import { officiatingRulebookDefaults } from './officiating-rulebook';
import { officiatingFloorEquipmentDefaults } from './officiating-floor-equipment';
import { officiatingRuleInterpretationsDefaults } from './officiating-rule-interpretations';
import { officiatingOffFloorOfficialsDefaults } from './officiating-off-floor-officials';
import { officiatingApplicationFormDefaults } from './officiating-application-form';
import { privacyPolicyDefaults } from './privacy-policy';
import { bylawsDefaults } from './bylaws';
import { regulationsDefaults } from './regulations';
import { rulesOfPlayDefaults } from './rules-of-play';
import { coachingRequirementsDefaults } from './coaching-requirements';
import { superCoachingClinicDefaults } from './super-coaching-clinic';
import { combinesDefaults } from './combines';
import { newPlayerInfoDefaults } from './new-player-info';
import { newPlayerInfoFemaleDefaults } from './new-player-info-female';
import { graduatingU17InfoDefaults } from './graduating-u17-info';
import { lcalaInfoDefaults } from './lcala-info';
import { badStandingDefaults } from './bad-standing';
import { planningMeetingAGMDefaults } from './planning-meeting-agm';
import { historyDefaults } from './history';
import { awardsDefaults } from './awards';

// Master registry of all page defaults
export const PAGE_DEFAULTS: Record<string, PageContentSchema> = {
  'mission-statement': missionStatementDefaults,
  'code-of-conduct': codeOfConductDefaults,
  'rmll-executive': executiveDefaults,
  'registration': registrationDefaults,
  'officiating-rulebook': officiatingRulebookDefaults,
  'officiating-floor-equipment': officiatingFloorEquipmentDefaults,
  'officiating-rule-interpretations': officiatingRuleInterpretationsDefaults,
  'officiating-off-floor-officials': officiatingOffFloorOfficialsDefaults,
  'officiating-application-form': officiatingApplicationFormDefaults,
  'privacy-policy': privacyPolicyDefaults,
  'bylaws': bylawsDefaults,
  'regulations': regulationsDefaults,
  'rules-of-play': rulesOfPlayDefaults,
  'coaching-requirements': coachingRequirementsDefaults,
  'super-coaching-clinic': superCoachingClinicDefaults,
  'combines': combinesDefaults,
  'new-player-info': newPlayerInfoDefaults,
  'new-player-info-female': newPlayerInfoFemaleDefaults,
  'graduating-u17-info': graduatingU17InfoDefaults,
  'lcala-info': lcalaInfoDefaults,
  'bad-standing': badStandingDefaults,
  'planning-meeting-agm': planningMeetingAGMDefaults,
  'history': historyDefaults,
  'awards': awardsDefaults,
};

// Get defaults for a page, or null if not found
export function getPageDefaults(pageId: string): PageContentSchema | null {
  return PAGE_DEFAULTS[pageId] || null;
}

// Get list of all pages that support structured editing
export function getEditablePages(): { id: string; title: string }[] {
  return Object.entries(PAGE_DEFAULTS).map(([id, schema]) => ({
    id,
    title: schema.title,
  }));
}
