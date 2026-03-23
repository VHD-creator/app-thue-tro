package com.nhom55.myapplication.feature.room

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Person
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavHostController
import com.nhom55.myapplication.core.session.SessionManager
import androidx.compose.material.icons.filled.Add
import java.text.NumberFormat
import java.util.Locale

// Data class cho Room - Thêm description
data class Room(
    val id: String,
    val name: String,
    val floor: Int,
    val price: Long,
    val status: RoomStatus,
    val description: String? = "Không có mô tả",
    val address: String = "Chưa cập nhật địa chỉ",
    val landlordName: String = "Chủ trọ",
    val images: List<HinhAnhPhong> = emptyList() // Thêm ds ảnh, mặc định empty
)

data class HinhAnhPhong(
    val id: Int,
    val url: String,
    val type: String,
    val isAvatar: Boolean,
    val order: Int,
    val description: String?
)

enum class RoomStatus {
    AVAILABLE, // Còn trống
    OCCUPIED,  // Đang thuê
    MAINTENANCE // Đang sửa chữa
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RoomListScreen(
    navController: NavHostController,
    viewModel: RoomViewModel = viewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val selectedFilter by viewModel.selectedFilter.collectAsState()
    var selectedAddress by rememberSaveable { mutableStateOf<String?>(null) }
    
    LaunchedEffect(Unit) {
        viewModel.loadRooms()
    }

    val currentUser by SessionManager.currentUser.collectAsState()
    val isAdminOrChuTro = currentUser?.role == "ADMIN" || currentUser?.role == "CHU_TRO"

    Box(modifier = Modifier.fillMaxSize()) {
        Column(
            modifier = Modifier.fillMaxSize()
        ) {
        when (val state = uiState) {
            is RoomUiState.Loading -> {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            }

            is RoomUiState.Error -> {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        Text(text = state.message, color = MaterialTheme.colorScheme.error)
                        Button(onClick = { viewModel.loadRooms() }) { Text("Thử lại") }
                    }
                }
            }

            is RoomUiState.Success -> {
                val allRooms = state.rooms

                if (currentUser?.role == "CHU_TRO") {
                    val filteredRooms = viewModel.getFilteredRooms(allRooms)

                    Text(
                        text = "Danh sách phòng",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(16.dp)
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp).padding(bottom = 8.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        FilterChip(
                            selected = selectedFilter == null,
                            onClick = { viewModel.setFilter(null) },
                            label = { Text("Tất cả") }
                        )
                        FilterChip(
                            selected = selectedFilter == RoomStatus.AVAILABLE,
                            onClick = { viewModel.setFilter(RoomStatus.AVAILABLE) },
                            label = { Text("Còn trống") }
                        )
                    }

                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        items(filteredRooms) { room ->
                            RoomCard(room = room, onClick = { navController.navigate("room_detail/${room.id}") })
                        }
                    }
                } else {
                    if (selectedAddress == null) {
                        val groupedRooms = allRooms.groupBy { it.address }
                        
                        Text(
                            text = "Danh sách khu trọ",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(16.dp)
                        )
                        
                        LazyColumn(
                            modifier = Modifier.fillMaxSize(),
                            contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                            verticalArrangement = Arrangement.spacedBy(16.dp)
                        ) {
                            items(groupedRooms.keys.toList()) { address ->
                                val roomsInAddress = groupedRooms[address] ?: emptyList()
                                val landlordName = roomsInAddress.firstOrNull()?.landlordName ?: "Chủ trọ"
                                val availableCount = roomsInAddress.count { it.status == RoomStatus.AVAILABLE }
                                
                                LocationCard(
                                    address = address,
                                    landlordName = landlordName,
                                    totalRooms = roomsInAddress.size,
                                    availableRooms = availableCount,
                                    onClick = { selectedAddress = address }
                                )
                            }
                        }
                    } else {
                        val filteredRooms = viewModel.getFilteredRooms(allRooms.filter { it.address == selectedAddress })

                        Row(
                            modifier = Modifier.fillMaxWidth().padding(horizontal = 4.dp, vertical = 8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            IconButton(onClick = { selectedAddress = null }) {
                                Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Quay lại")
                            }
                            Spacer(modifier = Modifier.width(8.dp))
                            Column {
                                Text("Khu trọ", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.primary)
                                Text(selectedAddress!!, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, maxLines = 1)
                            }
                        }

                        Row(
                            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            FilterChip(
                                selected = selectedFilter == null,
                                onClick = { viewModel.setFilter(null) },
                                label = { Text("Tất cả") }
                            )
                            FilterChip(
                                selected = selectedFilter == RoomStatus.AVAILABLE,
                                onClick = { viewModel.setFilter(RoomStatus.AVAILABLE) },
                                label = { Text("Còn trống") }
                            )
                        }

                        LazyColumn(
                            modifier = Modifier.fillMaxSize(),
                            contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            items(filteredRooms) { room ->
                                RoomCard(room = room, onClick = { navController.navigate("room_detail/${room.id}") })
                            }
                        }
                    }
                }
            }
        }
        // Đóng ngoặc cho Column
        }

