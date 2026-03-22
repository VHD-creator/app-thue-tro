package com.nhom55.myapplication.feature.payment

import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path

interface PaymentApiService {
    @GET("api/thanhToan")
    suspend fun getPayments(): List<PaymentApiModel>

    @GET("api/thanhToan/hoa_don/{id_hoa_don}")
    suspend fun getPaymentsByInvoiceId(@Path("id_hoa_don") invoiceId: Int): List<PaymentApiModel>

    @POST("api/thanhToan")
    suspend fun createPayment(@Body request: PaymentRequest): PaymentResponse
}
