export const getOS = (): 'Mac' | 'Windows' | 'Linux' | 'Other' => {
  // Modern browsers support navigator.userAgentData.platform
  if ('userAgentData' in navigator && navigator.userAgentData) {
    const userAgentData = navigator.userAgentData as { platform?: string };
    const platform = userAgentData.platform?.toLowerCase();
    if (platform?.includes('macos')) {
      return 'Mac';
    } else if (platform?.includes('windows')) {
      return 'Windows';
    } else if (platform?.includes('linux')) {
      return 'Linux';
    }
  }

  // Fallback for older browsers - parse userAgent
  const userAgent = navigator.userAgent.toLowerCase();
  if (userAgent.includes('mac')) {
    return 'Mac';
  } else if (userAgent.includes('win')) {
    return 'Windows';
  } else if (userAgent.includes('linux')) {
    return 'Linux';
  }

  return 'Other';
};

/**
 * Validates if a string is a valid semantic version
 * @param version - Version string to validate
 * @returns true if valid semver, false otherwise
 */
const isValidSemver = (version: string): boolean => {
  // Reject empty strings
  if (!version) return false;

  // Basic semver validation: x.y.z... where x, y, z are non-negative integers
  // Allow 1-3 parts (e.g., "1", "1.2", "1.2.3")
  // Reject versions with more than 3 parts
  const parts = version.split('.');
  if (parts.length < 1 || parts.length > 3) return false;

  // Check if all parts are valid numbers
  return parts.every((part) => {
    const num = Number(part);
    return !isNaN(num) && num >= 0 && Number.isInteger(num);
  });
};

/**
 * Compares two semantic version strings by major version only
 * @param newVer - First version string (e.g., "1.2.3")
 * @param currentVer - Second version string (e.g., "1.2.4")
 * @returns true if newVer major version > currentVer major version, false otherwise
 */
export const isVersionGreater = (newVer: string, currentVer: string): boolean => {
  // Return false if either version is not a valid semver
  if (!isValidSemver(newVer) || !isValidSemver(currentVer)) {
    return false;
  }

  // Extract major version (first part before the first dot)
  const newVerMajor = Number(newVer.split('.')[0]);
  const currentVerMajor = Number(currentVer.split('.')[0]);

  // Compare only the major versions
  return newVerMajor > currentVerMajor;
};

export const getAppVersion = () => (import.meta.env.DEV ? 'local' : window?.WEAVY_VERSION);
