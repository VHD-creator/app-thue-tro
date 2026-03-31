package com.nhom55.myapplication.feature.invoice

import retrofit2.Response
import retrofit2.http.*

interface InvoiceApiService {
    @GET("api/hoaDon")
    suspend fun getInvoices(): List<InvoiceApiModel>

    @GET("api/hoaDon/{id}")
    suspend fun getInvoiceById(@Path("id") id: Int): InvoiceApiModel

    @POST("api/hoaDon")
    suspend fun createInvoice(@Body body: Map<String, @JvmSuppressWildcards Any>): Any

    @PUT("api/hoaDon/{id}")
    suspend fun updateInvoice(@Path("id") id: Int, @Body body: Map<String, @JvmSuppressWildcards Any>): Response<Map<String, Any>>

    @DELETE("api/hoaDon/{id}")
    suspend fun deleteInvoice(@Path("id") id: Int): Response<Map<String, Any>>
}
