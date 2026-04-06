// Centralised form validation helpers used across Login, Register, Checkout, Profile

export function validateEmail(email = '') {
  if (!email.trim()) return 'Email is required';
  if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) return 'Enter a valid email';
  return '';
}

export function validatePassword(password = '') {
  if (!password.trim()) return 'Password is required';
  if (password.length < 6) return 'Password must be at least 6 characters';
  return '';
}

export function validateName(name = '') {
  if (!name.trim()) return 'Full Name is required';
  return '';
}

export function validatePhone(phone = '') {
  if (!phone.trim()) return 'Phone number is required';
  if (!/^[6-9]\d{9}$/.test(phone.replace(/\s/g, '')))
    return 'Enter a valid 10-digit mobile number';
  return '';
}

export function validatePin(pin = '') {
  if (!pin.trim()) return 'PIN Code is required';
  if (!/^\d{6}$/.test(pin)) return 'Enter a valid 6-digit PIN';
  return '';
}

export function validateRequired(value = '', label = 'Field') {
  if (!value.trim()) return `${label} is required`;
  return '';
}

// Validates the checkout address form and returns an errors object
export function validateAddress(form) {
  return {
    name:         validateName(form.name),
    email:        validateEmail(form.email),
    phone:        validatePhone(form.phone),
    addressLine1: validateRequired(form.addressLine1, 'Address Line 1'),
    city:         validateRequired(form.city, 'City'),
    state:        validateRequired(form.state, 'State'),
    pin:          validatePin(form.pin),
  };
}

// Returns true if an errors object has no non-empty values
export function hasNoErrors(errors) {
  return Object.values(errors).every(v => !v);
}
