package com.nhom55.myapplication

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import org.json.JSONObject
import retrofit2.HttpException

sealed class LoginUiState {
    object Idle : LoginUiState()
    object Loading : LoginUiState()
    data class Success(val message: String, val token: String, val user: UserData) : LoginUiState()
    data class Error(val message: String) : LoginUiState()
}

class LoginViewModel : ViewModel() {
    private val _uiState = MutableStateFlow<LoginUiState>(LoginUiState.Idle)
    val uiState: StateFlow<LoginUiState> = _uiState.asStateFlow()

    fun login(request: LoginRequest) {
        viewModelScope.launch {
            _uiState.value = LoginUiState.Loading
            try {
                val response = RetrofitInstance.authApi.login(request)
                
                val profile = response.user.chu_tro ?: response.user.nguoi_thue
                val nameToDisplay = profile?.ho_ten ?: response.user.ten_dang_nhap
                val emailToDisplay = profile?.email ?: response.user.vai_tro
                
                SessionManager.login(
                    user = User(
                        id = response.user.id_tai_khoan.toString(),
                        name = nameToDisplay,
                        email = emailToDisplay,
                        avatarUrl = null,
                        role = response.user.vai_tro
                    ),
                    token = response.token
                )
                
                _uiState.value = LoginUiState.Success(response.message, response.token, response.user)
            } catch (e: HttpException) {
                var errorMessage = "Đăng nhập thất bại"
                try {
                    val errorBody = e.response()?.errorBody()?.string()
                    if (errorBody != null) {
                        val jsonObject = JSONObject(errorBody)
                        if (jsonObject.has("message")) {
                            errorMessage = jsonObject.getString("message")
                        }
                    }
                } catch (parseException: Exception) {
                    // Ignore parse error
                }
                _uiState.value = LoginUiState.Error(errorMessage)
            } catch (e: Exception) {
                _uiState.value = LoginUiState.Error(e.message ?: "Lỗi kết nối mạng")
            }
        }
    }

    fun resetState() {
        _uiState.value = LoginUiState.Idle
    }
}
