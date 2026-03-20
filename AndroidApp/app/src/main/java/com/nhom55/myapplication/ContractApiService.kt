package com.nhom55.myapplication

import retrofit2.http.GET
import retrofit2.http.Path

interface ContractApiService {
    @GET("api/hopDong")
    suspend fun getContracts(): List<ContractApiModel>

    @GET("api/hopDong/{id}")
    suspend fun getContractById(@Path("id") id: Int): ContractApiModel
}
