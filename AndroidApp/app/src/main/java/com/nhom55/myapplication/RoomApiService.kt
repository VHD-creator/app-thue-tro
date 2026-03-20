package com.nhom55.myapplication

import retrofit2.http.GET

interface RoomApiService {
    @GET("api/phong")
    suspend fun getRooms(): List<RoomApiModel>
}