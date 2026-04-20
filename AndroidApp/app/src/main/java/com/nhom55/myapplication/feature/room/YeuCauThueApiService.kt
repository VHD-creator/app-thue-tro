package com.nhom55.myapplication.feature.room

import retrofit2.http.Body
import retrofit2.http.POST

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
    val trang_thai: Int
)

interface YeuCauThueApiService {
    @POST("api/yeuCauThue")
    suspend fun createYeuCauThue(@Body request: CreateYeuCauThueRequest): YeuCauThueResponse
}
