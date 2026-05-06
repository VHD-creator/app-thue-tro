import {
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  RegisterResponse,
  Room,
  RoomImage,
  Contract,
  Invoice,
  Payment,
  Tenant,
  ProfileUpdatePayload,
  RoomPayload,
  ContractPayload,
  InvoicePayload,
  TenantPayload,
  UserAccount,
  Stats,
  User,
  RentRequest,
  RentRequestPayload,
  VietQRResponse,
  BankInfo
} from '../types';

const BASE_URL = '/api';

async function fetchJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (body as any).error || (body as any).message || res.statusText;
    throw new Error(message || 'Lỗi kết nối API');
  }
  return body as T;
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const response = await fetchJson<LoginResponse>(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  localStorage.setItem('token', response.token);
  return response;
}

export async function register(payload: RegisterPayload): Promise<RegisterResponse> {
  return fetchJson<RegisterResponse>(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

export async function verifyEmail(token: string): Promise<{ message: string; user?: User }> {
  return fetchJson<{ message: string; user?: User }>(`${BASE_URL}/auth/verify-email/${token}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function resendVerificationEmail(email: string): Promise<{ message: string }> {
  return fetchJson<{ message: string }>(`${BASE_URL}/auth/resend-verification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  return fetchJson<{ message: string }>(`${BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
}

export async function resetPassword(token: string, new_password: string): Promise<{ message: string }> {
  return fetchJson<{ message: string }>(`${BASE_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, new_password })
  });
}

export async function sendChatbotMessage(message: string): Promise<{ reply: string }> {
  return fetchJson<{ reply: string }>(`${BASE_URL}/chatbot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ message })
  });
}

export async function getCurrentUser(): Promise<User> {
  const response = await fetchJson<{ message: string; user: User }>(`${BASE_URL}/auth/me`, {
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
  });
  return response.user;
}

export async function changePassword(payload: { mat_khau_cu: string; mat_khau_moi: string }): Promise<{ message: string }> {
  return fetchJson<{ message: string }>(`${BASE_URL}/auth/change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(payload)
  });
}

export function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchStats(): Promise<Stats> {
  return fetchJson<Stats>(`${BASE_URL}/baoCao/tongHop`, {
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
  });
}

export async function fetchRevenueReport(): Promise<Array<{ label: string; value: number }>> {
  return fetchJson<Array<{ label: string; value: number }>>(`${BASE_URL}/thanhToan/bao-cao-doanh-thu`, {
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
  });
}

export async function fetchRooms(): Promise<Room[]> {
  return fetchJson<Room[]>(`${BASE_URL}/phong`, {
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
  });
}

export async function fetchRoomById(id: number): Promise<Room> {
  return fetchJson<Room>(`${BASE_URL}/phong/${id}`, {
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
  });
}

export async function createRoom(body: RoomPayload): Promise<any> {
  return fetchJson<any>(`${BASE_URL}/phong`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(body)
  });
}

export async function updateRoom(id: number, body: Partial<RoomPayload>): Promise<any> {
  return fetchJson<any>(`${BASE_URL}/phong/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(body)
  });
}

export async function deleteRoom(id: number): Promise<any> {
  return fetchJson<any>(`${BASE_URL}/phong/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
  });
}

export async function fetchRoomImages(roomId: number): Promise<RoomImage[]> {
  return fetchJson<RoomImage[]>(`${BASE_URL}/hinhAnh/phong/${roomId}`, {
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
  });
}

export async function uploadRoomImage(roomId: number, file: File): Promise<any> {
  const formData = new FormData();
  formData.append('image', file);
  return fetchJson<any>(`${BASE_URL}/hinhAnh/phong/${roomId}`, {
    method: 'POST',
    headers: { ...getAuthHeaders() },
    body: formData
  });
}

export async function uploadRoomImages(roomId: number, files: File[]): Promise<any> {
  const formData = new FormData();
  files.forEach((file) => formData.append('images', file));
  return fetchJson<any>(`${BASE_URL}/hinhAnh/phong/${roomId}/multiple`, {
    method: 'POST',
    headers: { ...getAuthHeaders() },
    body: formData
  });
}

export async function fetchRoomContracts(roomId: number): Promise<Contract[]> {
  const response = await fetchJson<{ data: Contract[] }>(`${BASE_URL}/phong/${roomId}/hop-dong`, {
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
  });
  return response.data;
}

export async function fetchRoomInvoices(roomId: number): Promise<Invoice[]> {
  const response = await fetchJson<{ data: Invoice[] }>(`${BASE_URL}/phong/${roomId}/hoa-don`, {
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
  });
  return response.data;
}

