package com.nhom55.myapplication.feature.admin

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.nhom55.myapplication.core.network.RetrofitInstance
import com.nhom55.myapplication.core.network.TaiKhoanApiModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import retrofit2.Response
import retrofit2.HttpException
import org.json.JSONObject

sealed class UserUiState {
    object Idle : UserUiState()
    object Loading : UserUiState()
    data class Success(val users: List<TaiKhoanApiModel>) : UserUiState()
    data class Error(val message: String) : UserUiState()
}

class UserViewModel : ViewModel() {
    private val _uiState = MutableStateFlow<UserUiState>(UserUiState.Idle)
    val uiState: StateFlow<UserUiState> = _uiState.asStateFlow()

    fun loadUsers() {
        _uiState.value = UserUiState.Loading
        viewModelScope.launch {
            try {
                val users = RetrofitInstance.userApi.getAllUsers()
                _uiState.value = UserUiState.Success(users)
            } catch (e: Exception) {
                _uiState.value = UserUiState.Error(e.message ?: "Lỗi tải danh sách người dùng")
            }
        }
    }

    fun toggleUserLock(userId: Int, isCurrentlyLocked: Boolean, onResult: (Boolean, String) -> Unit) {
        viewModelScope.launch {
            try {
                val response = if (isCurrentlyLocked) {
                    RetrofitInstance.userApi.unlockUser(userId)
                } else {
                    RetrofitInstance.userApi.lockUser(userId)
                }
                loadUsers() // Reload list
                onResult(true, response.message)
            } catch (e: retrofit2.HttpException) {
                val errorBody = e.response()?.errorBody()?.string()
                val errorMsg = parseErrorMessage(errorBody) ?: "Lỗi kết nối"
                onResult(false, errorMsg)
            } catch (e: Exception) {
                onResult(false, e.message ?: "Lỗi thực hiện thao tác")
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
