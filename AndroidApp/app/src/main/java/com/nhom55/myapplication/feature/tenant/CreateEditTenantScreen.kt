package com.nhom55.myapplication.feature.tenant

import android.widget.Toast
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavHostController
import com.nhom55.myapplication.core.network.RetrofitInstance
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CreateEditTenantScreen(
    tenantId: String?,
    navController: NavHostController,
    viewModel: TenantViewModel = viewModel()
) {
    val isEditing = tenantId != null && tenantId != "new"
    val context = LocalContext.current

    var hoTen by remember { mutableStateOf("") }
    var cccd by remember { mutableStateOf("") }
    var soDienThoai by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(isEditing) }
    val isOperating by viewModel.isOperating.collectAsState()

    // Load existing tenant data if editing
    LaunchedEffect(tenantId) {
        if (isEditing) {
            try {
                val response = withContext(Dispatchers.IO) {
                    RetrofitInstance.tenantApi.getTenantById(tenantId!!.toInt())
                }
                hoTen = response.ho_ten
                cccd = response.cccd ?: ""
                soDienThoai = response.so_dien_thoai ?: ""
                email = response.email ?: ""
            } catch (e: Exception) {
                Toast.makeText(context, "Lỗi khi tải dữ liệu: ${e.message}", Toast.LENGTH_SHORT).show()
            } finally {
                isLoading = false
            }
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
                text = if (isEditing) "Chỉnh sửa khách thuê" else "Thêm khách thuê mới",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
        }

        if (isLoading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
        } else {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                OutlinedTextField(
                    value = hoTen,
                    onValueChange = { hoTen = it },
                    label = { Text("Họ và tên *") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )

                OutlinedTextField(
                    value = cccd,
                    onValueChange = { cccd = it },
                    label = { Text("Căn cước công dân (CCCD) *") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
                )

                OutlinedTextField(
                    value = soDienThoai,
                    onValueChange = { soDienThoai = it },
                    label = { Text("Số điện thoại") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone)
                )

                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = { Text("Email") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email)
                )

                Spacer(modifier = Modifier.height(8.dp))

                Button(
                    onClick = {
                        if (hoTen.isBlank() || cccd.isBlank()) {
                            Toast.makeText(context, "Vui lòng nhập họ tên và CCCD", Toast.LENGTH_SHORT).show()
                            return@Button
                        }

                        if (isEditing) {
                            viewModel.updateTenant(
                                id = tenantId!!.toInt(),
                                hoTen = hoTen.trim(),
                                cccd = cccd.trim(),
                                soDienThoai = soDienThoai.trim().ifBlank { null },
                                email = email.trim().ifBlank { null },
                                onSuccess = {
                                    Toast.makeText(context, "Cập nhật thành công", Toast.LENGTH_SHORT).show()
                                    navController.navigateUp()
                                },
                                onError = { msg ->
                                    Toast.makeText(context, msg, Toast.LENGTH_SHORT).show()
                                }
                            )
                        } else {
                            viewModel.createTenant(
                                hoTen = hoTen.trim(),
                                cccd = cccd.trim(),
                                soDienThoai = soDienThoai.trim().ifBlank { null },
                                email = email.trim().ifBlank { null },
                                onSuccess = {
                                    Toast.makeText(context, "Thêm khách thuê thành công", Toast.LENGTH_SHORT).show()
                                    navController.navigateUp()
                                },
                                onError = { msg ->
                                    Toast.makeText(context, msg, Toast.LENGTH_SHORT).show()
                                }
                            )
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = !isOperating
                ) {
                    if (isOperating) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(20.dp),
                            strokeWidth = 2.dp,
                            color = MaterialTheme.colorScheme.onPrimary
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                    }
                    Text(if (isEditing) "Cập nhật" else "Thêm mới")
                }
            }
        }
    }
}
