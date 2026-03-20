package com.nhom55.myapplication

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavHostController

// Data class cho Room - Thêm description
data class Room(
    val id: String,
    val name: String,
    val floor: Int,
    val price: Long,
    val status: RoomStatus,
    val tenantName: String? = null,
    val area: Float, // m²
    val description: String? = "Không có mô tả"
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
                val filteredRooms = viewModel.getFilteredRooms(state.rooms)

                // Filter chips
                Row(
                    modifier = Modifier.fillMaxWidth().padding(16.dp),
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
                    contentPadding = PaddingValues(16.dp),
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
        RoomStatus.OCCUPIED -> Triple(MaterialTheme.colorScheme.secondaryContainer, MaterialTheme.colorScheme.onSecondaryContainer, "Đang thuê")
        RoomStatus.MAINTENANCE -> Triple(MaterialTheme.colorScheme.errorContainer, MaterialTheme.colorScheme.onErrorContainer, "Sửa chữa")
    }
    Surface(color = containerColor, shape = MaterialTheme.shapes.small) {
        Text(text = text, modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp), style = MaterialTheme.typography.labelSmall, color = contentColor)
    }
}

fun formatPrice(price: Long): String {
    return java.text.NumberFormat.getNumberInstance(java.util.Locale("vi", "VN")).format(price) + "đ"
}
