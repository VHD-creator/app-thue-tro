package com.nhom55.myapplication.feature.contract

import retrofit2.Response
import retrofit2.http.*

interface ContractApiService {
    @GET("api/hopDong")
    suspend fun getContracts(): List<ContractApiModel>

    @GET("api/hopDong/{id}")
    suspend fun getContractById(@Path("id") id: Int): ContractApiModel

    @POST("api/hopDong")
    suspend fun createContract(@Body request: ContractRequest): ContractResponse

    @PUT("api/hopDong/{id}")
    suspend fun updateContract(@Path("id") id: Int, @Body body: Map<String, Any?>): Response<Map<String, Any>>

    @DELETE("api/hopDong/{id}")
    suspend fun deleteContract(@Path("id") id: Int): Response<Map<String, Any>>
}
