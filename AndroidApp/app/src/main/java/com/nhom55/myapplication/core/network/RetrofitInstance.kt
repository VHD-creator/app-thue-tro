package com.nhom55.myapplication.core.network

import com.nhom55.myapplication.feature.auth.AuthApiService
import com.nhom55.myapplication.feature.contract.ContractApiService
import com.nhom55.myapplication.feature.invoice.InvoiceApiService
import com.nhom55.myapplication.feature.payment.PaymentApiService
import com.nhom55.myapplication.feature.dashboard.ReportApiService
import com.nhom55.myapplication.feature.room.RoomApiService
import com.nhom55.myapplication.core.session.SessionManager
import com.nhom55.myapplication.feature.tenant.TenantApiService
import com.nhom55.myapplication.feature.admin.UserApiService
import okhttp3.OkHttpClient
import okhttp3.Interceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory


object RetrofitInstance {
    private const val BASE_URL = "http://10.0.2.2:3000/" // Cho Android Emulator

    private val client = OkHttpClient.Builder().addInterceptor(Interceptor { chain ->
        val original = chain.request()
        val token = SessionManager.token
        val requestBuilder = original.newBuilder()
        if (token != null) {
            requestBuilder.header("Authorization", "Bearer $token")
        }
        val request = requestBuilder.build()
        chain.proceed(request)
    }).build()

    val api: RoomApiService by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(client)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(RoomApiService::class.java)
    }

    val tenantApi: TenantApiService by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(client)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(TenantApiService::class.java)
    }

    val contractApi: ContractApiService by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(client)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(ContractApiService::class.java)
    }

    val authApi: AuthApiService by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(client)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(AuthApiService::class.java)
    }

    val invoiceApi: InvoiceApiService by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(client)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(InvoiceApiService::class.java)
    }

    val paymentApi: PaymentApiService by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(client)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(PaymentApiService::class.java)
    }

    val reportApi: ReportApiService by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(client)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(ReportApiService::class.java)
    }

    val userApi: UserApiService by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(client)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(UserApiService::class.java)
    }
}
