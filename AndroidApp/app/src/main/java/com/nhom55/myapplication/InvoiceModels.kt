package com.nhom55.myapplication

data class InvoiceApiModel(
    val id_hoa_don: Int,
    val id_phong: Int,
    val thang_nam: String,
    val so_dien_cu: Int,
    val so_dien_moi: Int,
    val so_nuoc_cu: Int,
    val so_nuoc_moi: Int,
    val tien_dien: Double,
    val tien_nuoc: Double,
    val tien_phong: Double,
    val tong_tien: Double,
    val trang_thai: Int,
    val Phong: RoomBasicInfo?
)

data class RoomBasicInfo(
    val id_phong: Int,
    val ten_phong: String,
    val gia_phong: Double?
)

data class Invoice(
    val id: Int,
    val roomId: Int,
    val roomName: String,
    val monthYear: String,
    val electricityOld: Int,
    val electricityNew: Int,
    val waterOld: Int,
    val waterNew: Int,
    val electricityCost: Double,
    val waterCost: Double,
    val roomCost: Double,
    val totalCost: Double,
    val status: InvoiceStatus
)

enum class InvoiceStatus {
    UNPAID, PAID, PARTIAL
}

fun InvoiceApiModel.toInvoice(): Invoice {
    return Invoice(
        id = id_hoa_don,
        roomId = id_phong,
        roomName = Phong?.ten_phong ?: "Không rõ",
        monthYear = thang_nam,
        electricityOld = so_dien_cu,
        electricityNew = so_dien_moi,
        waterOld = so_nuoc_cu,
        waterNew = so_nuoc_moi,
        electricityCost = tien_dien,
        waterCost = tien_nuoc,
        roomCost = tien_phong,
        totalCost = tong_tien,
        status = when (trang_thai) {
            1 -> InvoiceStatus.PAID
            2 -> InvoiceStatus.PARTIAL
            else -> InvoiceStatus.UNPAID
        }
    )
}
