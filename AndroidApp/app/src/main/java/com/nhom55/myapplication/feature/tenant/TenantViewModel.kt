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

    // For create/edit/delete operations
    private val _operationResult = MutableStateFlow<String?>(null)
    val operationResult: StateFlow<String?> = _operationResult.asStateFlow()

    private val _isOperating = MutableStateFlow(false)
    val isOperating: StateFlow<Boolean> = _isOperating.asStateFlow()

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
                    e.message ?: "Đã xảy ra lỗi khi tải dữ liệu"
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

    fun createTenant(
        hoTen: String,
        cccd: String,
        soDienThoai: String?,
        email: String?,
        onSuccess: () -> Unit,
        onError: (String) -> Unit
    ) {
        viewModelScope.launch {
            _isOperating.value = true
            try {
                val body = mapOf(
                    "ho_ten" to hoTen,
                    "cccd" to cccd,
                    "so_dien_thoai" to soDienThoai,
                    "email" to email
                )
                val response = RetrofitInstance.tenantApi.createTenant(body)
                if (response.isSuccessful) {
                    loadTenants()
                    onSuccess()
                } else {
                    val errorBody = response.errorBody()?.string()
                    val errorMsg = parseErrorMessage(errorBody) ?: "Lỗi ${response.code()}"
                    onError(errorMsg)
                }
            } catch (e: Exception) {
                onError(e.message ?: "Đã xảy ra lỗi")
            } finally {
                _isOperating.value = false
            }
        }
    }

    fun updateTenant(
        id: Int,
        hoTen: String,
        cccd: String,
        soDienThoai: String?,
        email: String?,
        onSuccess: () -> Unit,
        onError: (String) -> Unit
    ) {
        viewModelScope.launch {
            _isOperating.value = true
            try {
                val body = mapOf(
                    "ho_ten" to hoTen,
                    "cccd" to cccd,
                    "so_dien_thoai" to soDienThoai,
                    "email" to email
                )
                val response = RetrofitInstance.tenantApi.updateTenant(id, body)
                if (response.isSuccessful) {
                    loadTenants()
                    onSuccess()
                } else {
                    val errorBody = response.errorBody()?.string()
                    val errorMsg = parseErrorMessage(errorBody) ?: "Lỗi ${response.code()}"
                    onError(errorMsg)
                }
            } catch (e: Exception) {
                onError(e.message ?: "Đã xảy ra lỗi")
            } finally {
                _isOperating.value = false
            }
        }
    }

    fun deleteTenant(
        id: Int,
        onSuccess: () -> Unit,
        onError: (String) -> Unit
    ) {
        viewModelScope.launch {
            _isOperating.value = true
            try {
                val response = RetrofitInstance.tenantApi.deleteTenant(id)
                if (response.isSuccessful) {
                    loadTenants()
                    onSuccess()
                } else {
                    val errorBody = response.errorBody()?.string()
                    val errorMsg = parseErrorMessage(errorBody) ?: "Lỗi ${response.code()}"
                    onError(errorMsg)
                }
            } catch (e: Exception) {
                onError(e.message ?: "Đã xảy ra lỗi")
            } finally {
                _isOperating.value = false
            }
        }
    }

    fun clearOperationResult() {
        _operationResult.value = null
    }

    private fun parseErrorMessage(errorBody: String?): String? {
        if (errorBody == null) return null
        return try {
            val json = com.google.gson.JsonParser.parseString(errorBody).asJsonObject
            json.get("error")?.asString
        } catch (e: Exception) {
            null
        }
    }
}
