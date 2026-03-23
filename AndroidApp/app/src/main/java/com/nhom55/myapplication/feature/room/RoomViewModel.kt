package com.nhom55.myapplication.feature.room

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.nhom55.myapplication.core.network.RetrofitInstance
import com.nhom55.myapplication.core.network.toRoom
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import com.nhom55.myapplication.core.network.toHinhAnhPhong

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

    private val _roomImages = MutableStateFlow<Map<String, List<com.nhom55.myapplication.feature.room.HinhAnhPhong>>>(emptyMap())
    val roomImages: StateFlow<Map<String, List<com.nhom55.myapplication.feature.room.HinhAnhPhong>>> = _roomImages.asStateFlow()

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

    fun loadRoomImages(roomId: String) {
        // Only load if not in map
        if (_roomImages.value.containsKey(roomId)) return
        viewModelScope.launch {
            try {
                val imagesApiModel = RetrofitInstance.api.getRoomImages(roomId.toInt())
                val images = imagesApiModel.map { it.toHinhAnhPhong() }
                _roomImages.value = _roomImages.value.toMutableMap().apply { put(roomId, images) }
            } catch (e: Exception) {
                // Log or handle error if needed
                _roomImages.value = _roomImages.value.toMutableMap().apply { put(roomId, emptyList()) }
            }
        }
    }
}