package com.nhom55.myapplication.feature.contract

import android.widget.Toast
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
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
import com.nhom55.myapplication.feature.tenant.DetailRow
import com.nhom55.myapplication.feature.room.formatPrice
import com.nhom55.myapplication.core.network.RetrofitInstance
import com.nhom55.myapplication.core.session.SessionManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ContractDetailScreen(
    contractId: String?,
    navController: NavHostController,
    viewModel: ContractViewModel = viewModel()
) {
    var contract by remember { mutableStateOf<Contract?>(null) }
    var isLoading by remember { mutableStateOf(true) }
    var errorMsg by remember { mutableStateOf<String?>(null) }
    var showDeleteDialog by remember { mutableStateOf(false) }
    var showEndDialog by remember { mutableStateOf(false) }
    val context = LocalContext.current
    val isOperating by viewModel.isOperating.collectAsState()
    val currentUser by SessionManager.currentUser.collectAsState()
    val isAdminOrChuTro = currentUser?.role == "ADMIN" || currentUser?.role == "CHU_TRO"

    LaunchedEffect(contractId) {
        if (contractId == null) {
            errorMsg = "ID hợp đồng không hợp lệ"
            isLoading = false
            return@LaunchedEffect
        }
        try {
            val response = withContext(Dispatchers.IO) {
                RetrofitInstance.contractApi.getContractById(contractId.toInt())
            }
            contract = response.toContract()
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
            text = { Text("Bạn có chắc muốn xóa hợp đồng #${contractId}? Phòng sẽ được đặt lại về trạng thái trống.") },
            confirmButton = {
                TextButton(
                    onClick = {
                        showDeleteDialog = false
                        viewModel.deleteContract(
                            id = contractId!!.toInt(),
                            onSuccess = {
                                Toast.makeText(context, "Đã xóa hợp đồng", Toast.LENGTH_SHORT).show()
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

    // End contract dialog
    if (showEndDialog) {
        AlertDialog(
            onDismissRequest = { showEndDialog = false },
            title = { Text("Kết thúc hợp đồng") },
            text = { Text("Bạn có chắc muốn kết thúc hợp đồng này? Phòng sẽ được đặt lại về trạng thái trống.") },
            confirmButton = {
                TextButton(
                    onClick = {
                        showEndDialog = false
                        viewModel.updateContract(
                            id = contractId!!.toInt(),
                            ngayBatDau = null,
                            ngayKetThuc = null,
                            tienCoc = null,
                            trangThai = 0,
                            onSuccess = {
                                Toast.makeText(context, "Đã kết thúc hợp đồng", Toast.LENGTH_SHORT).show()
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
                TextButton(onClick = { showEndDialog = false }) {
                    Text("Hủy")
                }
            }
        )
    }

    Column(modifier = Modifier.fillMaxSize()) {
        // Custom header
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
                text = "Chi tiết hợp đồng",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.weight(1f)
            )
            if (contract != null && isAdminOrChuTro) {
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
                val currentContract = contract
                if (currentContract != null) {
                    Column(
                        modifier = Modifier
                            .padding(16.dp)
                            .fillMaxSize()
                            .verticalScroll(rememberScrollState()),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        Card(modifier = Modifier.fillMaxWidth()) {
                            Column(
                                modifier = Modifier.padding(16.dp),
                                verticalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text(
                                        text = "Hợp đồng #${currentContract.id}",
                                        style = MaterialTheme.typography.titleLarge,
                                        fontWeight = FontWeight.Bold
                                    )
                                    ContractStatusChip(status = currentContract.status)
                                }
                                HorizontalDivider()
                                DetailRow(label = "Phòng", value = currentContract.roomName)
                                DetailRow(label = "Người thuê", value = currentContract.tenantName)
                            }
                        }

                        Card(modifier = Modifier.fillMaxWidth()) {
                            Column(
                                modifier = Modifier.padding(16.dp),
                                verticalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Text(
                                    text = "Chi tiết thỏa thuận",
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold
                                )
                                HorizontalDivider()
                                DetailRow(label = "Ngày bắt đầu", value = currentContract.startDate)
                                DetailRow(label = "Ngày kết thúc", value = currentContract.endDate)
                                DetailRow(
                                    label = "Tiền cọc",
                                    value = formatPrice(currentContract.deposit)
                                )
                            }
                        }

                        // End contract button (only for active contracts, admin/landlord)
                        if (currentContract.status == ContractStatus.ACTIVE && isAdminOrChuTro) {
                            OutlinedButton(
                                onClick = { showEndDialog = true },
                                modifier = Modifier.fillMaxWidth(),
                                colors = ButtonDefaults.outlinedButtonColors(
                                    contentColor = MaterialTheme.colorScheme.error
                                )
                            ) {
                                Text("Kết thúc hợp đồng")
                            }
                        }
                    }
                } else {
                    Text(
                        text = errorMsg ?: "Không tìm thấy thông tin hợp đồng",
                        modifier = Modifier.padding(16.dp).align(Alignment.Center),
                        color = MaterialTheme.colorScheme.error
                    )
                }
            }
        }
    }
}
