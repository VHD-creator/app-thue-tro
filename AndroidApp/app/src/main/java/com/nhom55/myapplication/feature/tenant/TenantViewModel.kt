package com.nhom55.myapplication.feature.tenant

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.nhom55.myapplication.core.network.RetrofitInstance
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed class TenantUiState {
    object Loading : TenantUiState()
    data class Success(val tenants: List<Tenant>) : TenantUiState()
    data class Error(val message: String) : TenantUiState()
}

class TenantViewModel : ViewModel() {
    private val _uiState = MutableStateFlow<TenantUiState>(TenantUiState.Loading)
    val uiState: StateFlow<TenantUiState> = _uiState.asStateFlow()

    init {
        loadTenants()
    }

    fun loadTenants() {
        viewModelScope.launch {
            _uiState.value = TenantUiState.Loading
            try {
                val response = RetrofitInstance.tenantApi.getTenants()
                val tenants = response.map { it.toTenant() }
                _uiState.value = TenantUiState.Success(tenants)
            } catch (e: Exception) {
                _uiState.value = TenantUiState.Error(
                    e.message ?: "Đã xảy ra lỗi khi tải dữ liệu kết nối"
                )
            }
        }
    }

    fun getTenantById(tenantId: String?): Tenant? {
        val state = _uiState.value
        return if (state is TenantUiState.Success) {
            state.tenants.find { it.id == tenantId }
        } else {
            null
        }
    }
}
