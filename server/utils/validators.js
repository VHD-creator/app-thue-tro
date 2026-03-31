// ==================== VALIDATORS ====================
// Dùng chung cho tất cả routes

export const validatePrice = (value) => {
  const num = parseFloat(value);
  return !isNaN(num) && num > 0;
};

export const validateAmount = validatePrice;

export const validateStringLength = (str, min = 1, max = 255) => {
  if (typeof str !== 'string') return false;
  return str.trim().length >= min && str.trim().length <= max;
};

export const validateDate = (dateStr) => {
  if (!dateStr) return false;
  const regex = /^\d{2}-\d{2}-\d{4}$/;
  if (!regex.test(dateStr)) return false;
  const [d, m, y] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y &&
         date.getMonth() === m - 1 &&
         date.getDate() === d;
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

// ✅ Đúng theo file gốc của bạn — chỉ 2 method
export const validatePaymentMethod = (method) => {
  const allowed = [
    'tiền mặt',
    'VietQR - Chuyển khoản'
  ];
  return allowed.includes(method);
};