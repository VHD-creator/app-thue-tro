package com.nhom55.myapplication.feature.tenant

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
import com.nhom55.myapplication.core.network.RetrofitInstance
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TenantDetailScreen(
    tenantId: String?,
    navController: NavHostController,
    viewModel: TenantViewModel = viewModel()
) {
    var tenant by remember { mutableStateOf<Tenant?>(null) }
    var isLoading by remember { mutableStateOf(true) }
    var errorMsg by remember { mutableStateOf<String?>(null) }
    var showDeleteDialog by remember { mutableStateOf(false) }
    val context = LocalContext.current
    val isOperating by viewModel.isOperating.collectAsState()

    LaunchedEffect(tenantId) {
        if (tenantId == null) {
            errorMsg = "ID khách thuê không hợp lệ"
            isLoading = false
            return@LaunchedEffect
        }
        try {
            val response = withContext(Dispatchers.IO) {
                RetrofitInstance.tenantApi.getTenantById(tenantId.toInt())
            }
            tenant = response.toTenant()
        } catch (e: Exception) {
            errorMsg = e.message ?: "Lỗi khi tải dữ liệu"
        } finally {
            isLoading = false
        }
    }

    // Delete confirmation dialog
    if (showDeleteDialog) {
        AlertDialog(
            onDismissRequest = { showDeleteDialog = false },
            title = { Text("Xác nhận xóa") },
            text = { Text("Bạn có chắc muốn xóa khách thuê \"${tenant?.name}\"? Hành động này không thể hoàn tác.") },
            confirmButton = {
                TextButton(
                    onClick = {
                        showDeleteDialog = false
                        viewModel.deleteTenant(
                            id = tenantId!!.toInt(),
                            onSuccess = {
                                Toast.makeText(context, "Đã xóa khách thuê", Toast.LENGTH_SHORT).show()
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

    Column(modifier = Modifier.fillMaxSize()) {
        // Custom header with edit/delete actions
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
                text = "Chi tiết khách thuê",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.weight(1f)
            )
            if (tenant != null) {
                IconButton(onClick = {
                    navController.navigate("create_edit_tenant/${tenantId}")
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
                val currentTenant = tenant
                if (currentTenant != null) {
                    Column(
                        modifier = Modifier
                            .padding(16.dp)
                            .fillMaxSize()
                            .verticalScroll(rememberScrollState()),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        Card(modifier = Modifier.fillMaxWidth()) {
                            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                Text(text = "Thông tin cá nhân", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                                HorizontalDivider()
                                DetailRow(label = "Họ và tên", value = currentTenant.name)
                                DetailRow(label = "Căn cước công dân", value = currentTenant.identityCard ?: "Chưa cập nhật")
                                DetailRow(label = "Số điện thoại", value = currentTenant.phone ?: "Chưa cập nhật")
                                DetailRow(label = "Email", value = currentTenant.email ?: "Chưa cập nhật")
                            }
                        }

                        Card(modifier = Modifier.fillMaxWidth()) {
                            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                Text(text = "Thông tin thuê", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                                HorizontalDivider()
                                DetailRow(label = "Ngày chuyển vào", value = currentTenant.moveInDate ?: "Chưa thuê phòng")
                                DetailRow(label = "Ngày dự kiến chuyển ra", value = currentTenant.moveOutDate ?: "Chưa xác định")
                            }
                        }
                    }
                } else {
                    Text(
                        text = errorMsg ?: "Không tìm thấy thông tin khách thuê",
                        modifier = Modifier.padding(16.dp).align(Alignment.Center),
                        color = MaterialTheme.colorScheme.error
                    )
                }
            }
        }
    }
}

@Composable
fun DetailRow(label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(text = label, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Text(text = value, fontWeight = FontWeight.Medium)
    }
}
