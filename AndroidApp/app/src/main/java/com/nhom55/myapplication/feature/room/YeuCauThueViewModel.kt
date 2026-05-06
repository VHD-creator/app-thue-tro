package com.nhom55.myapplication.feature.room

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.nhom55.myapplication.core.network.RetrofitInstance
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed class YeuCauThueState<out T> {
    object Idle : YeuCauThueState<Nothing>()
    object Loading : YeuCauThueState<Nothing>()
    data class Success<T>(val data: T) : YeuCauThueState<T>()
    data class Error(val message: String) : YeuCauThueState<Nothing>()
}

class YeuCauThueViewModel : ViewModel() {
    private val _requests = MutableStateFlow<YeuCauThueState<List<YeuCauThueData>>>(YeuCauThueState.Idle)
    val requests = _requests.asStateFlow()

    private val _actionState = MutableStateFlow<YeuCauThueState<String>>(YeuCauThueState.Idle)
    val actionState = _actionState.asStateFlow()

    fun createYeuCauThue(request: CreateYeuCauThueRequest) {
        viewModelScope.launch {
            _actionState.value = YeuCauThueState.Loading
            try {
                val response = RetrofitInstance.yeuCauThueApi.createYeuCauThue(request)
                _actionState.value = YeuCauThueState.Success(response.message)
            } catch (e: Exception) {
                _actionState.value = YeuCauThueState.Error(e.message ?: "Lỗi gửi yêu cầu thuê")
            }
        }
    }

    fun getMyRequests() {
        viewModelScope.launch {
            _requests.value = YeuCauThueState.Loading
            try {
                val response = RetrofitInstance.yeuCauThueApi.getMyRequests()
                _requests.value = YeuCauThueState.Success(response)
            } catch (e: Exception) {
                _requests.value = YeuCauThueState.Error(e.message ?: "Lỗi tải danh sách yêu cầu")
            }
        }
    }

    fun getAllRequests(status: Int? = null) {
        viewModelScope.launch {
            _requests.value = YeuCauThueState.Loading
            try {
                val response = RetrofitInstance.yeuCauThueApi.getAllRequests(status)
                _requests.value = YeuCauThueState.Success(response)
            } catch (e: Exception) {
                _requests.value = YeuCauThueState.Error(e.message ?: "Lỗi tải danh sách yêu cầu")
            }
        }
    }

    fun cancelRequest(id: Int) {
        viewModelScope.launch {
            _actionState.value = YeuCauThueState.Loading
            try {
                val response = RetrofitInstance.yeuCauThueApi.cancelRequest(id)
                _actionState.value = YeuCauThueState.Success(response.message)
                getMyRequests() // Refresh list
            } catch (e: Exception) {
                _actionState.value = YeuCauThueState.Error(e.message ?: "Lỗi hủy yêu cầu")
            }
        }
    }

    fun approveRequest(id: Int, ngayKetThuc: String, tienCoc: Long) {
        viewModelScope.launch {
            _actionState.value = YeuCauThueState.Loading
            try {
                val response = RetrofitInstance.yeuCauThueApi.approveRequest(id, ApproveRequest(ngayKetThuc, tienCoc))
                _actionState.value = YeuCauThueState.Success(response.message)
                getAllRequests() // Refresh list
            } catch (e: Exception) {
                _actionState.value = YeuCauThueState.Error(e.message ?: "Lỗi duyệt yêu cầu")
            }
        }
    }

    fun rejectRequest(id: Int, lyDo: String) {
        viewModelScope.launch {
            _actionState.value = YeuCauThueState.Loading
            try {
                val response = RetrofitInstance.yeuCauThueApi.rejectRequest(id, RejectRequest(lyDo))
                _actionState.value = YeuCauThueState.Success(response.message)
                getAllRequests() // Refresh list
            } catch (e: Exception) {
                _actionState.value = YeuCauThueState.Error(e.message ?: "Lỗi từ chối yêu cầu")
            }
        }
    }

    fun resetActionState() {
        _actionState.value = YeuCauThueState.Idle
    }
}
