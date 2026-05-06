package com.nhom55.myapplication.feature.room

import android.widget.Toast
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavHostController

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MyRequestsScreen(
    navController: NavHostController,
    viewModel: YeuCauThueViewModel = viewModel()
) {
    val requestsState by viewModel.requests.collectAsState()
    val actionState by viewModel.actionState.collectAsState()
    val context = LocalContext.current

    LaunchedEffect(Unit) {
        viewModel.getMyRequests()
    }

    LaunchedEffect(actionState) {
        if (actionState is YeuCauThueState.Success) {
            Toast.makeText(context, (actionState as YeuCauThueState.Success).data, Toast.LENGTH_SHORT).show()
            viewModel.resetActionState()
        } else if (actionState is YeuCauThueState.Error) {
            Toast.makeText(context, (actionState as YeuCauThueState.Error).message, Toast.LENGTH_SHORT).show()
            viewModel.resetActionState()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Yêu cầu thuê của tôi", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back")
                    }
                }
            )
        }
    ) { padding ->
        Box(modifier = Modifier.fillMaxSize().padding(padding)) {
            when (requestsState) {
                is YeuCauThueState.Loading -> CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
                is YeuCauThueState.Error -> {
                    Text(
                        (requestsState as YeuCauThueState.Error).message,
                        color = MaterialTheme.colorScheme.error,
                        modifier = Modifier.align(Alignment.Center)
                    )
                }
                is YeuCauThueState.Success -> {
                    val requests = (requestsState as YeuCauThueState.Success).data
                    if (requests.isEmpty()) {
                        Text("Bạn chưa có yêu cầu thuê nào", modifier = Modifier.align(Alignment.Center))
                    } else {
                        LazyColumn(
                            modifier = Modifier.fillMaxSize(),
                            contentPadding = PaddingValues(16.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            items(requests) { request ->
                                RequestItem(request, onCancel = { viewModel.cancelRequest(request.id_yeu_cau) })
                            }
                        }
                    }
                }
                else -> {}
            }
        }
    }
}

@Composable
fun RequestItem(request: YeuCauThueData, onCancel: () -> Unit) {
    var showConfirmDialog by remember { mutableStateOf(false) }

    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(request.Phong?.ten_phong ?: "Phòng không tên", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                StatusBadge(request.trang_thai)
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            Text("Giá phòng: ${String.format("%,.0f", request.Phong?.gia_phong ?: 0.0)} VNĐ/tháng", style = MaterialTheme.typography.bodyMedium)
            Text("Ngày mong muốn: ${request.ngay_bat_dau_mong_muon}", style = MaterialTheme.typography.bodyMedium)
            
            if (!request.ghi_chu.isNullOrBlank()) {
                Text("Ghi chú: ${request.ghi_chu}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.outline)
            }

            if (request.trang_thai == 2 && !request.ly_do_tu_choi.isNullOrBlank()) {
                Spacer(modifier = Modifier.height(8.dp))
                Surface(color = MaterialTheme.colorScheme.errorContainer, shape = MaterialTheme.shapes.small) {
                    Text("Lý do từ chối: ${request.ly_do_tu_choi}", modifier = Modifier.padding(8.dp), style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onErrorContainer)
                }
            }

            if (request.trang_thai == 0) {
                Spacer(modifier = Modifier.height(12.dp))
                OutlinedButton(
                    onClick = { showConfirmDialog = true },
                    modifier = Modifier.align(Alignment.End),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = MaterialTheme.colorScheme.error)
                ) {
                    Text("Hủy yêu cầu")
                }
            }
        }
    }

    if (showConfirmDialog) {
        AlertDialog(
            onDismissRequest = { showConfirmDialog = false },
            title = { Text("Xác nhận hủy") },
            text = { Text("Bạn có chắc chắn muốn hủy yêu cầu thuê phòng này không?") },
            confirmButton = {
                TextButton(onClick = {
                    onCancel()
                    showConfirmDialog = false
                }) {
                    Text("Đồng ý", color = MaterialTheme.colorScheme.error)
                }
            },
            dismissButton = {
                TextButton(onClick = { showConfirmDialog = false }) {
                    Text("Bỏ qua")
                }
            }
        )
    }
}

@Composable
fun StatusBadge(status: Int) {
    val (text, color) = when (status) {
        0 -> "Đang chờ" to Color(0xFFFFA500)
        1 -> "Đã duyệt" to Color(0xFF4CAF50)
        2 -> "Từ chối/Hủy" to Color(0xFFF44336)
        else -> "Không xác định" to Color.Gray
    }

    Surface(
        color = color.copy(alpha = 0.1f),
        shape = MaterialTheme.shapes.small,
        border = androidx.compose.foundation.BorderStroke(1.dp, color)
    ) {
        Text(
            text = text,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp),
            style = MaterialTheme.typography.labelSmall,
            color = color
        )
    }
}
