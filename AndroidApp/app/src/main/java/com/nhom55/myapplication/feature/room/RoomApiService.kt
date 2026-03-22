package com.nhom55.myapplication.feature.room

import com.nhom55.myapplication.core.network.RoomApiModel
import retrofit2.http.GET

interface RoomApiService {
    @GET("api/phong")
    suspend fun getRooms(): List<RoomApiModel>
}