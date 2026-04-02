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
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import java.io.File

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
            } catch (e: retrofit2.HttpException) {
                val errorBody = e.response()?.errorBody()?.string()
                val message = parseErrorMessage(errorBody) ?: "Lỗi tải danh sách phòng (${e.code()})"
                _uiState.value = RoomUiState.Error(message)
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

    fun loadRoomImages(roomId: String, forceReload: Boolean = false) {
        if (!forceReload && _roomImages.value.containsKey(roomId)) return
        viewModelScope.launch {
            try {
                val imagesApiModel = RetrofitInstance.api.getRoomImages(roomId.toInt())
                val images = imagesApiModel.map { it.toHinhAnhPhong() }
                _roomImages.value = _roomImages.value.toMutableMap().apply { put(roomId, images) }
            } catch (e: Exception) {
                _roomImages.value = _roomImages.value.toMutableMap().apply { put(roomId, emptyList()) }
            }
        }
    }

    fun uploadImages(roomId: Int, imageFiles: List<File>, onResult: (Boolean, String) -> Unit) {
        viewModelScope.launch {
            try {
                val parts = imageFiles.map { file ->
                    val extension = file.extension.lowercase()
                    val mimeType = when (extension) {
                        "png" -> "image/png"
                        "webp" -> "image/webp"
                        "gif" -> "image/gif"
                        else -> "image/jpeg"
                    }
                    val requestFile = file.asRequestBody(mimeType.toMediaTypeOrNull())
                    MultipartBody.Part.createFormData("images", file.name, requestFile)
                }
                RetrofitInstance.api.uploadRoomImages(roomId, parts)
                loadRoomImages(roomId.toString(), forceReload = true)
                onResult(true, "Upload ảnh thành công")
            } catch (e: retrofit2.HttpException) {
                val errorBody = e.response()?.errorBody()?.string()
                val message = parseErrorMessage(errorBody) ?: "Lỗi upload ảnh (${e.code()})"
                onResult(false, message)
            } catch (e: Exception) {
                onResult(false, e.message ?: "Lỗi kết nối mạng")
            }
        }
    }

    fun deleteImage(roomId: Int, imageId: Int, onResult: (Boolean, String) -> Unit) {
        viewModelScope.launch {
            try {
                RetrofitInstance.api.deleteRoomImage(imageId)
                loadRoomImages(roomId.toString(), forceReload = true)
                onResult(true, "Xóa ảnh thành công")
            } catch (e: retrofit2.HttpException) {
                val errorBody = e.response()?.errorBody()?.string()
                val message = parseErrorMessage(errorBody) ?: "Lỗi xóa ảnh (${e.code()})"
                onResult(false, message)
            } catch (e: Exception) {
                onResult(false, e.message ?: "Lỗi khi xóa ảnh")
            }
        }
    }

    fun setMainImage(roomId: Int, imageId: Int, onResult: (Boolean, String) -> Unit) {
        viewModelScope.launch {
            try {
                RetrofitInstance.api.setFeaturedImage(imageId)
                loadRoomImages(roomId.toString(), forceReload = true)
                onResult(true, "Đặt ảnh đại diện thành công")
            } catch (e: retrofit2.HttpException) {
                val errorBody = e.response()?.errorBody()?.string()
                val message = parseErrorMessage(errorBody) ?: "Lỗi đặt ảnh đại diện (${e.code()})"
                onResult(false, message)
            } catch (e: Exception) {
                onResult(false, e.message ?: "Lỗi khi đặt ảnh đại diện")
            }
        }
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