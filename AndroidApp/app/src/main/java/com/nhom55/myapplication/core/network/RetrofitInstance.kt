package com.nhom55.myapplication.core.network

import com.nhom55.myapplication.feature.auth.AuthApiService
import com.nhom55.myapplication.feature.contract.ContractApiService
import com.nhom55.myapplication.feature.invoice.InvoiceApiService
import com.nhom55.myapplication.feature.payment.PaymentApiService
import com.nhom55.myapplication.feature.room.RoomApiService
import com.nhom55.myapplication.feature.tenant.TenantApiService
import com.nhom55.myapplication.feature.room.YeuCauThueApiService
import com.nhom55.myapplication.feature.admin.UserApiService
import com.nhom55.myapplication.feature.dashboard.ReportApiService
import com.nhom55.myapplication.core.session.SessionManager
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

object RetrofitInstance {
    private const val BASE_URL = "http://10.0.2.2:3000/"

    private val logging = HttpLoggingInterceptor().apply {
        level = HttpLoggingInterceptor.Level.BODY
    }

    private val client = OkHttpClient.Builder()
        .addInterceptor(logging)
        .addInterceptor { chain ->
            val original = chain.request()
            val requestBuilder = original.newBuilder()
            SessionManager.token?.let {
                requestBuilder.header("Authorization", "Bearer $it")
            }
            val request = requestBuilder.build()
            chain.proceed(request)
        }
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .build()

    private val retrofit by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(client)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
    }

    // Giữ tên 'api' cho RoomApiService vì nhiều màn hình đang gọi RetrofitInstance.api
    val api: RoomApiService by lazy {
        retrofit.create(RoomApiService::class.java)
    }

    val tenantApi: TenantApiService by lazy {
        retrofit.create(TenantApiService::class.java)
    }

    val contractApi: ContractApiService by lazy {
        retrofit.create(ContractApiService::class.java)
    }

    val invoiceApi: InvoiceApiService by lazy {
        retrofit.create(InvoiceApiService::class.java)
    }

    val paymentApi: PaymentApiService by lazy {
        retrofit.create(PaymentApiService::class.java)
    }

    val authApi: AuthApiService by lazy {
        retrofit.create(AuthApiService::class.java)
    }

    val userApi: UserApiService by lazy {
        retrofit.create(UserApiService::class.java)
    }

    val yeuCauThueApi: YeuCauThueApiService by lazy {
        retrofit.create(YeuCauThueApiService::class.java)
    }

    val vietQRApi: com.nhom55.myapplication.feature.payment.VietQRApiService by lazy {
        retrofit.create(com.nhom55.myapplication.feature.payment.VietQRApiService::class.java)
    }

    val chatApi: com.nhom55.myapplication.feature.chatbot.ChatApiService by lazy {
        retrofit.create(com.nhom55.myapplication.feature.chatbot.ChatApiService::class.java)
    }

    // ReportApi cũ của Dashboard
    val reportApi: ReportApiService by lazy {
        retrofit.create(ReportApiService::class.java)
    }

    // RevenueApi mới cho màn hình Thống kê doanh thu
    val revenueApi: com.nhom55.myapplication.feature.report.ReportApiService by lazy {
        retrofit.create(com.nhom55.myapplication.feature.report.ReportApiService::class.java)
    }
}
