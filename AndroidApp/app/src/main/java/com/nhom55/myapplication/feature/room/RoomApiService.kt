package com.nhom55.myapplication.feature.room

import com.nhom55.myapplication.core.network.HinhAnhPhongApiModel
import com.nhom55.myapplication.core.network.RoomApiModel
import retrofit2.http.GET
import retrofit2.http.Path

import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.DELETE
import retrofit2.http.Body
import retrofit2.http.Multipart
import retrofit2.http.Part
import okhttp3.MultipartBody
import com.nhom55.myapplication.core.network.CreateRoomRequest
import com.nhom55.myapplication.core.network.UpdateRoomRequest
import com.nhom55.myapplication.core.network.DeleteRoomResponse
import com.nhom55.myapplication.core.network.UploadImagesResponse
import com.nhom55.myapplication.core.network.DeleteImageResponse
import com.nhom55.myapplication.core.network.FeaturedImageResponse

interface RoomApiService {
    @GET("api/phong")
    suspend fun getRooms(): List<RoomApiModel>

    @GET("api/phong/{id_phong}")
    suspend fun getRoomById(@Path("id_phong") roomId: Int): RoomApiModel

    @GET("api/phong/cua-toi")
    suspend fun getMyRentedRoom(): RoomApiModel

    @GET("api/hinhAnh/phong/{id_phong}")
    suspend fun getRoomImages(@Path("id_phong") roomId: Int): List<HinhAnhPhongApiModel>

    @POST("api/phong")
    suspend fun createRoom(@Body request: CreateRoomRequest): RoomApiModel

    @PUT("api/phong/{id_phong}")
    suspend fun updateRoom(@Path("id_phong") roomId: Int, @Body request: UpdateRoomRequest): RoomApiModel

    @DELETE("api/phong/{id_phong}")
    suspend fun deleteRoom(@Path("id_phong") roomId: Int): DeleteRoomResponse

    @Multipart
    @POST("api/hinhAnh/phong/{id_phong}/multiple")
    suspend fun uploadRoomImages(
        @Path("id_phong") roomId: Int,
        @Part images: List<MultipartBody.Part>
    ): UploadImagesResponse

    @DELETE("api/hinhAnh/{id_hinh_anh}")
    suspend fun deleteRoomImage(@Path("id_hinh_anh") imageId: Int): DeleteImageResponse

    @PUT("api/hinhAnh/{id_hinh_anh}/set-dai-dien")
    suspend fun setFeaturedImage(@Path("id_hinh_anh") imageId: Int): FeaturedImageResponse
}