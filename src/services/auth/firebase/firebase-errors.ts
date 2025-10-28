/**
 * Checks if an error is a Firebase Auth error
 */
export const isFirebaseAuthError = (error: any): boolean => {
  return error?.code?.startsWith('auth/') || false;
};

/**
 * Parses Firebase Auth error codes and returns user-friendly error messages
 */
export const getFirebaseAuthErrorMessage = (error: any): string => {
  // Check if it's a Firebase Auth error
  if (!error || !isFirebaseAuthError(error)) {
    // If there's a custom error message (like from team invitation), use it
    if (error?.message) {
      return error.message;
    }
    // Return generic message if no specific message available
    return 'An unexpected error occurred. Please try again.';
  }

  // Handle specific Firebase Auth error codes
  switch (error.code) {
    case 'auth/popup-closed-by-user':
      return 'Sign-in cancelled';

    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with the same email address but different sign-in credentials';

    case 'auth/invalid-credential':
      return 'Invalid credentials. Please try again';

    case 'auth/operation-not-allowed':
      return 'This sign-in method is not enabled';

    case 'auth/user-disabled':
      return 'This account has been disabled';

    case 'auth/user-not-found':
      return 'No account found with this email';

    case 'auth/wrong-password':
      return 'Incorrect password';

    case 'auth/invalid-email':
      return 'Invalid email address';

    case 'auth/email-already-in-use':
      return 'This email is already registered';

    case 'auth/weak-password':
      return 'Password is too weak';

    case 'auth/network-request-failed':
      return 'Network error. Please check your connection and try again';

    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later';

    case 'auth/popup-blocked':
      return 'Sign-in popup was blocked. Please allow popups for this site';

    default:
      // If there's a custom error message, use it
      if (error.message) {
        return error.message;
      }

      // Fallback to generic error message
      return 'Failed to sign in. Please try again.';
  }
};