export async function fetchContracts(): Promise<Contract[]> {
  return fetchJson<Contract[]>(`${BASE_URL}/hopDong`, {
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
  });
}

export async function fetchMyContracts(): Promise<Contract[]> {
  return fetchJson<Contract[]>(`${BASE_URL}/nguoiThue/hop-dong`, {
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
  });
}

export async function fetchContractById(id: number): Promise<Contract> {
  return fetchJson<Contract>(`${BASE_URL}/hopDong/${id}`, {
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
  });
}

export async function createContract(body: ContractPayload): Promise<any> {
  return fetchJson<any>(`${BASE_URL}/hopDong`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(body)
  });
}

export async function updateContract(id: number, body: Partial<ContractPayload>): Promise<any> {
  return fetchJson<any>(`${BASE_URL}/hopDong/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(body)
  });
}

export async function deleteContract(id: number): Promise<any> {
  return fetchJson<any>(`${BASE_URL}/hopDong/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
  });
}

export async function fetchInvoices(): Promise<Invoice[]> {
  return fetchJson<Invoice[]>(`${BASE_URL}/hoaDon`, {
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
  });
}

export async function fetchMyInvoices(): Promise<Invoice[]> {
  return fetchJson<Invoice[]>(`${BASE_URL}/nguoiThue/hoa-don`, {
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
  });
}

export async function fetchInvoiceById(id: number): Promise<Invoice> {
  return fetchJson<Invoice>(`${BASE_URL}/hoaDon/${id}`, {
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
  });
}

export async function createInvoice(body: InvoicePayload): Promise<any> {
  return fetchJson<any>(`${BASE_URL}/hoaDon`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(body)
  });
}

export async function updateInvoice(id: number, body: Partial<InvoicePayload>): Promise<any> {
  return fetchJson<any>(`${BASE_URL}/hoaDon/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(body)
  });
}

export async function deleteInvoice(id: number): Promise<any> {
  return fetchJson<any>(`${BASE_URL}/hoaDon/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
  });
}

export async function fetchPaymentsByInvoice(invoiceId: number): Promise<Payment[]> {
  return fetchJson<Payment[]>(`${BASE_URL}/thanhToan/hoa_don/${invoiceId}`, {
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
  });
}

export async function createPayment(body: Record<string, any>): Promise<any> {
  return fetchJson<any>(`${BASE_URL}/thanhToan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(body)
  });
}

export async function fetchTenants(): Promise<Tenant[]> {
  return fetchJson<Tenant[]>(`${BASE_URL}/nguoiThue`, {
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
  });
}

export async function fetchTenantById(id: number): Promise<Tenant> {
  return fetchJson<Tenant>(`${BASE_URL}/nguoiThue/${id}`, {
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
  });
}

export async function createTenant(body: TenantPayload): Promise<any> {
  return fetchJson<any>(`${BASE_URL}/nguoiThue`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(body)
  });
}

export async function updateTenant(id: number, body: Partial<TenantPayload>): Promise<any> {
  return fetchJson<any>(`${BASE_URL}/nguoiThue/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(body)
  });
}

export async function deleteTenant(id: number): Promise<any> {
  return fetchJson<any>(`${BASE_URL}/nguoiThue/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
  });
}

export async function fetchUsers(): Promise<UserAccount[]> {
  return fetchJson<UserAccount[]>(`${BASE_URL}/taiKhoan`, {
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
  });
}

export async function lockUser(userId: number): Promise<any> {
  return fetchJson<any>(`${BASE_URL}/taiKhoan/${userId}/khoa`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
  });
}

export async function unlockUser(userId: number): Promise<any> {
  return fetchJson<any>(`${BASE_URL}/taiKhoan/${userId}/mo-khoa`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
  });
}

export async function resetUserPassword(userId: number, newPassword: string): Promise<any> {
  return fetchJson<any>(`${BASE_URL}/taiKhoan/${userId}/doi-mat-khau`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ mat_khau_moi: newPassword })
  });
}

export async function fetchProfile(role: string): Promise<any> {
  const path = role === 'CHU_TRO' ? 'chuTro/profile' : 'nguoiThue/profile';
  return fetchJson<any>(`${BASE_URL}/${path}`, {
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
  });
}

export async function updateProfile(role: string, body: ProfileUpdatePayload): Promise<any> {
  const path = role === 'CHU_TRO' ? 'chuTro/profile' : 'nguoiThue/profile';
  return fetchJson<any>(`${BASE_URL}/${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(body)
  });
}

