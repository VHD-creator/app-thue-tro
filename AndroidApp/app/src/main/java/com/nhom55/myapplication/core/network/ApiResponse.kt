package com.nhom55.myapplication.core.network

import com.nhom55.myapplication.feature.room.Room
import com.nhom55.myapplication.feature.room.RoomStatus

// Response từ API
data class ApiResponse<T>(
    val success: Boolean,
    val data: T
)

// Model cho phòng từ API
data class RoomApiModel(
    val id_phong: Int,
    val id_chu_tro: Int,
    val ten_phong: String,
    val gia_phong: Long,
    val trang_thai: String,
    val mo_ta: String?,
    val chu_tro: ChuTroInfo? = null
)

data class ChuTroInfo(
    val ho_ten: String?,
    val so_dien_thoai: String?,
    val dia_chi: String?
)

// Model cho ảnh phòng từ API
data class HinhAnhPhongApiModel(
    val id_hinh_anh: Int,
    val id_phong: Int,
    val ten_file: String,
    val duong_dan: String,
    val loai_hinh: String,
    val la_anh_dai_dien: Boolean,
    val thu_tu: Int,
    val mo_ta: String?,
    val kich_thuoc: Int,
    val ngay_upload: String
)

// Extension function để convert từ API model sang UI model
fun RoomApiModel.toRoom(): Room {
    return Room(
        id = id_phong.toString(),
        name = ten_phong,
        floor = extractFloor(ten_phong),
        price = gia_phong,
        status = when (trang_thai) {
            "0" -> RoomStatus.AVAILABLE
            "1" -> RoomStatus.OCCUPIED
            "2" -> RoomStatus.MAINTENANCE
            else -> RoomStatus.AVAILABLE
        },
        tenantName = null, // TODO: Cần thêm từ API nếu có
        area = 20f, // TODO: Cần thêm từ API nếu có
        description = mo_ta,
        address = chu_tro?.dia_chi ?: "Chưa cập nhật địa chỉ",
        landlordName = chu_tro?.ho_ten ?: "Chủ trọ"
    )
}

// Helper function để extract floor từ tên phòng (VD: "Phòng 101" -> 1)
private fun extractFloor(roomName: String): Int {
    val regex = "(\\d+)".toRegex()
    val match = regex.find(roomName)
    return match?.value?.firstOrNull()?.toString()?.toIntOrNull() ?: 1
}

// Chuyển từ API model sang UI model
fun HinhAnhPhongApiModel.toHinhAnhPhong(baseUrl: String = "http://10.0.2.2:3000"): com.nhom55.myapplication.feature.room.HinhAnhPhong {
    return com.nhom55.myapplication.feature.room.HinhAnhPhong(
        id = id_hinh_anh,
        url = baseUrl + duong_dan,
        type = loai_hinh,
        isAvatar = la_anh_dai_dien,
        order = thu_tu,
        description = mo_ta
    )
}

// Model cho Create/Update/Delete Phòng
data class CreateRoomRequest(
    val id_chu_tro: Int?,
    val ten_phong: String,
    val gia_phong: Long,
    val mo_ta: String
)

data class UpdateRoomRequest(
    val ten_phong: String?,
    val gia_phong: Long?,
    val mo_ta: String?,
    val trang_thai: Int?
)

data class DeleteRoomResponse(
    val message: String,
    val id_phong: Int
)

data class UploadImagesResponse(
    val message: String
)