        if (isAdminOrChuTro) {
            FloatingActionButton(
                onClick = { navController.navigate("create_edit_room/new") },
                modifier = Modifier
                    .align(Alignment.BottomEnd)
                    .padding(16.dp),
                containerColor = MaterialTheme.colorScheme.primary,
                contentColor = MaterialTheme.colorScheme.onPrimary
            ) {
                Icon(Icons.Default.Add, contentDescription = "Thêm phòng mới")
            }
        }
    }
}

@Composable
fun RoomCard(room: Room, onClick: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth().clickable(onClick = onClick),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(text = room.name, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                StatusChip(status = room.status)
            }
            Text(
                text = "${formatPrice(room.price)}/tháng",
                color = MaterialTheme.colorScheme.primary,
                style = MaterialTheme.typography.titleSmall
            )
        }
    }
}

@Composable
fun StatusChip(status: RoomStatus) {
    val (containerColor, contentColor, text) = when (status) {
        RoomStatus.AVAILABLE -> Triple(MaterialTheme.colorScheme.primaryContainer, MaterialTheme.colorScheme.onPrimaryContainer, "Còn trống")
        RoomStatus.OCCUPIED -> Triple(MaterialTheme.colorScheme.error, MaterialTheme.colorScheme.errorContainer, "Đang thuê")
        RoomStatus.MAINTENANCE -> Triple(MaterialTheme.colorScheme.errorContainer, MaterialTheme.colorScheme.onErrorContainer, "Sửa chữa")
    }
    Surface(color = containerColor, shape = MaterialTheme.shapes.small) {
        Text(text = text, modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp), style = MaterialTheme.typography.labelSmall, color = contentColor)
    }
}

fun formatPrice(price: Long): String {
    return NumberFormat.getNumberInstance(Locale("vi", "VN")).format(price) + "đ"
}

@Composable
fun LocationCard(
    address: String,
    landlordName: String,
    totalRooms: Int,
    availableRooms: Int,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth().clickable(onClick = onClick),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.LocationOn, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = address, 
                    style = MaterialTheme.typography.titleMedium, 
                    fontWeight = FontWeight.Bold
                )
            }
            
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.Person, contentDescription = null, tint = MaterialTheme.colorScheme.secondary, modifier = Modifier.size(20.dp))
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "Chủ trọ: $landlordName", 
                    style = MaterialTheme.typography.bodyMedium
                )
            }
            
            HorizontalDivider(modifier = Modifier.padding(vertical = 4.dp))
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text("Tổng số phòng: $totalRooms", style = MaterialTheme.typography.bodyMedium)
                Text(
                    "Còn trống: $availableRooms", 
                    style = MaterialTheme.typography.bodyMedium,
                    color = if (availableRooms > 0) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.error
                )
            }
        }
    }
}
