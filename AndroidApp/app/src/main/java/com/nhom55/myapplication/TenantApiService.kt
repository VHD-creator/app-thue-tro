package com.nhom55.myapplication

import retrofit2.http.GET
import retrofit2.http.Path

interface TenantApiService {
    @GET("api/nguoiThue")
    suspend fun getTenants(): List<TenantApiModel>

    @GET("api/nguoiThue/{id}")
    suspend fun getTenantById(@Path("id") id: Int): TenantApiModel
}
