package com.nhom55.myapplication.feature.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.nhom55.myapplication.core.network.RetrofitInstance
import com.nhom55.myapplication.feature.auth.UserData
import com.nhom55.myapplication.feature.auth.ChangePasswordRequest
import com.nhom55.myapplication.feature.auth.UpdateProfileRequest
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import org.json.JSONObject
import retrofit2.HttpException

sealed class ProfileUiState {
    object Idle : ProfileUiState()
    object Loading : ProfileUiState()
    data class Success(val user: UserData) : ProfileUiState()
    data class Error(val message: String) : ProfileUiState()
}

sealed class ChangePasswordUiState {
    object Idle : ChangePasswordUiState()
    object Loading : ChangePasswordUiState()
    data class Success(val message: String) : ChangePasswordUiState()
    data class Error(val message: String) : ChangePasswordUiState()
}

class ProfileViewModel : ViewModel() {
    private val _uiState = MutableStateFlow<ProfileUiState>(ProfileUiState.Idle)
    val uiState: StateFlow<ProfileUiState> = _uiState.asStateFlow()

    fun loadProfile() {
        if (_uiState.value is ProfileUiState.Success) return
        _uiState.value = ProfileUiState.Loading
        viewModelScope.launch {
            try {
                val response = RetrofitInstance.authApi.getMe()
                _uiState.value = ProfileUiState.Success(response.user)
            } catch (e: retrofit2.HttpException) {
                val errorBody = e.response()?.errorBody()?.string()
                val message = parseErrorMessage(errorBody) ?: "Lỗi tải hồ sơ (${e.code()})"
                _uiState.value = ProfileUiState.Error(message)
            } catch (e: Exception) {
                _uiState.value = ProfileUiState.Error(e.message ?: "Lỗi kết nối máy chủ")
            }
        }
    }

    private val _changePasswordState = MutableStateFlow<ChangePasswordUiState>(ChangePasswordUiState.Idle)
    val changePasswordState: StateFlow<ChangePasswordUiState> = _changePasswordState.asStateFlow()

    fun changePassword(old: String, new: String) {
        _changePasswordState.value = ChangePasswordUiState.Loading
        viewModelScope.launch {
            try {
                val response = RetrofitInstance.authApi.changePassword(
                    ChangePasswordRequest(mat_khau_cu = old, mat_khau_moi = new)
                )
                _changePasswordState.value = ChangePasswordUiState.Success(response.message)
            } catch (e: retrofit2.HttpException) {
                val errorBody = e.response()?.errorBody()?.string()
                val message = parseErrorMessage(errorBody) ?: "Lỗi đổi mật khẩu (${e.code()})"
                _changePasswordState.value = ChangePasswordUiState.Error(message)
            } catch (e: Exception) {
                _changePasswordState.value = ChangePasswordUiState.Error(e.message ?: "Lỗi kết nối")
            }
        }
    }

    fun resetChangePasswordState() {
        _changePasswordState.value = ChangePasswordUiState.Idle
    }

    fun requestVerification() {
        viewModelScope.launch {
            try {
                RetrofitInstance.authApi.requestVerification()
                // Sau khi gửi thành công, tải lại hồ sơ để cập nhật trạng thái UI
                loadProfileForce()
            } catch (e: Exception) {
                _uiState.value = ProfileUiState.Error("Không thể gửi yêu cầu xác thực")
            }
        }
    }

    private fun loadProfileForce() {
        _uiState.value = ProfileUiState.Loading
        viewModelScope.launch {
            try {
                val response = RetrofitInstance.authApi.getMe()
                _uiState.value = ProfileUiState.Success(response.user)
            } catch (e: Exception) {
                _uiState.value = ProfileUiState.Error("Lỗi cập nhật trạng thái")
            }
        }
    }

    fun updateProfile(role: String, request: UpdateProfileRequest, onSuccess: () -> Unit) {
        viewModelScope.launch {
            try {
                if (role == "CHU_TRO") {
                    RetrofitInstance.authApi.updateChuTroProfile(request)
                } else {
                    RetrofitInstance.authApi.updateNguoiThueProfile(request)
                }
                loadProfileForce()
                onSuccess()
            } catch (e: Exception) {
                _uiState.value = ProfileUiState.Error("Không thể cập nhật hồ sơ")
            }
        }
    }

    private fun parseErrorMessage(errorBody: String?): String? {
        if (errorBody == null) return null
        return try {
            val json = org.json.JSONObject(errorBody)
            if (json.has("error")) json.getString("error")
            else if (json.has("message")) json.getString("message")
            else null
        } catch (e: Exception) {
            null
        }
    }
}
