package com.nhom55.myapplication.feature.dashboard

import retrofit2.http.GET
import retrofit2.http.Query

data class DashboardStats(
    val phong: PhongStats,
    val hoaDon: HoaDonStats,
    val doanhThu: Double,
    val tongThanhToan: Int
)

data class PhongStats(
    val tong: Int,
    val trong: Int,
    val choThue: Int
)

data class HoaDonStats(
    val tong: Int,
    val chuaThanhtoan: Int,
    val daThanhtoan: Int
)

data class RevenueDetail(
    val id: Int,
    val phong: String,
    val soTien: Double,
    val ngayThanhToan: String,
    val hinhThuc: String
)

data class RevenueReport(
    val tongDoanhThu: Double,
    val soLuongThanhToan: Int,
    val khoangThoiGian: String,
    val chiTiet: List<RevenueDetail>
)

interface ReportApiService {
    @GET("api/baoCao/tongHop")
    suspend fun getDashboardStats(): DashboardStats

    @GET("api/baoCao/doanhThu")
    suspend fun getRevenueReport(
        @Query("startDate") startDate: String,
        @Query("endDate") endDate: String
    ): RevenueReport
}
