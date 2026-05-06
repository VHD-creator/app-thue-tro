// ==================== VALIDATORS ====================
// Dùng chung cho tất cả routes

export const validatePrice = (value) => {
  const num = parseFloat(value);
  return !isNaN(num) && num > 0;
};

export const validateAmount = validatePrice;

// Validate CCCD (12 digits)
export const validateStringLength = (str, min = 1, max = 255) => {
  if (typeof str !== 'string') return false;
  return str.trim().length >= min && str.trim().length <= max;
};

export const validateDate = (dateStr) => {
  if (!dateStr) return false;
  // Chấp nhận cả DD-MM-YYYY và YYYY-MM-DD
  const regexVN = /^\d{2}-\d{2}-\d{4}$/;
  const regexISO = /^\d{4}-\d{2}-\d{2}$/;
  
  if (regexVN.test(dateStr)) {
    const [d, m, y] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
  }
  
  if (regexISO.test(dateStr)) {
    const date = new Date(dateStr);
    return !isNaN(date.getTime());
  }

  return false;
};

export const validateMonthYear = (str) => {
  if (!str) return false;
  const regex = /^\d{2}-\d{4}$/;
  if (!regex.test(str)) return false;
  const [m, y] = str.split('-').map(Number);
  return m >= 1 && m <= 12 && y >= 2000 && y <= 2100;
};

export const isEndDateAfterStartDate = (startStr, endStr) => {
  if (!validateDate(startStr) || !validateDate(endStr)) return false;
  const toDate = (str) => {
    if (str.split('-')[0].length === 4) return new Date(str); // ISO
    const [d, m, y] = str.split('-').map(Number);
    return new Date(y, m - 1, d);
  };
  return toDate(endStr) > toDate(startStr);
};

export const validateBillStatus = (status) => {
  return [0, 1, 2].includes(parseInt(status));
};

export const validateStatus = (status) => {
  return [0, 1, 2].includes(parseInt(status));
};

export const validatePaymentMethod = (method) => {
  const allowed = [
    'tiền mặt',
    'VietQR - Chuyển khoản'
  ];
  return allowed.includes(method);
};