package com.nhom55.myapplication.feature.invoice

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.navigation.NavHostController
import com.nhom55.myapplication.core.network.RetrofitInstance
import com.nhom55.myapplication.core.network.RoomApiModel
import com.nhom55.myapplication.feature.room.formatPrice
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CreateInvoiceScreen(navController: NavHostController) {
    val currentMonthYear = remember {
        SimpleDateFormat("MM-yyyy", Locale.getDefault()).format(Date())
    }

    var selectedRoom by remember { mutableStateOf<RoomApiModel?>(null) }
    var expanded by remember { mutableStateOf(false) }
    var availableRooms by remember { mutableStateOf<List<RoomApiModel>>(emptyList()) }

    var soDienCu by remember { mutableStateOf("") }
    var soDienMoi by remember { mutableStateOf("") }
    var soNuocCu by remember { mutableStateOf("") }
    var soNuocMoi by remember { mutableStateOf("") }
    
    val calculatedTienDien by remember {
        derivedStateOf {
            val cu = soDienCu.toLongOrNull() ?: 0L
            val moi = soDienMoi.toLongOrNull() ?: 0L
            if (moi >= cu) (moi - cu) * 3500L else 0L
        }
    }
    val calculatedTienNuoc by remember {
        derivedStateOf {
            val cu = soNuocCu.toLongOrNull() ?: 0L
            val moi = soNuocMoi.toLongOrNull() ?: 0L
            if (moi >= cu) (moi - cu) * 6000L else 0L
        }
    }
    val calculatedTienPhong by remember {
        derivedStateOf { selectedRoom?.gia_phong ?: 0L }
    }
    val tongTien by remember {
        derivedStateOf { calculatedTienDien + calculatedTienNuoc + calculatedTienPhong }
    }

    var isLoading by remember { mutableStateOf(false) }
    var isFetchingData by remember { mutableStateOf(true) }
    var errorMsg by remember { mutableStateOf<String?>(null) }
    var successMsg by remember { mutableStateOf<String?>(null) }

    val scope = rememberCoroutineScope()

    LaunchedEffect(Unit) {
        try {
            // Fetch rooms and invoices to filter
            val roomsTask = withContext(Dispatchers.IO) { RetrofitInstance.api.getRooms() }
            val invoicesTask = withContext(Dispatchers.IO) { RetrofitInstance.invoiceApi.getInvoices() }
            
            // Only keep rooms that are occupied (trang_thai == "1")
            val occupiedRooms = roomsTask.filter { it.trang_thai == "1" }
            
            // Find rooms that ALREADY have an invoice this month
            val roomsWithInvoiceThisMonth = invoicesTask
                .filter { it.thang_nam == currentMonthYear }
                .map { it.id_phong }
                
            // Filter out those rooms
            availableRooms = occupiedRooms.filter { it.id_phong !in roomsWithInvoiceThisMonth }
            
        } catch (e: Exception) {
            errorMsg = "Không thể tải danh sách phòng: ${e.message}"
        } finally {
            isFetchingData = false
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
                text = "Tạo hóa đơn mới",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
        }

        if (isFetchingData) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
        } else {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                ExposedDropdownMenuBox(
                    expanded = expanded,
                    onExpandedChange = { expanded = !expanded }
                ) {
                    OutlinedTextField(
                        value = selectedRoom?.ten_phong ?: "Chọn phòng",
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Phòng") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
                        colors = ExposedDropdownMenuDefaults.outlinedTextFieldColors(),
                        modifier = Modifier
                            .fillMaxWidth()
                            .menuAnchor()
                    )
                    ExposedDropdownMenu(
                        expanded = expanded,
                        onDismissRequest = { expanded = false }
                    ) {
                        if (availableRooms.isEmpty()) {
                            DropdownMenuItem(
                                text = { Text("Không có phòng trống nào cần tạo hóa đơn") },
                                onClick = { expanded = false }
                            )
                        } else {
                            availableRooms.forEach { room ->
                                DropdownMenuItem(
                                    text = { Text("Phòng ${room.ten_phong}") },
                                    onClick = {
                                        selectedRoom = room
                                        expanded = false
                                    }
                                )
                            }
                        }
                    }
                }

                OutlinedTextField(
                    value = currentMonthYear,
                    onValueChange = {},
                    readOnly = true,
                    label = { Text("Tháng/Năm (Tự động)") },
                    modifier = Modifier.fillMaxWidth()
                )

            Text(
                text = "Điện",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedTextField(
                    value = soDienCu,
                    onValueChange = { soDienCu = it },
                    label = { Text("Số cũ") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.weight(1f)
                )
                OutlinedTextField(
                    value = soDienMoi,
                    onValueChange = { soDienMoi = it },
                    label = { Text("Số mới") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.weight(1f)
                )
            }

            Text(
                text = "Nước",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedTextField(
                    value = soNuocCu,
                    onValueChange = { soNuocCu = it },
                    label = { Text("Số cũ") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.weight(1f)
                )
                OutlinedTextField(
                    value = soNuocMoi,
                    onValueChange = { soNuocMoi = it },
                    label = { Text("Số mới") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.weight(1f)
                )
            }

            Card(
                modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Tiền điện (3.500đ/kWh):")
                        Text(formatPrice(calculatedTienDien), fontWeight = FontWeight.Bold)
                    }
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Tiền nước (6.000đ/m³):")
                        Text(formatPrice(calculatedTienNuoc), fontWeight = FontWeight.Bold)
                    }
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Tiền phòng:")
                        Text(formatPrice(calculatedTienPhong), fontWeight = FontWeight.Bold)
                    }
                    HorizontalDivider(modifier = Modifier.padding(vertical = 4.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("TỔNG CỘNG:", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                        Text(
                            formatPrice(tongTien),
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                }
            }

            if (errorMsg != null) {
                Text(
                    text = errorMsg!!,
                    color = MaterialTheme.colorScheme.error,
                    style = MaterialTheme.typography.bodyMedium
                )
            }

            if (successMsg != null) {
                Text(
                    text = successMsg!!,
                    color = MaterialTheme.colorScheme.primary,
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.Bold
                )
            }

            Button(
                onClick = {
                    errorMsg = null
                    successMsg = null

                    if (selectedRoom == null) {
                        errorMsg = "Vui lòng chọn phòng"
                        return@Button
                    }

                    isLoading = true
                    scope.launch {
                        try {
                            val body = mapOf(
                                "id_phong" to selectedRoom!!.id_phong,
                                "thang_nam" to currentMonthYear,
                                "so_dien_cu" to (soDienCu.toIntOrNull() ?: 0),
                                "so_dien_moi" to (soDienMoi.toIntOrNull() ?: 0),
                                "so_nuoc_cu" to (soNuocCu.toIntOrNull() ?: 0),
                                "so_nuoc_moi" to (soNuocMoi.toIntOrNull() ?: 0),
                                "tien_dien" to calculatedTienDien.toDouble(),
                                "tien_nuoc" to calculatedTienNuoc.toDouble(),
                                "tien_phong" to calculatedTienPhong.toDouble(),
                                "trang_thai" to 0
                            )
                            withContext(Dispatchers.IO) {
                                RetrofitInstance.invoiceApi.createInvoice(body)
                            }
                            successMsg = "Tạo hóa đơn thành công!"
                        } catch (e: Exception) {
                            errorMsg = e.message ?: "Lỗi khi tạo hóa đơn"
                        } finally {
                            isLoading = false
                        }
                    }
                },
                enabled = !isLoading,
                modifier = Modifier.fillMaxWidth()
            ) {
                if (isLoading) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(20.dp),
                        color = MaterialTheme.colorScheme.onPrimary
                    )
                } else {
                    Text("Tạo hóa đơn")
                }
            }
            }
        }
    }
}
