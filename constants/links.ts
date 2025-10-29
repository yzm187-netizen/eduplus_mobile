import { CONFIG } from '@/utils/config';

export const Links = {
  privacy: CONFIG.PRIVACY_POLICY_URL || 'https://example.com/privacy',
  terms: CONFIG.TERMS_URL || 'https://example.com/terms',
  help: CONFIG.HELP_CENTER_URL || 'https://example.com/help',
};
