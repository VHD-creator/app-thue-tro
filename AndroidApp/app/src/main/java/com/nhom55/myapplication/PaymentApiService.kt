package com.nhom55.myapplication

import retrofit2.http.GET
import retrofit2.http.Path

interface PaymentApiService {
    @GET("api/thanhToan")
    suspend fun getPayments(): List<PaymentApiModel>

    @GET("api/thanhToan/hoa_don/{id_hoa_don}")
    suspend fun getPaymentsByInvoiceId(@Path("id_hoa_don") invoiceId: Int): List<PaymentApiModel>

    @retrofit2.http.POST("api/thanhToan")
    suspend fun createPayment(@retrofit2.http.Body request: PaymentRequest): PaymentResponse
}
