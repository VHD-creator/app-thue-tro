export type UserProfile = {
  id_chu_tro?: number;
  id_nguoi_thue?: number;
  ho_ten?: string;
  email?: string;
  so_dien_thoai?: string;
  dia_chi?: string;
  cccd?: string;
  email_verified?: boolean;
  phone_verified?: boolean;
};

export type User = {
  id_tai_khoan: number;
  ten_dang_nhap: string;
  vai_tro: string;
  trang_thai: number;
  profile?: UserProfile | null;
};

export type LoginPayload = {
  ten_dang_nhap: string;
  password: string;
};

export type RegisterPayload = {
  ten_dang_nhap: string;
  password: string;
  vai_tro: string;
  ho_ten: string;
  email: string;
  so_dien_thoai: string;
  so_tai_khoan?: string;
  ma_ngan_hang?: string;
};

export type LoginResponse = {
  message: string;
  token: string;
  user: User;
};

export type RegisterResponse = {
  message: string;
  data?: Record<string, any>;
};

export type Stats = {
  phong: { tong: number; choThue: number; trong: number };
  hoaDon: { tong?: number; chuaThanhtoan: number; daThanhtoan: number };
  doanhThu: number;
  tongThanhToan: number;
};

export type Room = {
  id_phong: number;
  id_chu_tro?: number;
  ten_phong: string;
  gia_phong: number;
  floor: number;
  trang_thai: number;
  mo_ta?: string;
  Phong?: { id_phong: number; ten_phong: string; gia_phong?: number };
  ChuTro?: { ho_ten?: string; dia_chi?: string; so_dien_thoai?: string; email?: string };
};

export type RoomImage = {
  id_hinh_anh: number;
  id_phong: number;
  duong_dan: string;
  ten_file: string;
  loai_hinh: string;
  la_anh_dai_dien: boolean;
  thu_tu: number;
  mo_ta?: string;
};

export type Contract = {
  id_hop_dong: number;
  id_phong: number;
  id_nguoi_thue: number;
  ngay_bat_dau: string;
  ngay_ket_thuc: string;
  tien_coc?: number;
  trang_thai?: number;
  Phong?: { ten_phong?: string };
  NguoiThue?: { ho_ten?: string };
};

export type Invoice = {
  id_hoa_don: number;
  id_phong: number;
  thang_nam: string;
  tong_tien: number;
  trang_thai: number;
  Phong?: { ten_phong?: string };
  so_dien_cu?: number;
  so_dien_moi?: number;
  so_nuoc_cu?: number;
  so_nuoc_moi?: number;
  tien_dien?: number;
  tien_nuoc?: number;
  tien_phong?: number;
};

export type Payment = {
  id_thanh_toan: number;
  id_hoa_don: number;
  so_tien: number;
  hinh_thuc: string;
  ngay_thanh_toan: string;
  HoaDon?: { thang_nam?: string; Phong?: { ten_phong?: string } };
};

export type Tenant = {
  id_nguoi_thue: number;
  ho_ten: string;
  cccd?: string;
  so_dien_thoai?: string;
  email?: string;
  DanhSachHopDong?: Array<{ id_hop_dong: number; id_phong: number; ngay_bat_dau: string; ngay_ket_thuc: string }>;
};

export type ProfileUpdatePayload = {
  ho_ten?: string;
  email?: string;
  so_dien_thoai?: string;
  dia_chi?: string;
};

export type RoomPayload = {
  id_chu_tro?: number;
  ten_phong: string;
  gia_phong: number;
  mo_ta?: string;
  trang_thai?: number;
};

export type ContractPayload = {
  id_phong: number;
  id_nguoi_thue: number;
  ngay_bat_dau: string;
  ngay_ket_thuc: string;
  tien_coc?: number;
  trang_thai?: number;
};

export type InvoicePayload = {
  id_phong: number;
  thang_nam: string;
  so_dien_cu?: number;
  so_dien_moi?: number;
  so_nuoc_cu?: number;
  so_nuoc_moi?: number;
  tien_dien?: number;
  tien_nuoc?: number;
  tien_phong?: number;
  trang_thai?: number;
};

export type TenantPayload = {
  ho_ten: string;
  cccd: string;
  so_dien_thoai?: string;
  email?: string;
  id_tai_khoan?: number;
};

export type UserAccount = {
  id_tai_khoan: number;
  ten_dang_nhap: string;
  vai_tro: string;
  trang_thai: number;
  ChuTro?: { ho_ten?: string; email?: string; so_dien_thoai?: string };
  NguoiThue?: { ho_ten?: string; email?: string; so_dien_thoai?: string };
};

export type UserActionResponse = {
  message: string;
  id_tai_khoan?: number;
};

export type RentRequest = {
  id_yeu_cau: number;
  id_phong: number;
  id_nguoi_thue: number;
  ngay_bat_dau_mong_muon: string;
  ghi_chu?: string;
  trang_thai: number; // 0: Chờ duyệt, 1: Đã duyệt, 2: Từ chối/Hủy
  ly_do_tu_choi?: string;
  ngay_tao: string;
  ngay_xu_ly?: string;
  Phong?: {
    id_phong: number;
    ten_phong: string;
    gia_phong: number;
    mo_ta?: string;
  };
  NguoiThue?: {
    id_nguoi_thue: number;
    ho_ten: string;
    so_dien_thoai: string;
    email: string;
    cccd: string;
  };
};

export type RentRequestPayload = {
  id_phong: number;
  ngay_bat_dau_mong_muon: string;
  tien_coc: number;
  ghi_chu?: string;
};

export type VietQRResponse = {
  hoa_don: {
    id_hoa_don: number;
    thang_nam: string;
    tong_tien: number;
    trang_thai: number;
  };
  thanh_toan: {
    qr_url: string;
    so_tai_khoan: string;
    ma_ngan_hang: string;
    so_tien: number;
    noi_dung: string;
    ten_nguoi_nhan: string;
    huong_dan: string[];
  };
};

export type BankInfo = {
  ho_ten?: string;
  so_tai_khoan: string;
  ten_ngan_hang: string;
  ma_ngan_hang: string;
};

export type Bank = {
  ma_bin: string;
  ten_ngan_hang: string;
  viettat?: string;
  logo?: string;
};
