package com.nhom55.myapplication.feature.invoice

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.nhom55.myapplication.core.network.RetrofitInstance
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import retrofit2.Response
import retrofit2.HttpException

sealed class InvoiceUiState {
    object Loading : InvoiceUiState()
    data class Success(val invoices: List<Invoice>) : InvoiceUiState()
    data class Error(val message: String) : InvoiceUiState()
}

sealed class CreateInvoiceUiState {
    object Idle : CreateInvoiceUiState()
    object Loading : CreateInvoiceUiState()
    object Success : CreateInvoiceUiState()
    data class Error(val message: String) : CreateInvoiceUiState()
}

class InvoiceViewModel : ViewModel() {
    private val _uiState = MutableStateFlow<InvoiceUiState>(InvoiceUiState.Loading)
    val uiState: StateFlow<InvoiceUiState> = _uiState.asStateFlow()

    private val _createUiState = MutableStateFlow<CreateInvoiceUiState>(CreateInvoiceUiState.Idle)
    val createUiState: StateFlow<CreateInvoiceUiState> = _createUiState.asStateFlow()

    private val _isOperating = MutableStateFlow(false)
    val isOperating: StateFlow<Boolean> = _isOperating.asStateFlow()

    init {
        loadInvoices()
    }

    fun loadInvoices() {
        viewModelScope.launch {
            _uiState.value = InvoiceUiState.Loading
            try {
                val response = RetrofitInstance.invoiceApi.getInvoices()
                val invoices = response.map { it.toInvoice() }
                _uiState.value = InvoiceUiState.Success(invoices)
            } catch (e: Exception) {
                _uiState.value = InvoiceUiState.Error(
                    e.message ?: "Đã xảy ra lỗi khi tải danh sách hóa đơn"
                )
            }
        }
    }

    fun deleteInvoice(
        id: Int,
        onSuccess: () -> Unit,
        onError: (String) -> Unit
    ) {
        viewModelScope.launch {
            _isOperating.value = true
            try {
                val response = RetrofitInstance.invoiceApi.deleteInvoice(id)
                if (response.isSuccessful) {
                    loadInvoices()
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

    fun confirmPayment(
        id: Int,
        onSuccess: () -> Unit,
        onError: (String) -> Unit
    ) {
        viewModelScope.launch {
            _isOperating.value = true
            try {
                // Update trang_thai to 1 (PAID)
                val response = RetrofitInstance.invoiceApi.updateInvoice(id, mapOf("trang_thai" to 1))
                if (response.isSuccessful) {
                    loadInvoices()
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

    fun createInvoice(body: Map<String, Any>) {
        viewModelScope.launch {
            _createUiState.value = CreateInvoiceUiState.Loading
            try {
                RetrofitInstance.invoiceApi.createInvoice(body)
                _createUiState.value = CreateInvoiceUiState.Success
                loadInvoices()
            } catch (e: retrofit2.HttpException) {
                val errorBody = e.response()?.errorBody()?.string()
                val errorMsg = parseErrorMessage(errorBody) ?: "Lỗi ${e.code()}"
                _createUiState.value = CreateInvoiceUiState.Error(errorMsg)
            } catch (e: Exception) {
                _createUiState.value = CreateInvoiceUiState.Error(e.message ?: "Lỗi khi tạo hóa đơn")
            }
        }
    }

    fun updateInvoice(id: Int, body: Map<String, Any>, onSuccess: () -> Unit, onError: (String) -> Unit) {
        viewModelScope.launch {
            _isOperating.value = true
            try {
                val response = RetrofitInstance.invoiceApi.updateInvoice(id, body)
                if (response.isSuccessful) {
                    loadInvoices()
                    onSuccess()
                } else {
                    val errorBody = response.errorBody()?.string()
                    val errorMsg = parseErrorMessage(errorBody) ?: "Lỗi khi cập nhật hóa đơn"
                    onError(errorMsg)
                }
            } catch (e: retrofit2.HttpException) {
                val errorBody = e.response()?.errorBody()?.string()
                val errorMsg = parseErrorMessage(errorBody) ?: "Lỗi kết nối"
                onError(errorMsg)
            } catch (e: Exception) {
                onError(e.message ?: "Lỗi khi cập nhật hóa đơn")
            } finally {
                _isOperating.value = false
            }
        }
    }

    fun resetCreateState() {
        _createUiState.value = CreateInvoiceUiState.Idle
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
