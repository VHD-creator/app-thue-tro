package com.nhom55.myapplication.feature.invoice

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.navigation.NavHostController
import com.nhom55.myapplication.core.network.RetrofitInstance
import com.nhom55.myapplication.feature.room.formatPrice
import com.nhom55.myapplication.feature.tenant.DetailRow
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun InvoiceDetailScreen(
    invoiceId: Int,
    navController: NavHostController
) {
    var invoice by remember { mutableStateOf<Invoice?>(null) }
    var isLoading by remember { mutableStateOf(true) }
    var errorMsg by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(invoiceId) {
        try {
            val response = withContext(Dispatchers.IO) {
                RetrofitInstance.invoiceApi.getInvoiceById(invoiceId)
            }
            invoice = response.toInvoice()
        } catch (e: Exception) {
            errorMsg = e.message ?: "Lỗi khi tải dữ liệu"
        } finally {
            isLoading = false
        }
    }

    Column(modifier = Modifier.fillMaxSize()) {
        // Header
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 4.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = { navController.navigateUp() }) {
                Icon(Icons.Default.ArrowBack, contentDescription = "Quay lại")
            }
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = "Chi tiết hóa đơn",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
        }

        Box(modifier = Modifier.fillMaxSize()) {
            if (isLoading) {
                CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
            } else {
                val currentInvoice = invoice
                if (currentInvoice != null) {
                    Column(
                        modifier = Modifier
                            .padding(16.dp)
                            .fillMaxSize()
                            .verticalScroll(rememberScrollState()),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        // Page Title & Status
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "Hoá đơn ${currentInvoice.roomName}",
                                style = MaterialTheme.typography.headlineSmall,
                                fontWeight = FontWeight.Bold
                            )
                            InvoiceStatusChip(status = currentInvoice.status)
                        }

                        // Basic info
                        Card(modifier = Modifier.fillMaxWidth()) {
                            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                DetailRow(label = "Tháng / Năm", value = currentInvoice.monthYear)
                            }
                        }

                        // Electricity details
                        Card(modifier = Modifier.fillMaxWidth()) {
                            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                Text(text = "Điện", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                                HorizontalDivider()
                                DetailRow(label = "Chỉ số cũ", value = "${currentInvoice.electricityOld}")
                                DetailRow(label = "Chỉ số mới", value = "${currentInvoice.electricityNew}")
                                DetailRow(label = "Tiêu thụ", value = "${currentInvoice.electricityNew - currentInvoice.electricityOld} kWh")
                                DetailRow(label = "Thành tiền", value = formatPrice(currentInvoice.electricityCost.toLong()))
                            }
                        }

                        // Water details
                        Card(modifier = Modifier.fillMaxWidth()) {
                            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                Text(text = "Nước", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                                HorizontalDivider()
                                DetailRow(label = "Chỉ số cũ", value = "${currentInvoice.waterOld}")
                                DetailRow(label = "Chỉ số mới", value = "${currentInvoice.waterNew}")
                                DetailRow(label = "Tiêu thụ", value = "${currentInvoice.waterNew - currentInvoice.waterOld} m³")
                                DetailRow(label = "Thành tiền", value = formatPrice(currentInvoice.waterCost.toLong()))
                            }
                        }

                        // Room cost & total
                        Card(modifier = Modifier.fillMaxWidth()) {
                            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                Text(text = "Tổng kết", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                                HorizontalDivider()
                                DetailRow(label = "Tiền phòng", value = formatPrice(currentInvoice.roomCost.toLong()))
                                DetailRow(label = "Tiền điện", value = formatPrice(currentInvoice.electricityCost.toLong()))
                                DetailRow(label = "Tiền nước", value = formatPrice(currentInvoice.waterCost.toLong()))
                                HorizontalDivider()
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text(
                                        text = "TỔNG CỘNG",
                                        style = MaterialTheme.typography.titleMedium,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Text(
                                        text = formatPrice(currentInvoice.totalCost.toLong()),
                                        style = MaterialTheme.typography.titleMedium,
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.primary
                                    )
                                }
                            }
                        }

                        // Pay button for unpaid invoices
                        if (currentInvoice.status != InvoiceStatus.PAID) {
                            Button(
                                onClick = {
                                    navController.navigate(
                                        "payment_form/${currentInvoice.id}/${currentInvoice.totalCost.toFloat()}"
                                    )
                                },
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text("Thanh toán")
                            }
                        }
                    }
                } else {
                    Text(
                        text = errorMsg ?: "Không tìm thấy hóa đơn",
                        modifier = Modifier.padding(16.dp).align(Alignment.Center),
                        color = MaterialTheme.colorScheme.error
                    )
                }
            }
        }
    }
}
