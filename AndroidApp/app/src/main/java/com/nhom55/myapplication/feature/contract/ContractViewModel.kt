package com.nhom55.myapplication.feature.contract

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.nhom55.myapplication.core.network.RetrofitInstance
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import retrofit2.Response
import retrofit2.HttpException
import org.json.JSONObject

sealed class ContractUiState {
    object Loading : ContractUiState()
    data class Success(val contracts: List<Contract>) : ContractUiState()
    data class Error(val message: String) : ContractUiState()
}

sealed class CreateContractUiState {
    object Idle : CreateContractUiState()
    object Loading : CreateContractUiState()
    data class Success(val contract: Contract) : CreateContractUiState()
    data class Error(val message: String) : CreateContractUiState()
}

class ContractViewModel : ViewModel() {
    private val _uiState = MutableStateFlow<ContractUiState>(ContractUiState.Loading)
    val uiState: StateFlow<ContractUiState> = _uiState.asStateFlow()

    private val _createUiState = MutableStateFlow<CreateContractUiState>(CreateContractUiState.Idle)
    val createUiState: StateFlow<CreateContractUiState> = _createUiState.asStateFlow()

    private val _isOperating = MutableStateFlow(false)
    val isOperating: StateFlow<Boolean> = _isOperating.asStateFlow()

    init {
        loadContracts()
    }

    fun loadContracts() {
        viewModelScope.launch {
            _uiState.value = ContractUiState.Loading
            try {
                val response = RetrofitInstance.contractApi.getContracts()
                val contracts = response.map { it.toContract() }
                _uiState.value = ContractUiState.Success(contracts)
            } catch (e: Exception) {
                _uiState.value = ContractUiState.Error(
                    e.message ?: "Đã xảy ra lỗi khi tải dữ liệu"
                )
            }
        }
    }

    fun getContractById(contractId: String?): Contract? {
        val state = _uiState.value
        return if (state is ContractUiState.Success) {
            state.contracts.find { it.id == contractId }
        } else {
            null
        }
    }

    fun createContract(roomId: Int, tenantId: Int, startDate: String, endDate: String, deposit: Long) {
        viewModelScope.launch {
            _createUiState.value = CreateContractUiState.Loading
            try {
                val request = ContractRequest(roomId, tenantId, startDate, endDate, deposit)
                val response = RetrofitInstance.contractApi.createContract(request)
                if (response.hopDong != null) {
                    _createUiState.value = CreateContractUiState.Success(response.hopDong.toContract())
                    loadContracts()
                } else {
                    _createUiState.value = CreateContractUiState.Success(
                        Contract(
                            id = "0", roomId = roomId.toString(), roomName = "Phòng $roomId",
                            tenantId = tenantId.toString(), tenantName = "Khách #$tenantId",
                            startDate = startDate, endDate = endDate, deposit = deposit, status = ContractStatus.ACTIVE
                        )
                    )
                }
            } catch (e: retrofit2.HttpException) {
                val errorBody = e.response()?.errorBody()?.string()
                val errorMsg = parseErrorMessage(errorBody) ?: "Lỗi kết nối máy chủ"
                _createUiState.value = CreateContractUiState.Error(errorMsg)
            } catch (e: Exception) {
                _createUiState.value = CreateContractUiState.Error(
                    e.message ?: "Đã xảy ra lỗi khi tạo hợp đồng"
                )
            }
        }
    }

    fun updateContract(
        id: Int,
        ngayBatDau: String?,
        ngayKetThuc: String?,
        tienCoc: Long?,
        trangThai: Int?,
        onSuccess: () -> Unit,
        onError: (String) -> Unit
    ) {
        viewModelScope.launch {
            _isOperating.value = true
            try {
                val body = mutableMapOf<String, Any?>()
                if (ngayBatDau != null) body["ngay_bat_dau"] = ngayBatDau
                if (ngayKetThuc != null) body["ngay_ket_thuc"] = ngayKetThuc
                if (tienCoc != null) body["tien_coc"] = tienCoc
                if (trangThai != null) body["trang_thai"] = trangThai

                val response = RetrofitInstance.contractApi.updateContract(id, body)
                if (response.isSuccessful) {
                    loadContracts()
                    onSuccess()
                } else {
                    val errorBody = response.errorBody()?.string()
                    val errorMsg = parseErrorMessage(errorBody) ?: "Lỗi khi cập nhật hợp đồng"
                    onError(errorMsg)
                }
            } catch (e: retrofit2.HttpException) {
                val errorBody = e.response()?.errorBody()?.string()
                val errorMsg = parseErrorMessage(errorBody) ?: "Lỗi kết nối"
                onError(errorMsg)
            } catch (e: Exception) {
                onError(e.message ?: "Đã xảy ra lỗi")
            } finally {
                _isOperating.value = false
            }
        }
    }

    fun deleteContract(
        id: Int,
        onSuccess: () -> Unit,
        onError: (String) -> Unit
    ) {
        viewModelScope.launch {
            _isOperating.value = true
            try {
                val response = RetrofitInstance.contractApi.deleteContract(id)
                if (response.isSuccessful) {
                    loadContracts()
                    onSuccess()
                } else {
                    val errorBody = response.errorBody()?.string()
                    val errorMsg = parseErrorMessage(errorBody) ?: "Lỗi khi xóa hợp đồng"
                    onError(errorMsg)
                }
            } catch (e: retrofit2.HttpException) {
                val errorBody = e.response()?.errorBody()?.string()
                val errorMsg = parseErrorMessage(errorBody) ?: "Lỗi kết nối"
                onError(errorMsg)
            } catch (e: Exception) {
                onError(e.message ?: "Đã xảy ra lỗi")
            } finally {
                _isOperating.value = false
            }
        }
    }

    fun resetCreateState() {
        _createUiState.value = CreateContractUiState.Idle
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
