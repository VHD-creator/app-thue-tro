package com.nhom55.myapplication.feature.payment

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.nhom55.myapplication.core.network.RetrofitInstance
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed class VietQRState<out T> {
    object Idle : VietQRState<Nothing>()
    object Loading : VietQRState<Nothing>()
    data class Success<T>(val data: T) : VietQRState<T>()
    data class Error(val message: String) : VietQRState<Nothing>()
}

class VietQRViewModel : ViewModel() {
    private val _banks = MutableStateFlow<VietQRState<List<BankApiModel>>>(VietQRState.Idle)
    val banks = _banks.asStateFlow()

    private val _invoiceQR = MutableStateFlow<VietQRState<VietQRResponse>>(VietQRState.Idle)
    val invoiceQR = _invoiceQR.asStateFlow()

    private val _landlordBankInfo = MutableStateFlow<VietQRState<LandlordBankInfoResponse>>(VietQRState.Idle)
    val landlordBankInfo = _landlordBankInfo.asStateFlow()

    private val _updateState = MutableStateFlow<VietQRState<UpdateBankInfoResponse>>(VietQRState.Idle)
    val updateState = _updateState.asStateFlow()

    private val _confirmState = MutableStateFlow<VietQRState<String>>(VietQRState.Idle)
    val confirmState = _confirmState.asStateFlow()

    fun getBanks() {
        viewModelScope.launch {
            _banks.value = VietQRState.Loading
            try {
                val response = RetrofitInstance.vietQRApi.getBanks()
                _banks.value = VietQRState.Success(response)
            } catch (e: Exception) {
                _banks.value = VietQRState.Error(e.message ?: "Lỗi lấy danh sách ngân hàng")
            }
        }
    }

    fun getInvoiceQR(invoiceId: Int) {
        viewModelScope.launch {
            _invoiceQR.value = VietQRState.Loading
            try {
                val response = RetrofitInstance.vietQRApi.getInvoiceQR(invoiceId)
                _invoiceQR.value = VietQRState.Success(response)
            } catch (e: Exception) {
                _invoiceQR.value = VietQRState.Error(e.message ?: "Lỗi lấy mã QR thanh toán")
            }
        }
    }

    fun getLandlordBankInfo() {
        viewModelScope.launch {
            _landlordBankInfo.value = VietQRState.Loading
            try {
                val response = RetrofitInstance.vietQRApi.getLandlordBankInfo()
                _landlordBankInfo.value = VietQRState.Success(response)
            } catch (e: Exception) {
                _landlordBankInfo.value = VietQRState.Error(e.message ?: "Lỗi lấy thông tin ngân hàng")
            }
        }
    }

    fun updateLandlordBankInfo(so_tai_khoan: String, ten_ngan_hang: String, ma_ngan_hang: String) {
        viewModelScope.launch {
            _updateState.value = VietQRState.Loading
            try {
                val request = UpdateBankInfoRequest(so_tai_khoan, ten_ngan_hang, ma_ngan_hang)
                val response = RetrofitInstance.vietQRApi.updateLandlordBankInfo(request)
                _updateState.value = VietQRState.Success(response)
                // Refresh info
                getLandlordBankInfo()
            } catch (e: Exception) {
                _updateState.value = VietQRState.Error(e.message ?: "Lỗi cập nhật thông tin ngân hàng")
            }
        }
    }

    fun confirmPayment(invoiceId: Int, amount: Double? = null, note: String? = null) {
        viewModelScope.launch {
            _confirmState.value = VietQRState.Loading
            try {
                val request = VietQRConfirmRequest(amount, note)
                val response = RetrofitInstance.vietQRApi.confirmVietQRPayment(invoiceId, request)
                _confirmState.value = VietQRState.Success(response.message)
            } catch (e: Exception) {
                _confirmState.value = VietQRState.Error(e.message ?: "Lỗi xác nhận thanh toán")
            }
        }
    }

    fun resetUpdateState() {
        _updateState.value = VietQRState.Idle
    }

    fun resetConfirmState() {
        _confirmState.value = VietQRState.Idle
    }
}
