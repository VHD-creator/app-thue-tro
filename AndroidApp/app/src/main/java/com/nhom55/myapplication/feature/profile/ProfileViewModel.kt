package com.nhom55.myapplication.feature.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.nhom55.myapplication.core.network.RetrofitInstance
import com.nhom55.myapplication.feature.auth.UserData
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed class ProfileUiState {
    object Idle : ProfileUiState()
    object Loading : ProfileUiState()
    data class Success(val user: UserData) : ProfileUiState()
    data class Error(val message: String) : ProfileUiState()
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
            } catch (e: Exception) {
                _uiState.value = ProfileUiState.Error(e.message ?: "Lỗi kết nối máy chủ")
            }
        }
    }
}
