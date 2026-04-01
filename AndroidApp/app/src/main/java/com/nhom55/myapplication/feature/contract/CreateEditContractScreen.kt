package com.nhom55.myapplication.feature.contract

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
import com.nhom55.myapplication.core.network.RoomApiModel
import com.nhom55.myapplication.feature.tenant.TenantApiModel
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CreateEditContractScreen(
    contractId: String?,
    roomId: String?,
    navController: NavHostController,
    viewModel: ContractViewModel = viewModel()
) {
    val isEditing = contractId != null && contractId != "new"
    val isAssigning = roomId != null && !isEditing
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    var selectedRoom by remember { mutableStateOf<RoomApiModel?>(null) }
    var selectedTenant by remember { mutableStateOf<TenantApiModel?>(null) }
    val currentCalendar = java.util.Calendar.getInstance()
    var selectedMonth by remember { mutableStateOf(currentCalendar.get(java.util.Calendar.MONTH) + 1) }
    var selectedYear by remember { mutableStateOf(currentCalendar.get(java.util.Calendar.YEAR)) }
    var selectedDuration by remember { mutableStateOf(6) } // Mặc định 6 tháng
    var deposit by remember { mutableStateOf("") }

    var rooms by remember { mutableStateOf<List<RoomApiModel>>(emptyList()) }
    var tenants by remember { mutableStateOf<List<TenantApiModel>>(emptyList()) }
    
    var isLoading by remember { mutableStateOf(true) }
    var isOperating by remember { mutableStateOf(false) }

    var roomExpanded by remember { mutableStateOf(false) }
    var tenantExpanded by remember { mutableStateOf(false) }

    LaunchedEffect(contractId, roomId) {
        isLoading = true
        try {
            // Load necessary lists
            val roomsList = withContext(Dispatchers.IO) { RetrofitInstance.api.getRooms() }
            val tenantsList = withContext(Dispatchers.IO) { RetrofitInstance.tenantApi.getTenants() }
            
            rooms = roomsList
            tenants = tenantsList

            if (isEditing) {
                val contractApi = withContext(Dispatchers.IO) {
                    RetrofitInstance.contractApi.getContractById(contractId!!.toInt())
                }
                selectedRoom = roomsList.find { it.id_phong == contractApi.id_phong }
                selectedTenant = tenantsList.find { it.id_nguoi_thue == contractApi.id_nguoi_thue }
                
                // Parse existing dates if needed, but for simplicity we'll keep current defaults or try to match
                val df = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.getDefault())
                try {
                    val date = df.parse(contractApi.ngay_bat_dau)
                    val cal = java.util.Calendar.getInstance()
                    if (date != null) {
                        cal.time = date
                        selectedMonth = cal.get(java.util.Calendar.MONTH) + 1
                        selectedYear = cal.get(java.util.Calendar.YEAR)
                    }
                } catch (e: Exception) {}
                
                deposit = contractApi.tien_coc.toString()
            } else if (isAssigning) {
                selectedRoom = roomsList.find { it.id_phong.toString() == roomId }
                if (selectedRoom != null) {
                    deposit = selectedRoom!!.gia_phong.toString()
                }
            }
        } catch (e: Exception) {
            Toast.makeText(context, "Lỗi tải dữ liệu: ${e.message}", Toast.LENGTH_SHORT).show()
        } finally {
            isLoading = false
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = when {
                            isEditing -> "Chỉnh sửa hợp đồng"
                            isAssigning -> "Gán khách cho phòng"
                            else -> "Tạo hợp đồng mới"
                        }
                    )
                },
                navigationIcon = {
                    IconButton(onClick = { navController.navigateUp() }) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Quay lại")
                    }
                }
            )
        }
    ) { paddingValues ->
        if (isLoading) {
            Box(modifier = Modifier.fillMaxSize().padding(paddingValues), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
        } else {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
                    .padding(16.dp)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Room Selection
                ExposedDropdownMenuBox(
                    expanded = roomExpanded && !isEditing && !isAssigning,
                    onExpandedChange = { if (!isEditing && !isAssigning) roomExpanded = !roomExpanded }
                ) {
                    OutlinedTextField(
                        value = selectedRoom?.ten_phong ?: "Chọn phòng",
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Phòng") },
                        trailingIcon = { if (!isEditing && !isAssigning) ExposedDropdownMenuDefaults.TrailingIcon(expanded = roomExpanded) },
                        modifier = Modifier.fillMaxWidth().menuAnchor(),
                        enabled = !isEditing && !isAssigning
                    )
                    ExposedDropdownMenu(
                        expanded = roomExpanded,
                        onDismissRequest = { roomExpanded = false }
                    ) {
                        rooms.filter { it.trang_thai == "0" || it.id_phong == selectedRoom?.id_phong }.forEach { room ->
                            DropdownMenuItem(
                                text = { Text(room.ten_phong) },
                                onClick = {
                                    selectedRoom = room
                                    deposit = room.gia_phong.toString()
                                    roomExpanded = false
                                }
                            )
                        }
                    }
                }

                // Tenant Selection
                ExposedDropdownMenuBox(
                    expanded = tenantExpanded && !isEditing,
                    onExpandedChange = { if (!isEditing) tenantExpanded = !tenantExpanded }
                ) {
                    OutlinedTextField(
                        value = selectedTenant?.ho_ten ?: "Chọn khách thuê",
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Khách thuê") },
                        trailingIcon = { if (!isEditing) ExposedDropdownMenuDefaults.TrailingIcon(expanded = tenantExpanded) },
                        modifier = Modifier.fillMaxWidth().menuAnchor(),
                        enabled = !isEditing
                    )
                    ExposedDropdownMenu(
                        expanded = tenantExpanded,
                        onDismissRequest = { tenantExpanded = false }
                    ) {
                        tenants.forEach { tenant ->
                            DropdownMenuItem(
                                text = { Text(tenant.ho_ten) },
                                onClick = {
                                    selectedTenant = tenant
                                    tenantExpanded = false
                                }
                            )
                        }
                    }
                }

                // Month, Year and Duration Selection
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    var monthExpanded by remember { mutableStateOf(false) }
                    var yearExpanded by remember { mutableStateOf(false) }

                    // Month Picker
                    ExposedDropdownMenuBox(
                        expanded = monthExpanded,
                        onExpandedChange = { monthExpanded = !monthExpanded },
                        modifier = Modifier.weight(1f)
                    ) {
                        OutlinedTextField(
                            value = "Tháng $selectedMonth",
                            onValueChange = {},
                            readOnly = true,
                            label = { Text("Tháng bắt đầu") },
                            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = monthExpanded) },
                            modifier = Modifier.menuAnchor()
                        )
                        ExposedDropdownMenu(expanded = monthExpanded, onDismissRequest = { monthExpanded = false }) {
                            (1..12).forEach { m ->
                                DropdownMenuItem(text = { Text("Tháng $m") }, onClick = { selectedMonth = m; monthExpanded = false })
                            }
                        }
                    }

                    // Year Picker
                    ExposedDropdownMenuBox(
                        expanded = yearExpanded,
                        onExpandedChange = { yearExpanded = !yearExpanded },
                        modifier = Modifier.weight(1f)
                    ) {
                        OutlinedTextField(
                            value = selectedYear.toString(),
                            onValueChange = {},
                            readOnly = true,
                            label = { Text("Năm") },
                            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = yearExpanded) },
                            modifier = Modifier.menuAnchor()
                        )
                        ExposedDropdownMenu(expanded = yearExpanded, onDismissRequest = { yearExpanded = false }) {
                            (currentCalendar.get(java.util.Calendar.YEAR)..currentCalendar.get(java.util.Calendar.YEAR) + 5).forEach { y ->
                                DropdownMenuItem(text = { Text(y.toString()) }, onClick = { selectedYear = y; yearExpanded = false })
                            }
                        }
                    }
                }

                // Duration Picker
                var durationExpanded by remember { mutableStateOf(false) }
                val durations = listOf(1, 3, 6, 12, 18, 24)
                ExposedDropdownMenuBox(
                    expanded = durationExpanded,
                    onExpandedChange = { durationExpanded = !durationExpanded }
                ) {
                    OutlinedTextField(
                        value = "$selectedDuration tháng",
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Thời hạn hợp đồng") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = durationExpanded) },
                        modifier = Modifier.fillMaxWidth().menuAnchor()
                    )
                    ExposedDropdownMenu(expanded = durationExpanded, onDismissRequest = { durationExpanded = false }) {
                        durations.forEach { d ->
                            DropdownMenuItem(text = { Text("$d tháng") }, onClick = { selectedDuration = d; durationExpanded = false })
                        }
                    }
                }

                OutlinedTextField(
                    value = deposit,
                    onValueChange = { deposit = it },
                    label = { Text("Tiền cọc") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
                )

                Spacer(modifier = Modifier.height(24.dp))

                Button(
                    onClick = {
                        if (selectedRoom == null || selectedTenant == null) {
                            Toast.makeText(context, "Vui lòng chọn phòng và khách thuê", Toast.LENGTH_SHORT).show()
                            return@Button
                        }

                        // Calculate final dates
                        val calendar = java.util.Calendar.getInstance()
                        calendar.set(selectedYear, selectedMonth - 1, 1)
                        val df = java.text.SimpleDateFormat("dd-MM-yyyy", java.util.Locale.getDefault())
                        val finalStartDate = df.format(calendar.time)
                        
                        calendar.add(java.util.Calendar.MONTH, selectedDuration)
                        calendar.add(java.util.Calendar.DAY_OF_YEAR, -1)
                        val finalEndDate = df.format(calendar.time)

                        isOperating = true
                        scope.launch {
                            try {
                                if (isEditing) {
                                    viewModel.updateContract(
                                        id = contractId!!.toInt(),
                                        ngayBatDau = finalStartDate,
                                        ngayKetThuc = finalEndDate,
                                        tienCoc = deposit.toLongOrNull(),
                                        trangThai = 1,
                                        onSuccess = {
                                            Toast.makeText(context, "Cập nhật thành công", Toast.LENGTH_SHORT).show()
                                            navController.navigateUp()
                                        },
                                        onError = { msg ->
                                            Toast.makeText(context, msg, Toast.LENGTH_SHORT).show()
                                            isOperating = false
                                        }
                                    )
                                } else {
                                    viewModel.createContract(
                                        roomId = selectedRoom!!.id_phong,
                                        tenantId = selectedTenant!!.id_nguoi_thue,
                                        startDate = finalStartDate,
                                        endDate = finalEndDate,
                                        deposit = deposit.toLongOrNull() ?: 0L
                                    )
                                }
                            } catch (e: Exception) {
                                Toast.makeText(context, "Lỗi: ${e.message}", Toast.LENGTH_SHORT).show()
                                isOperating = false
                            }
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = !isOperating
                ) {
                    if (isOperating) {
                        CircularProgressIndicator(modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                        Spacer(modifier = Modifier.width(8.dp))
                    }
                    Text(if (isEditing) "Cập nhật" else "Lưu hợp đồng")
                }
            }
        }
    }

    // Monitor ViewModel's create state if not editing
    if (!isEditing) {
        val createUiState by viewModel.createUiState.collectAsState()
        LaunchedEffect(createUiState) {
            if (createUiState is CreateContractUiState.Success) {
                Toast.makeText(context, "Tạo hợp đồng thành công", Toast.LENGTH_SHORT).show()
                navController.navigateUp()
                viewModel.resetCreateState()
            } else if (createUiState is CreateContractUiState.Error) {
                Toast.makeText(context, (createUiState as CreateContractUiState.Error).message, Toast.LENGTH_SHORT).show()
                viewModel.resetCreateState()
                isOperating = false
            }
        }
    }
}
