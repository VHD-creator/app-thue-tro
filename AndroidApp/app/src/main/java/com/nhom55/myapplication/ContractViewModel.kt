package com.nhom55.myapplication

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed class ContractUiState {
    object Loading : ContractUiState()
    data class Success(val contracts: List<Contract>) : ContractUiState()
    data class Error(val message: String) : ContractUiState()
}

class ContractViewModel : ViewModel() {
    private val _uiState = MutableStateFlow<ContractUiState>(ContractUiState.Loading)
    val uiState: StateFlow<ContractUiState> = _uiState.asStateFlow()

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
}
