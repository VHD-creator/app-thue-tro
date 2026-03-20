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
fun ContractDetailScreen(
    contractId: String?,
    navController: NavHostController,
    viewModel: ContractViewModel = viewModel()
) {
    val contract = viewModel.getContractById(contractId)

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Chi tiết hợp đồng") },
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
            if (contract != null) {
                Column(
                    modifier = Modifier
                        .padding(16.dp)
                        .fillMaxSize(),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    Card(modifier = Modifier.fillMaxWidth()) {
                        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(text = "Hợp đồng #${contract.id}", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                                ContractStatusChip(status = contract.status)
                            }
                            Divider()
                            DetailRow(label = "Mã phòng", value = contract.roomId)
                            DetailRow(label = "Mã người thuê", value = contract.tenantId)
                        }
                    }

                    Card(modifier = Modifier.fillMaxWidth()) {
                        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text(text = "Chi tiết thỏa thuận", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                            Divider()
                            DetailRow(label = "Ngày bắt đầu", value = contract.startDate)
                            DetailRow(label = "Ngày kết thúc", value = contract.endDate)
                            DetailRow(label = "Tiền cọc", value = formatPrice(contract.deposit))
                        }
                    }
                }
            } else {
                Text(
                    text = "Không tìm thấy thông tin hợp đồng",
                    modifier = Modifier.padding(16.dp),
                    color = MaterialTheme.colorScheme.error
                )
            }
        }
    }
}
