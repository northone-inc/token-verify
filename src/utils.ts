/**
 *
 * @returns Domain name formatted with https:// and trailing backslash i.e https://domain-name.com/
 */
export const formatDomainString = (domain: string): string => `https://${domain}/`
