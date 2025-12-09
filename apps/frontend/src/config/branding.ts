// Branding configuration - reads from environment variables
// For A/B testing different brands on same backend

export const branding = {
  // App identity
  appName: import.meta.env.VITE_APP_NAME || 'Map & Mingle',
  tagline: import.meta.env.VITE_TAGLINE || 'Find your people',
  safetyTagline: import.meta.env.VITE_SAFETY_TAGLINE || 'Keep your loved ones close',
  
  // Colors (Tailwind classes or hex values)
  primaryColor: import.meta.env.VITE_PRIMARY_COLOR || '#8B5CF6', // purple
  primaryColorLight: import.meta.env.VITE_PRIMARY_COLOR_LIGHT || '#A78BFA',
  primaryColorDark: import.meta.env.VITE_PRIMARY_COLOR_DARK || '#7C3AED',
  accentColor: import.meta.env.VITE_ACCENT_COLOR || '#EC4899', // pink
  safetyColor: import.meta.env.VITE_SAFETY_COLOR || '#3B82F6', // blue
  
  // Gradients (CSS gradient strings)
  primaryGradient: import.meta.env.VITE_PRIMARY_GRADIENT || 'linear-gradient(to right, #EC4899, #8B5CF6, #3B82F6)',
  headerGradient: import.meta.env.VITE_HEADER_GRADIENT || 'linear-gradient(to right, #EC4899, #8B5CF6, #3B82F6)',
  safetyGradient: import.meta.env.VITE_SAFETY_GRADIENT || 'linear-gradient(to bottom right, #3B82F6, #4F46E5)',
  
  // Logo
  logoUrl: import.meta.env.VITE_LOGO_URL || '',
  logoText: import.meta.env.VITE_LOGO_TEXT !== 'false', // show text logo if no image
  
  // Social/Legal
  supportEmail: import.meta.env.VITE_SUPPORT_EMAIL || 'support@mapandmingle.com',
  companyName: import.meta.env.VITE_COMPANY_NAME || 'Map & Mingle Inc.',
  
  // Feature flags for A/B testing
  showSocialFeatures: import.meta.env.VITE_SHOW_SOCIAL !== 'false',
  showSafetyFeatures: import.meta.env.VITE_SHOW_SAFETY !== 'false',
  defaultTab: import.meta.env.VITE_DEFAULT_TAB || 'map', // 'map' | 'safety'
};

// Tailwind-safe color classes based on primary color
export const brandColors = {
  // These map to Tailwind classes - update based on your primary color
  bg: {
    primary: 'bg-purple-600',
    primaryHover: 'hover:bg-purple-700',
    primaryLight: 'bg-purple-100',
    accent: 'bg-pink-500',
    safety: 'bg-blue-600',
  },
  text: {
    primary: 'text-purple-600',
    primaryDark: 'text-purple-700',
    accent: 'text-pink-500',
    safety: 'text-blue-600',
  },
  border: {
    primary: 'border-purple-600',
    primaryLight: 'border-purple-200',
  },
  ring: {
    primary: 'ring-purple-500',
    primaryLight: 'ring-purple-100',
  },
};

// Helper to get CSS variable style
export const brandStyle = {
  primaryColor: { color: branding.primaryColor },
  primaryBg: { backgroundColor: branding.primaryColor },
  primaryGradientBg: { background: branding.primaryGradient },
  safetyGradientBg: { background: branding.safetyGradient },
};

export default branding;
