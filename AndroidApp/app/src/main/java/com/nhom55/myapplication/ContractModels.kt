package com.nhom55.myapplication

data class ContractApiModel(
    val id_hop_dong: Int,
    val id_phong: Int,
    val id_nguoi_thue: Int,
    val ngay_bat_dau: String,
    val ngay_ket_thuc: String,
    val tien_coc: Long,
    val trang_thai: Int
)

data class Contract(
    val id: String,
    val roomId: String,
    val tenantId: String,
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
        tenantId = id_nguoi_thue.toString(),
        startDate = ngay_bat_dau,
        endDate = ngay_ket_thuc,
        deposit = tien_coc,
        status = if (trang_thai == 1) ContractStatus.ACTIVE else ContractStatus.EXPIRED
    )
}
