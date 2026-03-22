package com.nhom55.myapplication.feature.room

import android.widget.Toast
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavHostController
import com.nhom55.myapplication.feature.contract.ContractViewModel
import com.nhom55.myapplication.feature.contract.CreateContractUiState
import com.nhom55.myapplication.feature.invoice.Invoice
import com.nhom55.myapplication.feature.invoice.InvoiceCard
import com.nhom55.myapplication.feature.invoice.InvoiceStatus
import com.nhom55.myapplication.feature.invoice.InvoiceUiState
import com.nhom55.myapplication.feature.invoice.InvoiceViewModel
import com.nhom55.myapplication.navigation.User
import com.nhom55.myapplication.core.session.SessionManager

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RoomDetailScreen(
    roomId: String?,
    navController: NavHostController,
    viewModel: RoomViewModel = viewModel(),
    invoiceViewModel: InvoiceViewModel = viewModel(),
    contractViewModel: ContractViewModel = viewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val invoiceState by invoiceViewModel.uiState.collectAsState()
    val createContractState by contractViewModel.createUiState.collectAsState()
    val currentUser by SessionManager.currentUser.collectAsState()
    val context = LocalContext.current
    var showBookingDialog by remember { mutableStateOf(false) }

    LaunchedEffect(createContractState) {
        if (createContractState is CreateContractUiState.Success) {
            Toast.makeText(context, "Đặt phòng thành công!", Toast.LENGTH_SHORT).show()
            showBookingDialog = false
            contractViewModel.resetCreateState()
            viewModel.loadRooms()
        } else if (createContractState is CreateContractUiState.Error) {
            val msg = (createContractState as CreateContractUiState.Error).message
            Toast.makeText(context, msg, Toast.LENGTH_SHORT).show()
            contractViewModel.resetCreateState()
        }
    }
    
    val room = when (val state = uiState) {
        is RoomUiState.Success -> state.rooms.find { it.id == roomId }
        else -> null
    }

    val roomInvoices = if (invoiceState is InvoiceUiState.Success) {
        (invoiceState as InvoiceUiState.Success).invoices.filter { it.roomId.toString() == roomId }
    } else emptyList()

    Column(modifier = Modifier.fillMaxSize()) {
        // Custom Header tránh lỗi double Insets của Scaffold lồng nhau
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 4.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = { navController.popBackStack() }) {
                Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Quay lại")
            }
            Spacer(modifier = Modifier.width(8.dp))
            Text("Chi tiết phòng", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        }

        Box(modifier = Modifier.weight(1f)) {
            when (uiState) {
                is RoomUiState.Loading -> {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator()
                    }
                }
                is RoomUiState.Error -> {
                    val message = (uiState as RoomUiState.Error).message
                    ErrorMessage(message) { viewModel.loadRooms() }
                }
                is RoomUiState.Success -> {
                    if (room != null) {
                        RoomDetailContent(
                            room = room,
                            currentUser = currentUser,
                            roomInvoices = roomInvoices,
                            navController = navController,
                            onBookRoom = { showBookingDialog = true }
                        )

                        if (showBookingDialog) {
                            BookingDialog(
                                roomPrice = room.price,
                                isLoading = createContractState is CreateContractUiState.Loading,
                                onDismiss = { showBookingDialog = false },
                                onConfirm = { startDate, endDate, deposit ->
                                    currentUser?.id?.toIntOrNull()?.let { userId ->
                                        contractViewModel.createContract(
                                            roomId = room.id.toInt(),
                                            tenantId = userId,
                                            startDate = startDate,
                                            endDate = endDate,
                                            deposit = deposit
                                        )
                                    } ?: run {
                                        Toast.makeText(context, "Lỗi xác thực người dùng", Toast.LENGTH_SHORT).show()
                                    }
                                }
                            )
                        }
                    } else {
                        ErrorMessage("Không tìm thấy thông tin phòng") { navController.popBackStack() }
                    }
                }
            }
        }
    }
}

