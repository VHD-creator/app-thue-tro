package com.nhom55.myapplication.feature.contract

import com.google.gson.annotations.SerializedName

data class ContractApiModel(
    @SerializedName("id_hop_dong") val id_hop_dong: Int,
    @SerializedName("id_phong") val id_phong: Int,
    @SerializedName("id_nguoi_thue") val id_nguoi_thue: Int,
    @SerializedName("ngay_bat_dau") val ngay_bat_dau: String,
    @SerializedName("ngay_ket_thuc") val ngay_ket_thuc: String,
    @SerializedName("tien_coc") val tien_coc: Long,
    @SerializedName("trang_thai") val trang_thai: Int,
    @SerializedName("Phong") val Phong: ContractPhongInfo? = null,
    @SerializedName("NguoiThue") val NguoiThue: ContractNguoiThueInfo? = null
)

data class ContractPhongInfo(
    @SerializedName("id_phong") val id_phong: Int,
    @SerializedName("ten_phong") val ten_phong: String?,
    @SerializedName("gia_phong") val gia_phong: Double?
)

data class ContractNguoiThueInfo(
    @SerializedName("id_nguoi_thue") val id_nguoi_thue: Int,
    @SerializedName("ho_ten") val ho_ten: String?
)

data class ContractRequest(
    val id_phong: Int,
    val id_nguoi_thue: Int,
    val ngay_bat_dau: String,
    val ngay_ket_thuc: String,
    val tien_coc: Long
)

data class ContractResponse(
    val message: String,
    val hopDong: ContractApiModel? = null
)

data class Contract(
    val id: String,
    val roomId: String,
    val roomName: String,
    val tenantId: String,
    val tenantName: String,
    val startDate: String,
    val endDate: String,
    val deposit: Long,
    val status: ContractStatus
)

enum class ContractStatus {
    EXPIRED,  // 0
    ACTIVE    // 1
}

fun ContractApiModel.toContract(): Contract {
    return Contract(
        id = id_hop_dong.toString(),
        roomId = id_phong.toString(),
        roomName = Phong?.ten_phong ?: "Phòng $id_phong",
        tenantId = id_nguoi_thue.toString(),
        tenantName = NguoiThue?.ho_ten ?: "Khách #$id_nguoi_thue",
        startDate = com.nhom55.myapplication.core.utils.DateFormatter.formatDateOnly(ngay_bat_dau) ?: ngay_bat_dau,
        endDate = com.nhom55.myapplication.core.utils.DateFormatter.formatDateOnly(ngay_ket_thuc) ?: ngay_ket_thuc,
        deposit = tien_coc,
        status = if (trang_thai == 1) ContractStatus.ACTIVE else ContractStatus.EXPIRED
    )
}
