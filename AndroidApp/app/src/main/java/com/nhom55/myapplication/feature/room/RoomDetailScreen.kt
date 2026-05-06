package com.nhom55.myapplication.feature.room

import android.widget.Toast
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Image
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import coil.compose.AsyncImage
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
import com.nhom55.myapplication.core.network.RetrofitInstance
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RoomDetailScreen(
    roomId: String?,
    navController: NavHostController,
    viewModel: RoomViewModel = viewModel(),
    invoiceViewModel: InvoiceViewModel = viewModel(),
    yeuCauThueViewModel: YeuCauThueViewModel = viewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val invoiceState by invoiceViewModel.uiState.collectAsState()
    val currentUser by SessionManager.currentUser.collectAsState()
    val roomImagesMap by viewModel.roomImages.collectAsState()
    val context = LocalContext.current
    var showBookingDialog by remember { mutableStateOf(false) }

    LaunchedEffect(roomId) {
        if (roomId != null) {
            viewModel.loadRoomImages(roomId)
        }
    }

    val yeuCauState by yeuCauThueViewModel.actionState.collectAsState()

    LaunchedEffect(yeuCauState) {
        if (yeuCauState is YeuCauThueState.Success) {
            Toast.makeText(context, "Gửi yêu cầu thuê thành công! Vui lòng chờ chủ trọ duyệt.", Toast.LENGTH_LONG).show()
            showBookingDialog = false
            yeuCauThueViewModel.resetActionState()
            viewModel.loadRooms()
        } else if (yeuCauState is YeuCauThueState.Error) {
            val msg = (yeuCauState as YeuCauThueState.Error).message
            Toast.makeText(context, msg, Toast.LENGTH_SHORT).show()
            yeuCauThueViewModel.resetActionState()
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
                        val currentRoomImages = roomImagesMap[roomId] ?: emptyList()
                        RoomDetailContent(
                            room = room,
                            currentUser = currentUser,
                            roomInvoices = roomInvoices,
                            roomImages = currentRoomImages,
                            navController = navController,
                            onBookRoom = { showBookingDialog = true }
                        )

                        if (showBookingDialog) {
                            BookingDialog(
                                roomPrice = room.price,
                                isLoading = yeuCauState is YeuCauThueState.Loading,
                                onDismiss = { showBookingDialog = false },
                                onConfirm = { startDate, endDate, deposit ->
                                    val request = CreateYeuCauThueRequest(
                                        id_phong = room.id.toInt(),
                                        ngay_bat_dau_mong_muon = startDate,
                                        ngay_ket_thuc = endDate,
                                        tien_coc = deposit,
                                        ghi_chu = ""
                                    )
                                    yeuCauThueViewModel.createYeuCauThue(request)
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
    roomImages: List<HinhAnhPhong>,
    navController: NavHostController,
    onBookRoom: () -> Unit
) {
    val context = LocalContext.current

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(start = 16.dp, end = 16.dp, bottom = 16.dp, top = 4.dp)
            .verticalScroll(rememberScrollState()),
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

        // HÌNH ẢNH PHÒNG
        Text("Hình ảnh phòng", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
        if (roomImages.isEmpty()) {
            Text("Chưa có hình ảnh", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.outline, modifier = Modifier.padding(bottom = 8.dp))
        } else {
            LazyRow(
                modifier = Modifier.fillMaxWidth().height(200.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                contentPadding = PaddingValues(horizontal = 4.dp)
            ) {
                items(roomImages) { hinhAnh ->
                    AsyncImage(
                        model = hinhAnh.url,
                        contentDescription = hinhAnh.description ?: hinhAnh.type,
                        contentScale = ContentScale.Crop,
                        modifier = Modifier
                            .fillMaxHeight()
                            .aspectRatio(4f / 3f)
                            .clip(RoundedCornerShape(8.dp))
                    )
                }
            }
        }

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
            label = "Mô tả",
            value = if (!room.description.isNullOrBlank()) room.description else "Trống"
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

        } else {
            var showDeleteDialog by remember { mutableStateOf(false) }
            val scope = rememberCoroutineScope()
            if (showDeleteDialog) {
                AlertDialog(
                    onDismissRequest = { showDeleteDialog = false },
                    title = { Text("Xóa phòng") },
                    text = { Text("Bạn có chắc chắn muốn xóa phòng này không? Các dữ liệu liên quan sẽ bị xóa và không thể hoàn tác.") },
                    confirmButton = {
                        Button(onClick = {
                            showDeleteDialog = false
                            scope.launch {
                                try {
                                    RetrofitInstance.api.deleteRoom(room.id.toInt())
                                    Toast.makeText(context, "Xóa phòng thành công", Toast.LENGTH_SHORT).show()
                                    navController.previousBackStackEntry?.savedStateHandle?.set("refresh", true)
                                    navController.popBackStack()
                                } catch (e: Exception) {
                                    Toast.makeText(context, "Lỗi khi xóa: ${e.message}", Toast.LENGTH_SHORT).show()
                                }
                            }
                        }) { Text("Xóa phòng") }
                    },
                    dismissButton = {
                        TextButton(onClick = { showDeleteDialog = false }) { Text("Hủy") }
                    }
                )
            }

            Text("Thao tác quản lý", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(8.dp))
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Button(
                    onClick = { navController.navigate("create_edit_room/${room.id}") },
                    modifier = Modifier.weight(1f)
                ) {
                    Text("Sửa phòng")
                }

                OutlinedButton(
                    onClick = { showDeleteDialog = true },
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = MaterialTheme.colorScheme.error)
                ) {
                    Text("Xóa phòng")
                }
            }
            
            if (room.status == RoomStatus.AVAILABLE) {
                Button(
                    onClick = { navController.navigate("create_edit_contract/new?roomId=${room.id}") },
                    modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondary)
                ) {
                    Text("Gán khách")
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
    val currentCalendar = java.util.Calendar.getInstance()
    var selectedMonth by remember { mutableStateOf(currentCalendar.get(java.util.Calendar.MONTH) + 1) }
    var selectedYear by remember { mutableStateOf(currentCalendar.get(java.util.Calendar.YEAR)) }
    var selectedDuration by remember { mutableStateOf(6) } // Mặc định 6 tháng
    var depositText by remember { mutableStateOf(roomPrice.toString()) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Thông tin đặt phòng") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                // Month, Year selection
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    var monthExpanded by remember { mutableStateOf(false) }
                    var yearExpanded by remember { mutableStateOf(false) }

                    // Month Picker
                    ExposedDropdownMenuBox(
                        expanded = monthExpanded,
                        onExpandedChange = { monthExpanded = !monthExpanded },
                        modifier = Modifier.weight(1f)
                    ) {
                        OutlinedTextField(
                            value = "Tháng $selectedMonth",
                            onValueChange = {},
                            readOnly = true,
                            label = { Text("Tháng bắt đầu") },
                            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = monthExpanded) },
                            modifier = Modifier.menuAnchor()
                        )
                        ExposedDropdownMenu(expanded = monthExpanded, onDismissRequest = { monthExpanded = false }) {
                            (1..12).forEach { m ->
                                DropdownMenuItem(text = { Text("Tháng $m") }, onClick = { selectedMonth = m; monthExpanded = false })
                            }
                        }
                    }

                    // Year Picker
                    ExposedDropdownMenuBox(
                        expanded = yearExpanded,
                        onExpandedChange = { yearExpanded = !yearExpanded },
                        modifier = Modifier.weight(1f)
                    ) {
                        OutlinedTextField(
                            value = selectedYear.toString(),
                            onValueChange = {},
                            readOnly = true,
                            label = { Text("Năm") },
                            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = yearExpanded) },
                            modifier = Modifier.menuAnchor()
                        )
                        ExposedDropdownMenu(expanded = yearExpanded, onDismissRequest = { yearExpanded = false }) {
                            (currentCalendar.get(java.util.Calendar.YEAR)..currentCalendar.get(java.util.Calendar.YEAR) + 5).forEach { y ->
                                DropdownMenuItem(text = { Text(y.toString()) }, onClick = { selectedYear = y; yearExpanded = false })
                            }
                        }
                    }
                }

                // Duration Picker
                var durationExpanded by remember { mutableStateOf(false) }
                val durations = listOf(1, 3, 6, 12, 18, 24)
                ExposedDropdownMenuBox(
                    expanded = durationExpanded,
                    onExpandedChange = { durationExpanded = !durationExpanded }
                ) {
                    OutlinedTextField(
                        value = "$selectedDuration tháng",
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Thời hạn hợp đồng") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = durationExpanded) },
                        modifier = Modifier.fillMaxWidth().menuAnchor()
                    )
                    ExposedDropdownMenu(expanded = durationExpanded, onDismissRequest = { durationExpanded = false }) {
                        durations.forEach { d ->
                            DropdownMenuItem(text = { Text("$d tháng") }, onClick = { selectedDuration = d; durationExpanded = false })
                        }
                    }
                }

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
                    // Calculate dates
                    val calendar = java.util.Calendar.getInstance()
                    calendar.set(selectedYear, selectedMonth - 1, 1)
                    val df = java.text.SimpleDateFormat("dd-MM-yyyy", java.util.Locale.getDefault())
                    val finalStartDate = df.format(calendar.time)
                    
                    calendar.add(java.util.Calendar.MONTH, selectedDuration)
                    calendar.add(java.util.Calendar.DAY_OF_YEAR, -1)
                    val finalEndDate = df.format(calendar.time)

                    val deposit = depositText.toLongOrNull() ?: 0L
                    onConfirm(finalStartDate, finalEndDate, deposit)
                },
                enabled = !isLoading
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
