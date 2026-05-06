package com.nhom55.myapplication.feature.room

import android.widget.Toast
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavHostController

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LandlordRequestsScreen(
    navController: NavHostController,
    viewModel: YeuCauThueViewModel = viewModel()
) {
    val requestsState by viewModel.requests.collectAsState()
    val actionState by viewModel.actionState.collectAsState()
    val context = LocalContext.current

    LaunchedEffect(Unit) {
        viewModel.getAllRequests()
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

    Column(modifier = Modifier.fillMaxSize()) {
        TopAppBar(
            title = { Text("Quản lý yêu cầu thuê", fontWeight = FontWeight.Bold) },
            navigationIcon = {
                IconButton(onClick = { navController.popBackStack() }) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back")
                }
            }
        )
        
        Box(modifier = Modifier.fillMaxSize()) {
            when (requestsState) {
                is YeuCauThueState.Loading -> CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
                is YeuCauThueState.Error -> {
                    Text((requestsState as YeuCauThueState.Error).message, color = MaterialTheme.colorScheme.error, modifier = Modifier.align(Alignment.Center))
                }
                is YeuCauThueState.Success -> {
                    val requests = (requestsState as YeuCauThueState.Success).data
                    if (requests.isEmpty()) {
                        Text("Không có yêu cầu thuê nào", modifier = Modifier.align(Alignment.Center))
                    } else {
                        LazyColumn(
                            modifier = Modifier.fillMaxSize(),
                            contentPadding = PaddingValues(16.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            items(requests) { request ->
                                LandlordRequestItem(
                                    request = request,
                                    onApprove = { ngayKetThuc, tienCoc -> viewModel.approveRequest(request.id_yeu_cau, ngayKetThuc, tienCoc) },
                                    onReject = { lyDo -> viewModel.rejectRequest(request.id_yeu_cau, lyDo) }
                                )
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
fun LandlordRequestItem(
    request: YeuCauThueData,
    onApprove: (String, Long) -> Unit,
    onReject: (String) -> Unit
) {
    var showApproveDialog by remember { mutableStateOf(false) }
    var showRejectDialog by remember { mutableStateOf(false) }

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
            Text("Người thuê: ${request.NguoiThue?.ho_ten}", fontWeight = FontWeight.Medium)
            Text("SĐT: ${request.NguoiThue?.so_dien_thoai}", style = MaterialTheme.typography.bodyMedium)
            Text("Ngày mong muốn: ${request.ngay_bat_dau_mong_muon}", style = MaterialTheme.typography.bodyMedium)
            
            if (!request.ghi_chu.isNullOrBlank()) {
                Text("Ghi chú: ${request.ghi_chu}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.outline)
            }

            if (request.trang_thai == 0) {
                Spacer(modifier = Modifier.height(12.dp))
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                    TextButton(
                        onClick = { showRejectDialog = true },
                        colors = ButtonDefaults.textButtonColors(contentColor = MaterialTheme.colorScheme.error)
                    ) {
                        Icon(Icons.Default.Close, contentDescription = null)
                        Spacer(Modifier.width(4.dp))
                        Text("Từ chối")
                    }
                    Spacer(Modifier.width(8.dp))
                    Button(
                        onClick = { showApproveDialog = true },
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                    ) {
                        Icon(Icons.Default.Check, contentDescription = null)
                        Spacer(Modifier.width(4.dp))
                        Text("Duyệt")
                    }
                }
            }
        }
    }

    if (showApproveDialog) {
        var ngayKetThuc by remember { mutableStateOf("01-12-2026") }
        var tienCoc by remember { mutableStateOf(request.Phong?.gia_phong?.toLong() ?: 0L) }

        AlertDialog(
            onDismissRequest = { showApproveDialog = false },
            title = { Text("Duyệt yêu cầu thuê") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Thông tin tạo hợp đồng:")
                    OutlinedTextField(
                        value = ngayKetThuc,
                        onValueChange = { ngayKetThuc = it },
                        label = { Text("Ngày kết thúc hợp đồng (DD-MM-YYYY)") },
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = tienCoc.toString(),
                        onValueChange = { tienCoc = it.toLongOrNull() ?: 0L },
                        label = { Text("Tiền cọc (VNĐ)") },
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                Button(onClick = {
                    onApprove(ngayKetThuc, tienCoc)
                    showApproveDialog = false
                }) {
                    Text("Xác nhận & Tạo hợp đồng")
                }
            },
            dismissButton = {
                TextButton(onClick = { showApproveDialog = false }) {
                    Text("Bỏ qua")
                }
            }
        )
    }

    if (showRejectDialog) {
        var lyDo by remember { mutableStateOf("") }

        AlertDialog(
            onDismissRequest = { showRejectDialog = false },
            title = { Text("Từ chối yêu cầu") },
            text = {
                OutlinedTextField(
                    value = lyDo,
                    onValueChange = { lyDo = it },
                    label = { Text("Lý do từ chối") },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 2
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        onReject(lyDo)
                        showRejectDialog = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
                ) {
                    Text("Xác nhận từ chối")
                }
            },
            dismissButton = {
                TextButton(onClick = { showRejectDialog = false }) {
                    Text("Bỏ qua")
                }
            }
        )
    }
}
