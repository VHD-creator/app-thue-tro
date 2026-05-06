export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Chưa có';
  
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (e) {
    return dateStr;
  }
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '0 VNĐ';
  return amount.toLocaleString('vi-VN') + ' VNĐ';
}
