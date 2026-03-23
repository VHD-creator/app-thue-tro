package com.nhom55.myapplication.feature.tenant

import retrofit2.Response
import retrofit2.http.*

interface TenantApiService {
    @GET("api/nguoiThue")
    suspend fun getTenants(): List<TenantApiModel>

    @GET("api/nguoiThue/{id}")
    suspend fun getTenantById(@Path("id") id: Int): TenantApiModel

    @POST("api/nguoiThue")
    suspend fun createTenant(@Body body: Map<String, String?>): Response<Map<String, Any>>

    @PUT("api/nguoiThue/{id}")
    suspend fun updateTenant(@Path("id") id: Int, @Body body: Map<String, String?>): Response<Map<String, Any>>

    @DELETE("api/nguoiThue/{id}")
    suspend fun deleteTenant(@Path("id") id: Int): Response<Map<String, Any>>
}
