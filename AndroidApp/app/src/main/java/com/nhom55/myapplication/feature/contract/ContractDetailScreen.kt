package com.nhom55.myapplication.feature.contract

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.navigation.NavHostController
import com.nhom55.myapplication.feature.tenant.DetailRow
import com.nhom55.myapplication.feature.room.formatPrice
import com.nhom55.myapplication.core.network.RetrofitInstance
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ContractDetailScreen(
    contractId: String?,
    navController: NavHostController
) {
    var contract by remember { mutableStateOf<Contract?>(null) }
    var isLoading by remember { mutableStateOf(true) }
    var errorMsg by remember { mutableStateOf<String?>(null) }

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

    Column(modifier = Modifier.fillMaxSize()) {
        // Custom header
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 4.dp, vertical = 8.dp),
            verticalAlignment = androidx.compose.ui.Alignment.CenterVertically
        ) {
            IconButton(onClick = { navController.navigateUp() }) {
                Icon(Icons.Default.ArrowBack, contentDescription = "Quay lại")
            }
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = "Chi tiết hợp đồng",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
        }

        Box(modifier = Modifier.fillMaxSize()) {
            if (isLoading) {
                CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
            } else {
                val currentContract = contract
                if (currentContract != null) {
                    Column(
                        modifier = Modifier
                            .padding(16.dp)
                            .fillMaxSize(),
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
