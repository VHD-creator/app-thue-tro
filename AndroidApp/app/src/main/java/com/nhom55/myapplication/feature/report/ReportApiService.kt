package com.nhom55.myapplication.feature.report

import retrofit2.http.GET

data class StatModel(
    val label: String,
    val value: Double
)

interface ReportApiService {
    @GET("api/thanhToan/bao-cao-doanh-thu")
    suspend fun getRevenueStats(): List<StatModel>
}
