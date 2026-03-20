package com.nhom55.myapplication

data class PaymentApiModel(
    val id_thanh_toan: Int,
    val id_hoa_don: Int,
    val so_tien: Double,
    val hinh_thuc: String,
    val ngay_thanh_toan: String,
    val HoaDon: InvoiceBasicInfo?
)

data class InvoiceBasicInfo(
    val id_hoa_don: Int,
    val thang_nam: String,
    val tong_tien: Double,
    val Phong: RoomBasicInfo?
)

data class Payment(
    val id: Int,
    val invoiceId: Int,
    val amount: Double,
    val method: String,
    val paymentDate: String,
    val invoiceMonth: String,
    val roomName: String
)

fun PaymentApiModel.toPayment(): Payment {
    return Payment(
        id = id_thanh_toan,
        invoiceId = id_hoa_don,
        amount = so_tien,
        method = hinh_thuc,
        paymentDate = ngay_thanh_toan,
        invoiceMonth = HoaDon?.thang_nam ?: "",
        roomName = HoaDon?.Phong?.ten_phong ?: "Không rõ"
    )
}

data class PaymentRequest(
    val id_hoa_don: Int,
    val so_tien: Double,
    val hinh_thuc: String
)

data class PaymentResponse(
    val message: String,
    val data: PaymentApiModel
)
