package com.nhom55.myapplication

import retrofit2.http.GET
import retrofit2.http.Path

interface InvoiceApiService {
    @GET("api/hoaDon")
    suspend fun getInvoices(): List<InvoiceApiModel>

    @GET("api/hoaDon/{id}")
    suspend fun getInvoiceById(@Path("id") id: Int): InvoiceApiModel
}
