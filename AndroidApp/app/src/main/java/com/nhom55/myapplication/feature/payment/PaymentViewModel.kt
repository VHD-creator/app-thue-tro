package com.nhom55.myapplication.feature.payment

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.nhom55.myapplication.core.network.RetrofitInstance
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed class PaymentSubmitState {
    object Idle : PaymentSubmitState()
    object Loading : PaymentSubmitState()
    data class Success(val message: String) : PaymentSubmitState()
    data class Error(val message: String) : PaymentSubmitState()
}

class PaymentViewModel : ViewModel() {
    private val _submitState = MutableStateFlow<PaymentSubmitState>(PaymentSubmitState.Idle)
    val submitState: StateFlow<PaymentSubmitState> = _submitState.asStateFlow()

    fun submitPayment(invoiceId: Int, amount: Double, method: String) {
        viewModelScope.launch {
            _submitState.value = PaymentSubmitState.Loading
            try {
                val request = PaymentRequest(
                    id_hoa_don = invoiceId,
                    so_tien = amount,
                    hinh_thuc = method
                )
                val response = RetrofitInstance.paymentApi.createPayment(request)
                _submitState.value = PaymentSubmitState.Success(response.message)
            } catch (e: Exception) {
                _submitState.value = PaymentSubmitState.Error(
                    e.message ?: "Đã xảy ra lỗi khi thanh toán"
                )
            }
        }
    }

    fun resetState() {
        _submitState.value = PaymentSubmitState.Idle
    }
}
