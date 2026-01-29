// Validation utilities for input validation

// Validate email format
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone number (Vietnamese format)
export const validatePhone = (phone) => {
  const phoneRegex = /^(0|\+84)[0-9]{9,10}$/;
  return phoneRegex.test(phone.replace(/[- .]/g, ''));
};

// Validate CCCD (12 digits)
export const validateCCCD = (cccd) => {
  return /^[0-9]{12}$/.test(cccd);
};

// Validate date format (DD-MM-YYYY)
export const validateDate = (date) => {
  const dateRegex = /^\d{2}-\d{2}-\d{4}$/;
  if (!dateRegex.test(date)) return false;
  
  const [day, month, year] = date.split('-');
  const d = new Date(`${year}-${month}-${day}`);
  return d instanceof Date && !isNaN(d);
};

// Validate date is not in the past
export const isDateNotInPast = (date) => {
  const inputDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return inputDate >= today;
};

// Validate end date is after start date
export const isEndDateAfterStartDate = (startDate, endDate) => {
  return new Date(endDate) > new Date(startDate);
};

// Validate amount is positive
export const validateAmount = (amount) => {
  return !isNaN(amount) && parseFloat(amount) > 0;
};

// Validate string length
export const validateStringLength = (str, min = 1, max = 255) => {
  return str && str.length >= min && str.length <= max;
};

// Validate username (alphanumeric, 4-20 chars)
export const validateUsername = (username) => {
  return /^[a-zA-Z0-9_]{4,20}$/.test(username);
};

// Validate password (min 6 chars, at least 1 number, 1 letter)
export const validatePassword = (password) => {
  return /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,}$/.test(password);
};

// Validate role
export const validateRole = (role) => {
  return ['ADMIN', 'CHU_TRO', 'NGUOI_THUE'].includes(role);
};

// Validate status
export const validateStatus = (status) => {
  return [0, 1].includes(parseInt(status));
};

// Validate bill status (0: unpaid, 1: paid, 2: debt)
export const validateBillStatus = (status) => {
  return [0, 1, 2].includes(parseInt(status));
};

// Validate trang_thai for contracts
export const validateContractStatus = (status) => {
  return [0, 1].includes(parseInt(status));
};

// Validate price format (DECIMAL 12,2)
export const validatePrice = (price) => {
  const priceRegex = /^\d+(\.\d{1,2})?$/;
  return priceRegex.test(price) && parseFloat(price) >= 0;
};

// Sanitize string input (remove special chars, trim)
export const sanitizeString = (str) => {
  if (typeof str !== 'string') return '';
  return str.trim().replace(/[<>]/g, '');
};

// Validate month-year format (MM-YYYY)
export const validateMonthYear = (monthYear) => {
  const monthYearRegex = /^(0[1-9]|1[0-2])-\d{4}$/;
  if (!monthYearRegex.test(monthYear)) return false;
  
  const [month, year] = monthYear.split('-');
  const month_int = parseInt(month);
  const year_int = parseInt(year);
  
  return month_int >= 1 && month_int <= 12 && year_int >= 2000 && year_int <= 2099;
};

// Validate payment method
export const validatePaymentMethod = (method) => {
  const validMethods = ['tiền mặt', 'chuyển khoản', 'thẻ tín dụng', 'ví điện tử'];
  return validMethods.includes(method.toLowerCase());
};

export default {
  validateEmail,
  validatePhone,
  validateCCCD,
  validateDate,
  isDateNotInPast,
  isEndDateAfterStartDate,
  validateAmount,
  validateStringLength,
  validateUsername,
  validatePassword,
  validateRole,
  validateStatus,
  validateBillStatus,
  validateContractStatus,
  validatePrice,
  sanitizeString,
  validateMonthYear,
  validatePaymentMethod
};
