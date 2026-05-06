package com.nhom55.myapplication.feature.payment

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavHostController
import coil.compose.AsyncImage

import android.widget.Toast
import androidx.compose.ui.platform.LocalContext

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun VietQRPaymentScreen(
    invoiceId: Int,
    navController: NavHostController,
    viewModel: VietQRViewModel = viewModel()
) {
    val qrState by viewModel.invoiceQR.collectAsState()
    val paymentViewModel: PaymentViewModel = viewModel()
    val submitState by paymentViewModel.submitState.collectAsState()
    val context = LocalContext.current

    LaunchedEffect(invoiceId) {
        viewModel.getInvoiceQR(invoiceId)
    }

    LaunchedEffect(submitState) {
        if (submitState is PaymentSubmitState.Success) {
            Toast.makeText(context, "Đã gửi thông báo thanh toán. Chờ chủ trọ xác nhận.", Toast.LENGTH_LONG).show()
            navController.popBackStack()
            paymentViewModel.resetState()
        } else if (submitState is PaymentSubmitState.Error) {
            Toast.makeText(context, (submitState as PaymentSubmitState.Error).message, Toast.LENGTH_LONG).show()
            paymentViewModel.resetState()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Thanh toán VietQR", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back")
                    }
                }
            )
        }
    ) { padding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding),
            contentAlignment = Alignment.Center
        ) {
            when (val state = qrState) {
                is VietQRState.Loading -> CircularProgressIndicator()
                is VietQRState.Error -> {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(state.message, color = MaterialTheme.colorScheme.error)
                        Button(onClick = { viewModel.getInvoiceQR(invoiceId) }) {
                            Text("Thử lại")
                        }
                    }
                }
                is VietQRState.Success<*> -> {
                    val data = state.data as VietQRResponse
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(16.dp)
                            .verticalScroll(rememberScrollState()),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .aspectRatio(1f),
                            elevation = CardDefaults.cardElevation(defaultElevation = 8.dp),
                            colors = CardDefaults.cardColors(containerColor = Color.White)
                        ) {
                            AsyncImage(
                                model = data.thanh_toan.qr_url,
                                contentDescription = "VietQR Code",
                                modifier = Modifier.fillMaxSize().padding(16.dp),
                                contentScale = ContentScale.Fit
                            )
                        }

                        Text(
                            text = "Số tiền: ${String.format("%,.0f", data.thanh_toan.so_tien)} VNĐ",
                            style = MaterialTheme.typography.headlineSmall,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary
                        )

                        Column(
                            modifier = Modifier.fillMaxWidth().padding(8.dp),
                            verticalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            InfoRow("Chủ tài khoản:", data.thanh_toan.ten_nguoi_nhan)
                            InfoRow("Số tài khoản:", data.thanh_toan.so_tai_khoan)
                            InfoRow("Nội dung:", data.thanh_toan.noi_dung)
                        }

                        Surface(
                            modifier = Modifier.fillMaxWidth(),
                            color = MaterialTheme.colorScheme.surfaceVariant,
                            shape = MaterialTheme.shapes.medium
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Text("Hướng dẫn thanh toán:", fontWeight = FontWeight.Bold)
                                for (step in data.thanh_toan.huong_dan) {
                                    Text("• $step", fontSize = 14.sp)
                                }
                            }
                        }

                        Button(
                            onClick = { 
                                paymentViewModel.submitPayment(
                                    invoiceId = invoiceId,
                                    amount = data.thanh_toan.so_tien,
                                    method = "VietQR - Chuyển khoản"
                                )
                            },
                            modifier = Modifier.fillMaxWidth(),
                            enabled = submitState !is PaymentSubmitState.Loading
                        ) {
                            if (submitState is PaymentSubmitState.Loading) {
                                CircularProgressIndicator(modifier = Modifier.size(24.dp), color = Color.White)
                            } else {
                                Text("Tôi đã chuyển khoản xong")
                            }
                        }
                        
                        Text(
                            "Sau khi bạn chuyển khoản, chủ trọ sẽ nhận được thông báo và xác nhận thanh toán cho bạn.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.outline,
                            modifier = Modifier.padding(bottom = 16.dp)
                        )
                    }
                }
                else -> {}
            }
        }
    }
}

@Composable
fun InfoRow(label: String, value: String) {
    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(label, color = MaterialTheme.colorScheme.outline)
        Text(value, fontWeight = FontWeight.Medium)
    }
}
