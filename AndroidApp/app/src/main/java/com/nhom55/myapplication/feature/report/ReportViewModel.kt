package com.nhom55.myapplication.feature.report

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.nhom55.myapplication.core.network.RetrofitInstance
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed class ReportUiState {
    object Loading : ReportUiState()
    data class Success(val stats: List<StatModel>) : ReportUiState()
    data class Error(val message: String) : ReportUiState()
}

class ReportViewModel : ViewModel() {
    private val _uiState = MutableStateFlow<ReportUiState>(ReportUiState.Loading)
    val uiState: StateFlow<ReportUiState> = _uiState.asStateFlow()

    init {
        getStats()
    }

    fun getStats() {
        viewModelScope.launch {
            _uiState.value = ReportUiState.Loading
            try {
                val stats = RetrofitInstance.revenueApi.getRevenueStats()
                _uiState.value = ReportUiState.Success(stats)
            } catch (e: Exception) {
                _uiState.value = ReportUiState.Error(e.message ?: "Lỗi tải báo cáo")
            }
        }
    }
}
