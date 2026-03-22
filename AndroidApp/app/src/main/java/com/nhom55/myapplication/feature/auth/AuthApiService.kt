package com.nhom55.myapplication.feature.auth

import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST

data class RegisterRequest(
    val ten_dang_nhap: String,
    val password: String,
    val vai_tro: String = "NGUOI_THUE",
    val ho_ten: String,
    val email: String,
    val so_dien_thoai: String
)

data class RegisterResponse(
    val message: String,
    val data: UserData? = null
)

data class LoginRequest(
    val ten_dang_nhap: String,
    val password: String
)

data class LoginResponse(
    val message: String,
    val token: String,
    val user: UserData
)

data class GetMeResponse(
    val message: String,
    val user: UserData
)

data class UserData(
    val id_tai_khoan: Int,
    val ten_dang_nhap: String,
    val vai_tro: String,
    val chu_tro: ProfileData?,
    val nguoi_thue: ProfileData?
)

data class ProfileData(
    val ho_ten: String,
    val email: String,
    val so_dien_thoai: String? = null,
    val cccd: String? = null,
    val dia_chi: String? = null
)

interface AuthApiService {
    @POST("api/auth/register")
    suspend fun register(@Body request: RegisterRequest): RegisterResponse

    @POST("api/auth/login")
    suspend fun login(@Body request: LoginRequest): LoginResponse

    @GET("api/auth/me")
    suspend fun getMe(): GetMeResponse
}
