package com.nhom55.myapplication.feature.profile

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavHostController

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileScreen(
    navController: NavHostController,
    viewModel: ProfileViewModel = viewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    var showPasswordDialog by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        viewModel.loadProfile()
    }

    Column(modifier = Modifier.fillMaxSize()) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 4.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = { navController.popBackStack() }) {
                Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Quay lại")
            }
            Spacer(modifier = Modifier.width(8.dp))
            Text("Hồ sơ cá nhân", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        }

        Box(modifier = Modifier.weight(1f)) {
            when (val state = uiState) {
                is ProfileUiState.Loading, ProfileUiState.Idle -> {
                    CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
                }
                is ProfileUiState.Error -> {
                    Column(
                        modifier = Modifier.align(Alignment.Center),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(state.message, color = MaterialTheme.colorScheme.error)
                        Spacer(modifier = Modifier.height(8.dp))
                        Button(onClick = { viewModel.loadProfile() }) {
                            Text("Thử lại")
                        }
                    }
                }
                is ProfileUiState.Success -> {
                    val user = state.user
                    val profile = user.profile ?: user.chu_tro ?: user.nguoi_thue
                    val name = profile?.ho_ten ?: user.ten_dang_nhap
                    
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(16.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        // Avatar Placeholder
                        Box(
                            modifier = Modifier
                                .size(100.dp)
                                .clip(CircleShape)
                                .background(MaterialTheme.colorScheme.primaryContainer),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = name.take(1).uppercase(),
                                style = MaterialTheme.typography.displayLarge,
                                color = MaterialTheme.colorScheme.onPrimaryContainer
                            )
                        }
                        
                        Spacer(modifier = Modifier.height(16.dp))
                        
                        Text(
                            text = name,
                            style = MaterialTheme.typography.headlineMedium,
                            fontWeight = FontWeight.Bold
                        )
                        
                        Text(
                            text = if (user.vai_tro == "CHU_TRO") "Chủ Trọ" else if (user.vai_tro == "ADMIN") "Admin" else "Khách Thuê",
                            style = MaterialTheme.typography.titleMedium,
                            color = MaterialTheme.colorScheme.primary
                        )

                        Spacer(modifier = Modifier.height(32.dp))
                        
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                        ) {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(16.dp),
                                verticalArrangement = Arrangement.spacedBy(16.dp)
                            ) {
                                Text("Thông tin liên hệ", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                                
                                val email = profile?.email ?: ""
                                ProfileDetailItem(icon = Icons.Default.Email, label = "Email", value = email.ifEmpty { "Chưa cập nhật" })

                                val phone = profile?.so_dien_thoai ?: ""
                                ProfileDetailItem(icon = Icons.Default.Phone, label = "Số điện thoại", value = phone.ifEmpty { "Chưa cập nhật" })

                                if (user.vai_tro == "NGUOI_THUE") {
                                    val cccd = user.nguoi_thue?.cccd ?: ""
                                    ProfileDetailItem(icon = Icons.Default.Info, label = "CCCD", value = cccd.ifEmpty { "Chưa cập nhật" })
                                } else if (user.vai_tro == "CHU_TRO") {
                                    val address = user.chu_tro?.dia_chi ?: ""
                                    ProfileDetailItem(icon = Icons.Default.LocationOn, label = "Địa chỉ", value = address.ifEmpty { "Chưa cập nhật" })
                                }
                                
                                ProfileDetailItem(icon = Icons.Default.Person, label = "Tên đăng nhập", value = user.ten_dang_nhap)
                            }
                        }
                        
                        Spacer(modifier = Modifier.weight(1f))

                        Button(
                            onClick = {/*TODO Chỉnh sửa thông tin cá nhân*/ },
                            modifier = Modifier.fillMaxWidth(),
                            colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondary)

                        ) {
                            Text("Chỉnh sửa thông tin")
                        }
                        
                        Button(
                            onClick = { showPasswordDialog = true },
                            modifier = Modifier.fillMaxWidth(),
                            colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondary)
                        ) {
                            Text("Đổi mật khẩu")
                        }
                    }
                }
            }
        }
    }

    if (showPasswordDialog) {
        ChangePasswordDialog(
            viewModel = viewModel,
            onDismiss = { showPasswordDialog = false }
        )
    }
}

@Composable
fun ProfileDetailItem(icon: ImageVector, label: String, value: String) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Icon(icon, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
        Spacer(modifier = Modifier.width(16.dp))
        Column {
            Text(text = label, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.outline)
            Text(text = value, style = MaterialTheme.typography.bodyLarge)
        }
    }
}
