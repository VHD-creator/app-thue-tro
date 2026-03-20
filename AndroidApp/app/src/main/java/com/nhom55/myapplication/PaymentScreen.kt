package com.nhom55.myapplication

import android.widget.Toast
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.navigation.NavHostController

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PaymentScreen(
    invoiceId: Int,
    totalAmount: Double,
    navController: NavHostController,
    viewModel: PaymentViewModel = androidx.lifecycle.viewmodel.compose.viewModel()
) {
    val submitState by viewModel.submitState.collectAsState()
    val context = LocalContext.current
    
    var selectedMethod by remember { mutableStateOf("chuyển khoản") }
    val paymentMethods = listOf("tiền mặt", "chuyển khoản", "thẻ tín dụng", "ví điện tử")

    LaunchedEffect(submitState) {
        when (submitState) {
            is PaymentSubmitState.Success -> {
                Toast.makeText(context, "Thanh toán thành công!", Toast.LENGTH_SHORT).show()
                navController.popBackStack()
                viewModel.resetState()
            }
            is PaymentSubmitState.Error -> {
                val message = (submitState as PaymentSubmitState.Error).message
                Toast.makeText(context, message, Toast.LENGTH_LONG).show()
                viewModel.resetState()
            }
            else -> {}
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Thanh toán hóa đơn") },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Quay lại")
                    }
                }
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "Số tiền thanh toán",
                style = MaterialTheme.typography.titleMedium
            )
            
            Text(
                text = "${String.format("%,.0f", totalAmount)} VNĐ",
                style = MaterialTheme.typography.displaySmall,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary
            )
            
            Spacer(modifier = Modifier.height(24.dp))
            
            Text(
                text = "Phương thức thanh toán",
                style = MaterialTheme.typography.titleMedium,
                modifier = Modifier.align(Alignment.Start)
            )

            paymentMethods.forEach { method ->
                Row(
                    Modifier
                        .fillMaxWidth()
                        .padding(vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    RadioButton(
                        selected = (method == selectedMethod),
                        onClick = { selectedMethod = method }
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(text = method.replaceFirstChar { it.uppercase() })
                }
            }

            Spacer(modifier = Modifier.weight(1f))

            Button(
                onClick = { 
                    viewModel.submitPayment(invoiceId, totalAmount, selectedMethod) 
                },
                modifier = Modifier.fillMaxWidth().height(50.dp),
                enabled = submitState !is PaymentSubmitState.Loading
            ) {
                if (submitState is PaymentSubmitState.Loading) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(24.dp),
                        color = MaterialTheme.colorScheme.onPrimary
                    )
                } else {
                    Text("Xác nhận thanh toán")
                }
            }
        }
    }
}
