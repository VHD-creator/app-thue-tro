package com.nhom55.myapplication.feature.contract

import retrofit2.http.GET
import retrofit2.http.Path
import retrofit2.http.POST
import retrofit2.http.Body

interface ContractApiService {
    @GET("api/hopDong")
    suspend fun getContracts(): List<ContractApiModel>

    @GET("api/hopDong/{id}")
    suspend fun getContractById(@Path("id") id: Int): ContractApiModel

    @POST("api/hopDong")
    suspend fun createContract(@Body request: ContractRequest): ContractResponse
}
