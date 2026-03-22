package com.nhom55.myapplication.feature.contract

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.nhom55.myapplication.core.network.RetrofitInstance
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

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
                    e.message ?: "Đã xảy ra lỗi khi tải dữ liệu kết nối"
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
                    loadContracts() // Refresh contract list
                } else {
                    _createUiState.value = CreateContractUiState.Success(
                        Contract(
                            id = "0", roomId = roomId.toString(), roomName = "Phòng $roomId",
                            tenantId = tenantId.toString(), tenantName = "Khách #$tenantId",
                            startDate = startDate, endDate = endDate, deposit = deposit, status = ContractStatus.ACTIVE
                        )
                    )
                }
            } catch (e: Exception) {
                _createUiState.value = CreateContractUiState.Error(
                    e.message ?: "Đã xảy ra lỗi khi tạo hợp đồng"
                )
            }
        }
    }

    fun resetCreateState() {
        _createUiState.value = CreateContractUiState.Idle
    }
}
