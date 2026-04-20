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
  User
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
