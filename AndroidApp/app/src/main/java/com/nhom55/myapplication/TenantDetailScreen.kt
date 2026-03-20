package com.nhom55.myapplication

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavHostController

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TenantDetailScreen(
    tenantId: String?,
    navController: NavHostController,
    viewModel: TenantViewModel = viewModel()
) {
    val tenant = viewModel.getTenantById(tenantId)

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Chi tiết khách thuê") },
                navigationIcon = {
                    IconButton(onClick = { navController.navigateUp() }) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Quay lại")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                    titleContentColor = MaterialTheme.colorScheme.onPrimary,
                    navigationIconContentColor = MaterialTheme.colorScheme.onPrimary
                )
            )
        }
    ) { paddingValues ->
        Box(modifier = Modifier.padding(paddingValues).fillMaxSize()) {
            if (tenant != null) {
                Column(
                    modifier = Modifier
                        .padding(16.dp)
                        .fillMaxSize(),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    Card(modifier = Modifier.fillMaxWidth()) {
                        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text(text = "Thông tin cá nhân", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                            Divider()
                            DetailRow(label = "Họ và tên", value = tenant.name)
                            DetailRow(label = "Căn cước công dân", value = tenant.identityCard)
                            DetailRow(label = "Số điện thoại", value = tenant.phone)
                            DetailRow(label = "Email", value = tenant.email)
                        }
                    }

                    Card(modifier = Modifier.fillMaxWidth()) {
                        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text(text = "Thông tin thuê", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                            Divider()
                            DetailRow(label = "Ngày chuyển vào", value = tenant.moveInDate)
                            DetailRow(label = "Ngày dự kiến chuyển ra", value = tenant.moveOutDate ?: "Chưa xác định")
                        }
                    }
                }
            } else {
                Text(
                    text = "Không tìm thấy thông tin khách thuê",
                    modifier = Modifier.padding(16.dp),
                    color = MaterialTheme.colorScheme.error
                )
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
