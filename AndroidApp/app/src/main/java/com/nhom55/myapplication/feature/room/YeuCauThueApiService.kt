package com.nhom55.myapplication.feature.room

import retrofit2.http.*

data class CreateYeuCauThueRequest(
    val id_phong: Int,
    val ngay_bat_dau_mong_muon: String,
    val ngay_ket_thuc: String?,
    val tien_coc: Long,
    val ghi_chu: String? = ""
)

data class YeuCauThueResponse(
    val message: String,
    val data: YeuCauThueData
)

data class YeuCauThueData(
    val id_yeu_cau: Int,
    val id_phong: Int,
    val id_nguoi_thue: Int,
    val trang_thai: Int,
    val ngay_bat_dau_mong_muon: String? = null,
    val ghi_chu: String? = null,
    val ngay_tao: String? = null,
    val Phong: RoomShortInfo? = null,
    val NguoiThue: TenantShortInfo? = null,
    val ly_do_tu_choi: String? = null
)

data class RoomShortInfo(
    val id_phong: Int,
    val ten_phong: String,
    val gia_phong: Double
)

data class TenantShortInfo(
    val id_nguoi_thue: Int,
    val ho_ten: String,
    val so_dien_thoai: String,
    val email: String,
    val cccd: String
)

data class ApproveRequest(
    val ngay_ket_thuc: String,
    val tien_coc: Long
)

data class RejectRequest(
    val ly_do_tu_choi: String? = null
)

data class MessageResponse(
    val message: String
)

interface YeuCauThueApiService {
    // NGƯỜI THUÊ
    @POST("api/yeuCauThue")
    suspend fun createYeuCauThue(@Body request: CreateYeuCauThueRequest): YeuCauThueResponse

    @GET("api/yeuCauThue/cua-toi")
    suspend fun getMyRequests(): List<YeuCauThueData>

    @DELETE("api/yeuCauThue/{id}/huy")
    suspend fun cancelRequest(@Path("id") id: Int): MessageResponse

    // CHỦ TRỌ
    @GET("api/yeuCauThue")
    suspend fun getAllRequests(@Query("trang_thai") status: Int? = null): List<YeuCauThueData>

    @PUT("api/yeuCauThue/{id}/duyet")
    suspend fun approveRequest(@Path("id") id: Int, @Body request: ApproveRequest): MessageResponse

    @PUT("api/yeuCauThue/{id}/tu-choi")
    suspend fun rejectRequest(@Path("id") id: Int, @Body request: RejectRequest): MessageResponse
}
