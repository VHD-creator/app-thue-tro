package com.nhom55.myapplication.feature.tenant

import com.google.gson.annotations.SerializedName

data class HopDongShortApiModel(
    @SerializedName("id_hop_dong") val id_hop_dong: Int,
    @SerializedName("id_phong") val id_phong: Int,
    @SerializedName("ngay_bat_dau") val ngay_bat_dau: String,
    @SerializedName("ngay_ket_thuc") val ngay_ket_thuc: String
)

data class TenantApiModel(
    @SerializedName("id_nguoi_thue") val id_nguoi_thue: Int,
    @SerializedName("ho_ten") val ho_ten: String,
    @SerializedName("cccd") val cccd: String?,
    @SerializedName("so_dien_thoai") val so_dien_thoai: String?,
    @SerializedName("email") val email: String?,
    @SerializedName("DanhSachHopDong") val DanhSachHopDong: List<HopDongShortApiModel>?,
    @SerializedName("id_tai_khoan") val id_tai_khoan: Int?
)

data class Tenant(
    val id: String,
    val name: String,
    val identityCard: String?,
    val phone: String?,
    val email: String?,
    val moveInDate: String?,
    val moveOutDate: String?
)

fun TenantApiModel.toTenant(): Tenant {
    return Tenant(
        id = id_nguoi_thue.toString(),
        name = ho_ten,
        identityCard = cccd,
        phone = so_dien_thoai,
        email = email,
        moveInDate = com.nhom55.myapplication.core.utils.DateFormatter.formatDateOnly(DanhSachHopDong?.firstOrNull()?.ngay_bat_dau),
        moveOutDate = com.nhom55.myapplication.core.utils.DateFormatter.formatDateOnly(DanhSachHopDong?.firstOrNull()?.ngay_ket_thuc)
    )
}


