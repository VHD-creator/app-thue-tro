package com.nhom55.myapplication.feature.invoice

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.nhom55.myapplication.core.network.RetrofitInstance
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed class InvoiceUiState {
    object Loading : InvoiceUiState()
    data class Success(val invoices: List<Invoice>) : InvoiceUiState()
    data class Error(val message: String) : InvoiceUiState()
}

class InvoiceViewModel : ViewModel() {
    private val _uiState = MutableStateFlow<InvoiceUiState>(InvoiceUiState.Loading)
    val uiState: StateFlow<InvoiceUiState> = _uiState.asStateFlow()

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