@Composable
fun RoomDetailContent(
    room: Room,
    currentUser: User?,
    roomInvoices: List<Invoice>,
    navController: NavHostController,
    onBookRoom: () -> Unit
) {
    val context = LocalContext.current

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(start = 16.dp, end = 16.dp, bottom = 16.dp, top = 4.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = room.name,
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold
            )
            StatusChip(status = room.status)
        }

        HorizontalDivider(thickness = 0.5.dp, color = MaterialTheme.colorScheme.outlineVariant)

        DetailItem(
            icon = Icons.Default.Info,
            label = "Giá thuê",
            value = "${formatPrice(room.price)}/tháng",
            valueColor = MaterialTheme.colorScheme.primary
        )

        DetailItem(
            icon = Icons.Default.LocationOn,
            label = "Vị trí",
            value = "Tầng ${room.floor}"
        )

        DetailItem(
            icon = Icons.Default.Info,
            label = "Diện tích",
            value = "${room.area} m²"
        )

        DetailItem(
            icon = Icons.Default.Info,
            label = "Mô tả",
            value = if (!room.description.isNullOrBlank()) room.description else "Trống"
        )

        DetailItem(
            icon = Icons.Default.Person,
            label = "Người đang thuê",
            value = if (!room.tenantName.isNullOrBlank()) room.tenantName else "Chưa có người thuê"
        )

        Spacer(modifier = Modifier.weight(1f))

        val isGuestOrTenant = currentUser == null || currentUser?.role == "NGUOI_THUE"
        
        if (isGuestOrTenant) {
            if (room.status == RoomStatus.AVAILABLE) {
                Button(
                    onClick = {
                        if (currentUser == null) {
                            Toast.makeText(context, "Vui lòng đăng nhập để thuê phòng", Toast.LENGTH_SHORT).show()
                            navController.navigate("login")
                        } else {
                            onBookRoom()
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondary)
                ) {
                    Text("Thuê phòng")
                }
                Spacer(modifier = Modifier.height(16.dp))
            }

            if (currentUser?.role == "NGUOI_THUE") {
                Text("Hóa đơn của phòng", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                
                if (roomInvoices.isEmpty()) {
                    Text("Không có hóa đơn nào", color = MaterialTheme.colorScheme.outline)
                } else {
                    roomInvoices.forEach { invoice ->
                        InvoiceCard(
                            invoice = invoice,
                            onClick = {
                                if (invoice.status == InvoiceStatus.UNPAID || invoice.status == InvoiceStatus.PARTIAL) {
                                    navController.navigate("payment_form/${invoice.id}/${invoice.totalCost.toFloat()}")
                                }
                            }
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                    }
                }
            }
        } else {
            Text("Thao tác quản lý", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(8.dp))
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Button(
                    onClick = { /* TODO: Sửa thông tin */ },
                    modifier = Modifier.weight(1f)
                ) {
                    Text("Sửa phòng")
                }
                
                if (room.status == RoomStatus.OCCUPIED) {
                    Button(
                        onClick = { /* TODO: Tạo hóa đơn */ },
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondary)
                    ) {
                        Text("Ghi điện nước")
                    }
                } else if (room.status == RoomStatus.AVAILABLE) {
                    Button(
                        onClick = { /* TODO: Gán khách ngoài */ },
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondary)
                    ) {
                        Text("Gán khách")
                    }
                }
            }
            
            if (room.status == RoomStatus.OCCUPIED) {
                Spacer(modifier = Modifier.height(8.dp))
                OutlinedButton(
                    onClick = { /* TODO: Báo trả phòng */ },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = MaterialTheme.colorScheme.error)
                ) {
                    Text("Khách trả phòng (Kết thúc HĐ)")
                }
            }
        }
    }
}

@Composable
fun DetailItem(
    icon: ImageVector,
    label: String,
    value: String,
    valueColor: Color = MaterialTheme.colorScheme.onSurface
) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(icon, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(24.dp))
        Spacer(modifier = Modifier.width(16.dp))
        Column {
            Text(label, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.outline)
            Text(value, style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.Medium, color = valueColor)
        }
    }
}

@Composable
fun ErrorMessage(message: String, onAction: () -> Unit) {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(message)
            Spacer(modifier = Modifier.height(8.dp))
            Button(onClick = onAction) {
                Text("Thử lại/Quay lại")
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BookingDialog(
    roomPrice: Long,
    isLoading: Boolean,
    onDismiss: () -> Unit,
    onConfirm: (startDate: String, endDate: String, deposit: Long) -> Unit
) {
    var startDate by remember { mutableStateOf("") }
    var endDate by remember { mutableStateOf("") }
    var depositText by remember { mutableStateOf(roomPrice.toString()) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Thông tin đặt phòng") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = startDate,
                    onValueChange = { startDate = it },
                    label = { Text("Ngày bắt đầu (DD-MM-YYYY)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = endDate,
                    onValueChange = { endDate = it },
                    label = { Text("Ngày kết thúc (DD-MM-YYYY)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = depositText,
                    onValueChange = { depositText = it },
                    label = { Text("Tiền cọc (VNĐ)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    val deposit = depositText.toLongOrNull() ?: 0L
                    onConfirm(startDate, endDate, deposit)
                },
                enabled = !isLoading && startDate.isNotBlank() && endDate.isNotBlank()
            ) {
                if (isLoading) {
                    CircularProgressIndicator(modifier = Modifier.size(24.dp), color = MaterialTheme.colorScheme.onPrimary)
                } else {
                    Text("Xác nhận")
                }
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss, enabled = !isLoading) {
                Text("Hủy")
            }
        }
    )
}
