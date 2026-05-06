package com.nhom55.myapplication.feature.payment

import retrofit2.http.*

data class BankApiModel(
    val ten: String,
    val ma_bin: String,
    val ten_viet_tat: String
)

data class VietQRResponse(
    val hoa_don: VietQRInvoiceInfo,
    val thanh_toan: VietQRPaymentInfo
)

data class VietQRInvoiceInfo(
    val id_hoa_don: Int,
    val thang_nam: String,
    val tong_tien: Double,
    val trang_thai: Int
)

data class VietQRPaymentInfo(
    val qr_url: String,
    val so_tai_khoan: String,
    val ma_ngan_hang: String,
    val so_tien: Double,
    val noi_dung: String,
    val ten_nguoi_nhan: String,
    val huong_dan: List<String>
)

data class LandlordBankInfoResponse(
    val da_cap_nhat: Boolean,
    val data: LandlordBankData?,
    val qr_preview: String?
)

data class LandlordBankData(
    val ho_ten: String?,
    val so_tai_khoan: String?,
    val ten_ngan_hang: String?,
    val ma_ngan_hang: String?
)

data class UpdateBankInfoRequest(
    val so_tai_khoan: String,
    val ten_ngan_hang: String,
    val ma_ngan_hang: String
)

data class UpdateBankInfoResponse(
    val message: String,
    val data: LandlordBankData,
    val qr_mau: String
)

data class VietQRConfirmRequest(
    val so_tien: Double? = null,
    val ghi_chu: String? = null
)

interface VietQRApiService {
    @GET("api/vietqr/ngan-hang")
    suspend fun getBanks(): List<BankApiModel>

    @GET("api/vietqr/hoa-don/{id_hoa_don}")
    suspend fun getInvoiceQR(@Path("id_hoa_don") invoiceId: Int): VietQRResponse

    @GET("api/vietqr/chu-tro/ngan-hang")
    suspend fun getLandlordBankInfo(): LandlordBankInfoResponse

    @PUT("api/vietqr/chu-tro/ngan-hang")
    suspend fun updateLandlordBankInfo(@Body request: UpdateBankInfoRequest): UpdateBankInfoResponse

    @POST("api/vietqr/xac-nhan/{id_hoa_don}")
    suspend fun confirmVietQRPayment(
        @Path("id_hoa_don") invoiceId: Int,
        @Body request: VietQRConfirmRequest
    ): PaymentResponse
}
