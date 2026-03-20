package com.nhom55.myapplication

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed class RoomUiState {
    object Loading : RoomUiState()
    data class Success(val rooms: List<Room>) : RoomUiState()
    data class Error(val message: String) : RoomUiState()
}

class RoomViewModel : ViewModel() {
    private val _uiState = MutableStateFlow<RoomUiState>(RoomUiState.Loading)
    val uiState: StateFlow<RoomUiState> = _uiState.asStateFlow()

    private val _selectedFilter = MutableStateFlow<RoomStatus?>(null)
    val selectedFilter: StateFlow<RoomStatus?> = _selectedFilter.asStateFlow()

    init {
        loadRooms()
    }

    fun loadRooms() {
        viewModelScope.launch {
            _uiState.value = RoomUiState.Loading
            try {
                val response = RetrofitInstance.api.getRooms()
                val rooms = response.map { it.toRoom() }
                _uiState.value = RoomUiState.Success(rooms)
            } catch (e: Exception) {
                _uiState.value = RoomUiState.Error(
                    e.message ?: "Đã xảy ra lỗi khi tải dữ liệu"
                )
            }
        }
    }

    fun setFilter(status: RoomStatus?) {
        _selectedFilter.value = status
    }

    fun getFilteredRooms(rooms: List<Room>): List<Room> {
        return _selectedFilter.value?.let { filter ->
            rooms.filter { it.status == filter }
        } ?: rooms
    }

    fun getRoomById(roomId: String?): Room? {
        val state = _uiState.value
        return if (state is RoomUiState.Success) {
            state.rooms.find { it.id == roomId }
        } else {
            null
        }
    }
}