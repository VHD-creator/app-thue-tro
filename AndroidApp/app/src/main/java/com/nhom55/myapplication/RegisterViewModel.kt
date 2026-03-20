package com.nhom55.myapplication

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import org.json.JSONObject
import retrofit2.HttpException

sealed class RegisterUiState {
    object Idle : RegisterUiState()
    object Loading : RegisterUiState()
    data class Success(val message: String) : RegisterUiState()
    data class Error(val message: String) : RegisterUiState()
}

class RegisterViewModel : ViewModel() {
    private val _uiState = MutableStateFlow<RegisterUiState>(RegisterUiState.Idle)
    val uiState: StateFlow<RegisterUiState> = _uiState.asStateFlow()

    fun register(request: RegisterRequest) {
        viewModelScope.launch {
            _uiState.value = RegisterUiState.Loading
            try {
                val response = RetrofitInstance.authApi.register(request)
                _uiState.value = RegisterUiState.Success(response.message)
            } catch (e: HttpException) {
                var errorMessage = "Đăng ký thất bại"
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
                _uiState.value = RegisterUiState.Error(errorMessage)
            } catch (e: Exception) {
                _uiState.value = RegisterUiState.Error(e.message ?: "Lỗi kết nối mạng")
            }
        }
    }

    fun resetState() {
        _uiState.value = RegisterUiState.Idle
    }
}
