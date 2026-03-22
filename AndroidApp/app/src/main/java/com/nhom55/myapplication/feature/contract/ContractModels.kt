package com.nhom55.myapplication.feature.contract

data class ContractApiModel(
    val id_hop_dong: Int,
    val id_phong: Int,
    val id_nguoi_thue: Int,
    val ngay_bat_dau: String,
    val ngay_ket_thuc: String,
    val tien_coc: Long,
    val trang_thai: Int,
    val Phong: ContractPhongInfo? = null,
    val NguoiThue: ContractNguoiThueInfo? = null
)

data class ContractPhongInfo(
    val id_phong: Int,
    val ten_phong: String?,
    val gia_phong: Double?
)

data class ContractNguoiThueInfo(
    val id_nguoi_thue: Int,
    val ho_ten: String?
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
        startDate = ngay_bat_dau,
        endDate = ngay_ket_thuc,
        deposit = tien_coc,
        status = if (trang_thai == 1) ContractStatus.ACTIVE else ContractStatus.EXPIRED
    )
}
