package com.nhom55.myapplication

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavHostController

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RoomDetailScreen(
    roomId: String?,
    navController: NavHostController,
    viewModel: RoomViewModel = viewModel(),
    invoiceViewModel: InvoiceViewModel = viewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val invoiceState by invoiceViewModel.uiState.collectAsState()
    val currentUser by SessionManager.currentUser.collectAsState()
    
    val room = when (val state = uiState) {
        is RoomUiState.Success -> state.rooms.find { it.id == roomId }
        else -> null
    }

    val roomInvoices = if (invoiceState is InvoiceUiState.Success) {
        (invoiceState as InvoiceUiState.Success).invoices.filter { it.roomId.toString() == roomId }
    } else emptyList()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Chi tiết phòng") },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Quay lại")
                    }
                }
            )
        }
    ) { paddingValues ->
        Box(modifier = Modifier.padding(paddingValues)) {
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
                            navController = navController
                        )
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
    navController: NavHostController
) {
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

        if (room.description != null) {
            DetailItem(
                icon = Icons.Default.Info,
                label = "Mô tả",
                value = room.description
            )
        }

        if (room.tenantName != null) {
            DetailItem(
                icon = Icons.Default.Person,
                label = "Người đang thuê",
                value = room.tenantName
            )
        }

        Spacer(modifier = Modifier.weight(1f))

        if (room.status == RoomStatus.AVAILABLE) {
            Button(
                onClick = { 
                    android.widget.Toast.makeText(navController.context, "Tính năng Thuê Phòng đang được phát triển", android.widget.Toast.LENGTH_SHORT).show()
                },
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondary)
            ) {
                Text("Thuê phòng")
            }
            Spacer(modifier = Modifier.height(8.dp))
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
        } else {
            Button(
                onClick = { /* TODO: Xử lý chỉnh sửa */ },
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Chỉnh sửa thông tin")
            }
        }
    }
}

@Composable
fun DetailItem(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    label: String,
    value: String,
    valueColor: androidx.compose.ui.graphics.Color = MaterialTheme.colorScheme.onSurface
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
