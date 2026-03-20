package com.nhom55.myapplication

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
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
}
