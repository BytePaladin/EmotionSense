export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
  const errors = [];
  if (!password || password.length < 8) errors.push('At least 8 characters');
  if (!/[A-Z]/.test(password)) errors.push('One uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('One lowercase letter');
  if (!/[0-9]/.test(password)) errors.push('One digit');
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) errors.push('One special character');
  return { isValid: errors.length === 0, errors };
};

export const getPasswordStrength = (password) => {
  if (!password) return { level: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++;

  if (score <= 1) return { level: 1, label: 'Weak', color: '#ef4444' };
  if (score <= 2) return { level: 2, label: 'Fair', color: '#f97316' };
  if (score <= 3) return { level: 3, label: 'Good', color: '#eab308' };
  if (score <= 4) return { level: 4, label: 'Strong', color: '#10b981' };
  return { level: 5, label: 'Very Strong', color: '#06b6d4' };
};

export const ALLOWED_FILE_TYPES = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'video/mp4': '.mp4',
  'video/quicktime': '.mov',
  'video/x-msvideo': '.avi'
};

export const MAX_FILE_SIZE = 20 * 1024 * 1024;

export const validateFile = (file) => {
  const errors = [];
  if (!ALLOWED_FILE_TYPES[file.type]) {
    errors.push('Invalid file type. Allowed: JPG, JPEG, PNG, MP4, MOV, AVI');
  }
  if (file.size > MAX_FILE_SIZE) {
    errors.push('File size exceeds 20MB limit');
  }
  return { isValid: errors.length === 0, errors };
};
