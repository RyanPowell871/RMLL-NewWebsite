import type { PageContentSchema } from '../page-content-types';

export const officiatingRuleInterpretationsDefaults: PageContentSchema = {
  pageId: 'officiating-rule-interpretations',
  title: 'Rule Interpretations',
  sections: [
    { id: 'header', title: 'Rule Interpretations', blocks: [
      { type: 'hero', icon: 'BookOpen', title: 'Rule Interpretations', subtitle: 'Official interpretations and clarifications of CLA and RMLL rules for officials, coaches, and players.' },
    ]},
    { id: 'content', title: 'Interpretations', blocks: [
      { type: 'paragraph', text: 'Rule interpretations are issued by the CLA and the RMLL to clarify the application of specific rules. Officials should review these interpretations regularly to ensure consistent enforcement.' },
      { type: 'info-box', title: 'Updates', variant: 'info', content: 'Rule interpretations are updated periodically throughout the season. Check back regularly for the latest clarifications.' },
    ]},
  ],
};
