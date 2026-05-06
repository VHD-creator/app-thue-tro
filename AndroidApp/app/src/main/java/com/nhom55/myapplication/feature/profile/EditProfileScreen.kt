package com.nhom55.myapplication.feature.profile

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Save
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavHostController
import com.nhom55.myapplication.feature.auth.UpdateProfileRequest

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EditProfileScreen(
    navController: NavHostController,
    viewModel: ProfileViewModel = viewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    
    // Form state
    var hoTen by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var soDienThoai by remember { mutableStateOf("") }
    var diaChi by remember { mutableStateOf("") }
    var cccd by remember { mutableStateOf("") }
    
    var isInitialized by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        viewModel.loadProfile()
    }

    LaunchedEffect(uiState) {
        if (uiState is ProfileUiState.Success && !isInitialized) {
            val user = (uiState as ProfileUiState.Success).user
            val profile = user.profile ?: user.chu_tro ?: user.nguoi_thue
            hoTen = profile?.ho_ten ?: ""
            email = profile?.email ?: ""
            soDienThoai = profile?.so_dien_thoai ?: ""
            diaChi = profile?.dia_chi ?: ""
            cccd = profile?.cccd ?: ""
            isInitialized = true
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Chỉnh sửa hồ sơ") },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Quay lại")
                    }
                }
            )
        },
        floatingActionButton = {
            if (uiState is ProfileUiState.Success) {
                val user = (uiState as ProfileUiState.Success).user
                ExtendedFloatingActionButton(
                    text = { Text("Lưu thay đổi") },
                    icon = { Icon(Icons.Default.Save, contentDescription = null) },
                    onClick = {
                        val request = UpdateProfileRequest(
                            ho_ten = hoTen,
                            email = email,
                            so_dien_thoai = soDienThoai,
                            dia_chi = if (user.vai_tro == "CHU_TRO") diaChi else null,
                            cccd = if (user.vai_tro == "NGUOI_THUE") cccd else null
                        )
                        viewModel.updateProfile(user.vai_tro, request) {
                            navController.popBackStack()
                        }
                    }
                )
            }
        }
    ) { paddingValues ->
        Box(modifier = Modifier.padding(paddingValues)) {
            when (val state = uiState) {
                is ProfileUiState.Loading, ProfileUiState.Idle -> {
                    CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
                }
                is ProfileUiState.Error -> {
                    Text(state.message, color = MaterialTheme.colorScheme.error, modifier = Modifier.align(Alignment.Center))
                }
                is ProfileUiState.Success -> {
                    val user = state.user
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(16.dp)
                            .verticalScroll(rememberScrollState()),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        OutlinedTextField(
                            value = hoTen,
                            onValueChange = { hoTen = it },
                            label = { Text("Họ và tên") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )
                        
                        OutlinedTextField(
                            value = email,
                            onValueChange = { email = it },
                            label = { Text("Email") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )
                        
                        OutlinedTextField(
                            value = soDienThoai,
                            onValueChange = { soDienThoai = it },
                            label = { Text("Số điện thoại") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )
                        
                        if (user.vai_tro == "CHU_TRO") {
                            OutlinedTextField(
                                value = diaChi,
                                onValueChange = { diaChi = it },
                                label = { Text("Địa chỉ") },
                                modifier = Modifier.fillMaxWidth()
                            )
                        }
                        
                        if (user.vai_tro == "NGUOI_THUE") {
                            val hasActiveContract = profile?.DanhSachHopDong?.isNotEmpty() == true
                            Column {
                                OutlinedTextField(
                                    value = cccd,
                                    onValueChange = { if (!hasActiveContract) cccd = it },
                                    label = { Text("CCCD") },
                                    modifier = Modifier.fillMaxWidth(),
                                    singleLine = true,
                                    readOnly = hasActiveContract,
                                    supportingText = { 
                                        if (hasActiveContract) {
                                            Text("Liên hệ chủ trọ nếu bạn cần thay đổi CCCD (đã có hợp đồng)")
                                        } else {
                                            Text("Bạn có thể cập nhật CCCD trước khi thuê phòng")
                                        }
                                    }
                                )
                            }
                        }
                        
                        Spacer(modifier = Modifier.height(80.dp)) // Tránh bị FAB che
                    }
                }
                else -> {}
            }
        }
    }
}
