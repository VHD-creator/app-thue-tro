package com.nhom55.myapplication.feature.admin

import com.nhom55.myapplication.core.network.TaiKhoanApiModel
import retrofit2.http.*

interface UserApiService {
    @GET("api/taiKhoan")
    suspend fun getAllUsers(): List<TaiKhoanApiModel>

    @PUT("api/taiKhoan/{id}/khoa")
    suspend fun lockUser(@Path("id") userId: Int): UserActionResponse

    @PUT("api/taiKhoan/{id}/mo-khoa")
    suspend fun unlockUser(@Path("id") userId: Int): UserActionResponse
}

data class UserActionResponse(
    val message: String,
    val id_tai_khoan: Int
)
