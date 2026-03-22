package com.nhom55.myapplication.feature.invoice

import retrofit2.http.GET
import retrofit2.http.Path
import retrofit2.http.POST
import retrofit2.http.Body

interface InvoiceApiService {
    @GET("api/hoaDon")
    suspend fun getInvoices(): List<InvoiceApiModel>

    @GET("api/hoaDon/{id}")
    suspend fun getInvoiceById(@Path("id") id: Int): InvoiceApiModel

    @POST("api/hoaDon")
    suspend fun createInvoice(@Body body: Map<String, @JvmSuppressWildcards Any>): Any
}

