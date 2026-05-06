package com.nhom55.myapplication.feature.auth

import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path

data class RegisterRequest(
    val ten_dang_nhap: String,
    val password: String,
    val vai_tro: String,
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

data class ChangePasswordRequest(
    val mat_khau_cu: String,
    val mat_khau_moi: String
)

data class ChangePasswordResponse(
    val message: String
)

data class VerifyEmailRequest(
    val email: String
)

data class ResendVerificationResponse(
    val message: String
)

data class UserData(
    val id_tai_khoan: Int,
    val ten_dang_nhap: String,
    val vai_tro: String,
    val trang_thai: Int = 1,
    val chu_tro: ProfileData? = null,
    val nguoi_thue: ProfileData? = null,
    val profile: ProfileData? = null
)

data class ProfileData(
    val id_chu_tro: Int? = null,
    val id_nguoi_thue: Int? = null,
    val ho_ten: String,
    val email: String,
    val so_dien_thoai: String? = null,
    val cccd: String? = null,
    val dia_chi: String? = null,
    val email_verified: Boolean = false,
    val phone_verified: Boolean = false,
    val verification_status: Int = 0, // 0: Chưa gửi, 1: Chờ, 2: Xong, 3: Từ chối
    val DanhSachHopDong: List<Any>? = null
)

interface AuthApiService {
    @POST("api/auth/register")
    suspend fun register(@Body request: RegisterRequest): RegisterResponse

    @POST("api/auth/login")
    suspend fun login(@Body request: LoginRequest): LoginResponse

    @GET("api/auth/me")
    suspend fun getMe(): GetMeResponse

    @POST("api/auth/change-password")
    suspend fun changePassword(@Body request: ChangePasswordRequest): ChangePasswordResponse

    @GET("api/auth/verify-email/{token}")
    suspend fun verifyEmail(@Path("token") token: String): GetMeResponse

    @POST("api/auth/resend-verification")
    suspend fun resendVerification(@Body request: VerifyEmailRequest): ResendVerificationResponse

    @POST("api/chuTro/profile/verify")
    suspend fun requestVerification(): ChangePasswordResponse // Tận dụng chung model response message

    @PUT("api/chuTro/profile")
    suspend fun updateChuTroProfile(@Body request: UpdateProfileRequest): ChangePasswordResponse

    @PUT("api/nguoiThue/profile")
    suspend fun updateNguoiThueProfile(@Body request: UpdateProfileRequest): ChangePasswordResponse
}

data class UpdateProfileRequest(
    val ho_ten: String? = null,
    val so_dien_thoai: String? = null,
    val email: String? = null,
    val dia_chi: String? = null,
    val cccd: String? = null
)
