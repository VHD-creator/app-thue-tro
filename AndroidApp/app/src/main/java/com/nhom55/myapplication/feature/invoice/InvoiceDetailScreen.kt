package com.nhom55.myapplication.feature.invoice

import android.widget.Toast
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavHostController
import com.nhom55.myapplication.core.network.RetrofitInstance
import com.nhom55.myapplication.core.session.SessionManager
import com.nhom55.myapplication.feature.room.formatPrice
import com.nhom55.myapplication.feature.tenant.DetailRow
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import android.content.ContentValues
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import java.io.OutputStream
import androidx.compose.material.icons.filled.PictureAsPdf

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun InvoiceDetailScreen(
    invoiceId: Int,
    navController: NavHostController,
    viewModel: InvoiceViewModel = viewModel()
) {
    var invoice by remember { mutableStateOf<Invoice?>(null) }
    var isLoading by remember { mutableStateOf(true) }
    var errorMsg by remember { mutableStateOf<String?>(null) }
    var showDeleteDialog by remember { mutableStateOf(false) }
    var showConfirmDialog by remember { mutableStateOf(false) }
    val context = LocalContext.current
    val isOperating by viewModel.isOperating.collectAsState()
    val currentUser by SessionManager.currentUser.collectAsState()
    val isAdminOrChuTro = currentUser?.role == "ADMIN" || currentUser?.role == "CHU_TRO"

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

    // Delete dialog
    if (showDeleteDialog) {
        AlertDialog(
            onDismissRequest = { showDeleteDialog = false },
            title = { Text("Xác nhận xóa") },
            text = { Text("Bạn có chắc muốn xóa hóa đơn này? Hành động không thể hoàn tác.") },
            confirmButton = {
                TextButton(
                    onClick = {
                        showDeleteDialog = false
                        viewModel.deleteInvoice(
                            id = invoiceId,
                            onSuccess = {
                                Toast.makeText(context, "Đã xóa hóa đơn", Toast.LENGTH_SHORT).show()
                                navController.navigateUp()
                            },
                            onError = { msg ->
                                Toast.makeText(context, msg, Toast.LENGTH_LONG).show()
                            }
                        )
                    },
                    colors = ButtonDefaults.textButtonColors(contentColor = MaterialTheme.colorScheme.error)
                ) {
                    Text("Xóa")
                }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteDialog = false }) {
                    Text("Hủy")
                }
            }
        )
    }

    // Confirm dialog
    if (showConfirmDialog) {
        AlertDialog(
            onDismissRequest = { showConfirmDialog = false },
            title = { Text("Xác nhận thu tiền") },
            text = { Text("Bạn có chắc chắn đã nhận đủ tiền mặt cho hóa đơn này không? Trạng thái sẽ được chuyển thành 'Đã thu'.") },
            confirmButton = {
                TextButton(
                    onClick = {
                        showConfirmDialog = false
                        viewModel.confirmPayment(
                            id = invoiceId,
                            onSuccess = {
                                Toast.makeText(context, "Đã xác nhận thu tiền", Toast.LENGTH_SHORT).show()
                                navController.previousBackStackEntry?.savedStateHandle?.set("refresh", true)
                                navController.navigateUp()
                            },
                            onError = { msg ->
                                Toast.makeText(context, msg, Toast.LENGTH_LONG).show()
                            }
                        )
                    }
                ) {
                    Text("Xác nhận")
                }
            },
            dismissButton = {
                TextButton(onClick = { showConfirmDialog = false }) {
                    Text("Hủy")
                }
            }
        )
    }

    Column(modifier = Modifier.fillMaxSize()) {
        // ... (Header and scrollable content are inside the main Box below)
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
                fontWeight = FontWeight.Bold,
                modifier = Modifier.weight(1f)
            )
            if (invoice != null && isAdminOrChuTro) {
                IconButton(onClick = {
                    navController.navigate("create_edit_invoice/${invoiceId}")
                }) {
                    Icon(Icons.Default.Edit, contentDescription = "Chỉnh sửa")
                }
                IconButton(
                    onClick = { showDeleteDialog = true },
                    enabled = !isOperating
                ) {
                    Icon(
                        Icons.Default.Delete,
                        contentDescription = "Xóa",
                        tint = MaterialTheme.colorScheme.error
                    )
                }
            }
        }

        Box(modifier = Modifier.fillMaxSize()) {
            if (isLoading || isOperating) {
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

                        // Action buttons based on role and status
                        if (isAdminOrChuTro) {
                            if (currentInvoice.status == InvoiceStatus.PENDING) {
                                Button(
                                    onClick = { showConfirmDialog = true },
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Text("Xác nhận thu tiền")
                                }
                            }
                        } else {
                            if (currentInvoice.status == InvoiceStatus.UNPAID) {
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
                            } else if (currentInvoice.status == InvoiceStatus.PENDING) {
                                OutlinedButton(
                                    onClick = { },
                                    modifier = Modifier.fillMaxWidth(),
                                    enabled = false
                                ) {
                                    Text("Đang chờ duyệt tiền mặt")
                                }
                            }
                        }

                        // Xuất PDF (Mọi vai trò đều có thể xuất nếu đã có hóa đơn)
                        OutlinedButton(
                            onClick = {
                                viewModel.downloadPdf(
                                    id = invoiceId,
                                    onSuccess = { responseBody ->
                                        savePdfToDownloads(context, responseBody, "HoaDon_${currentInvoice.roomName}_${currentInvoice.monthYear}.pdf")
                                    },
                                    onError = { msg ->
                                        Toast.makeText(context, msg, Toast.LENGTH_LONG).show()
                                    }
                                )
                            },
                            modifier = Modifier.fillMaxWidth(),
                            enabled = !isOperating
                        ) {
                            Icon(Icons.Default.PictureAsPdf, contentDescription = null)
                            Spacer(Modifier.width(8.dp))
                            Text("Xuất hóa đơn PDF")
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

fun savePdfToDownloads(context: android.content.Context, body: okhttp3.ResponseBody, fileName: String) {
    try {
        val resolver = context.contentResolver
        val contentValues = ContentValues().apply {
            put(MediaStore.MediaColumns.DISPLAY_NAME, fileName)
            put(MediaStore.MediaColumns.MIME_TYPE, "application/pdf")
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS)
            }
        }

        val uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, contentValues)
        if (uri != null) {
            resolver.openOutputStream(uri).use { outputStream ->
                outputStream?.write(body.bytes())
            }
            Toast.makeText(context, "Đã lưu PDF vào thư mục Downloads", Toast.LENGTH_LONG).show()
        } else {
            Toast.makeText(context, "Không thể tạo file PDF", Toast.LENGTH_SHORT).show()
        }
    } catch (e: Exception) {
        Toast.makeText(context, "Lỗi khi lưu file: ${e.message}", Toast.LENGTH_LONG).show()
    }
}