export async function requestVerification(): Promise<any> {
  return fetchJson<any>(`${BASE_URL}/chuTro/profile/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
  });
}

export async function fetchLandlords(status?: number): Promise<Tenant[]> {
  const query = status !== undefined ? `?status=${status}` : '';
  return fetchJson<any[]>(`${BASE_URL}/chuTro${query}`, {
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
  });
}

export async function approveLandlord(id: number, approve: boolean): Promise<any> {
  return fetchJson<any>(`${BASE_URL}/chuTro/${id}/approve-verification`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ approve })
  });
}

// ==================== YÊU CẦU THUÊ ====================

export async function fetchRentRequests(status?: number): Promise<RentRequest[]> {
  const query = status !== undefined ? `?trang_thai=${status}` : '';
  return fetchJson<RentRequest[]>(`${BASE_URL}/yeuCauThue${query}`, {
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
  });
}

export async function fetchMyRentRequests(): Promise<RentRequest[]> {
  return fetchJson<RentRequest[]>(`${BASE_URL}/yeuCauThue/cua-toi`, {
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
  });
}

export async function createRentRequest(body: RentRequestPayload): Promise<any> {
  return fetchJson<any>(`${BASE_URL}/yeuCauThue`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(body)
  });
}

export async function approveRentRequest(id: number, body: { ngay_ket_thuc: string; tien_coc: number }): Promise<any> {
  return fetchJson<any>(`${BASE_URL}/yeuCauThue/${id}/duyet`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(body)
  });
}

export async function rejectRentRequest(id: number, reason: string): Promise<any> {
  return fetchJson<any>(`${BASE_URL}/yeuCauThue/${id}/tu-choi`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ ly_do_tu_choi: reason })
  });
}

export async function cancelRentRequest(id: number): Promise<any> {
  return fetchJson<any>(`${BASE_URL}/yeuCauThue/${id}/huy`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
  });
}

// ==================== VIETQR ====================

export async function fetchVietQR(invoiceId: number): Promise<VietQRResponse> {
  return fetchJson<VietQRResponse>(`${BASE_URL}/vietqr/hoa-don/${invoiceId}`, {
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
  });
}

export async function updateBankInfo(body: BankInfo): Promise<any> {
  return fetchJson<any>(`${BASE_URL}/vietqr/chu-tro/ngan-hang`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(body)
  });
}

export async function fetchBankInfo(): Promise<{ da_cap_nhat: boolean; data: BankInfo; qr_preview: string | null }> {
  return fetchJson<{ da_cap_nhat: boolean; data: BankInfo; qr_preview: string | null }>(`${BASE_URL}/vietqr/chu-tro/ngan-hang`, {
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
  });
}

export async function fetchBanks(): Promise<Array<{ ten: string; ma_bin: string; ten_viet_tat: string }>> {
  return fetchJson<Array<{ ten: string; ma_bin: string; ten_viet_tat: string }>>(`${BASE_URL}/vietqr/ngan-hang`, {
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function fetchMyRoom(): Promise<Room> {
  const response = await fetch(`${BASE_URL}/phong/cua-toi`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Không tìm thấy phòng của bạn');
  }
  return response.json();
}

/**
 * Lấy chi tiết phòng + hợp đồng + hóa đơn
 * - Người thuê: chỉ thấy hợp đồng & hóa đơn của chính mình
 * - Chủ trọ/Admin: thấy tất cả
 */
export async function fetchRoomDetail(id: number): Promise<any> {
  return fetchJson<any>(`${BASE_URL}/phong/${id}`, {
    headers: { 
      'Content-Type': 'application/json', 
      ...getAuthHeaders() 
    }
  });
}

// Xác nhận thanh toán (thủ công)
export async function confirmPayment(idHoaDon: number, body?: {
  so_tien?: number;
  ghi_chu?: string;
}) {
  return fetchJson<any>(`${BASE_URL}/vietqr/xac-nhan/${idHoaDon}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(body || {})
  });
}

/**
 * Tải PDF Hóa đơn
 */
export async function downloadInvoicePdf(id: number, fileName: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/hoaDon/${id}/pdf`, {
    headers: { ...getAuthHeaders() }
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Không thể tải PDF hóa đơn');
  }
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

/**
 * Tải PDF Hợp đồng
 */
export async function downloadContractPdf(id: number, fileName: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/hopDong/${id}/pdf`, {
    headers: { ...getAuthHeaders() }
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Không thể tải PDF hợp đồng');
  }
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
