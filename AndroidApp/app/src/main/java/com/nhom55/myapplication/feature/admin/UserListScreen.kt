package com.nhom55.myapplication.feature.admin

import android.widget.Toast
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.LockOpen
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavHostController
import com.nhom55.myapplication.core.network.TaiKhoanApiModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun UserListScreen(
    navController: NavHostController,
    viewModel: UserViewModel = viewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val context = LocalContext.current

    LaunchedEffect(Unit) {
        viewModel.loadUsers()
    }

    Column(modifier = Modifier.fillMaxSize()) {
        // Custom header
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
            Text("Quản lý người dùng", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        }

        Box(modifier = Modifier.fillMaxSize()) {
            when (val state = uiState) {
                is UserUiState.Loading -> {
                    CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
                }
                is UserUiState.Error -> {
                    Column(
                        modifier = Modifier.align(Alignment.Center),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(state.message, color = MaterialTheme.colorScheme.error)
                        Button(onClick = { viewModel.loadUsers() }) {
                            Text("Thử lại")
                        }
                    }
                }
                is UserUiState.Success -> {
                    val users = state.users
                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(users) { user ->
                            UserItem(
                                user = user,
                                onToggleLock = {
                                    viewModel.toggleUserLock(user.id_tai_khoan, user.trang_thai == 0) { success, message ->
                                        Toast.makeText(context, message, Toast.LENGTH_SHORT).show()
                                    }
                                }
                            )
                        }
                    }
                }
                else -> {}
            }
        }
    }
}

@Composable
fun UserItem(
    user: TaiKhoanApiModel,
    onToggleLock: () -> Unit
) {
    val isLocked = user.trang_thai == 0
    val roleColor = when (user.vai_tro) {
        "ADMIN" -> MaterialTheme.colorScheme.error
        "CHU_TRO" -> MaterialTheme.colorScheme.primary
        else -> MaterialTheme.colorScheme.secondary
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (isLocked) Color.LightGray.copy(alpha = 0.3f) else MaterialTheme.colorScheme.surface
        )
    ) {
        Row(
            modifier = Modifier
                .padding(16.dp)
                .fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                Icons.Default.Person,
                contentDescription = null,
                tint = roleColor,
                modifier = Modifier.size(40.dp)
            )
            Spacer(modifier = Modifier.width(16.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = user.ten_dang_nhap,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                val hoTen = user.chu_tro?.ho_ten ?: user.nguoi_thue?.ho_ten ?: "Chưa cập nhật tên"
                Text(text = hoTen, style = MaterialTheme.typography.bodyMedium)
                
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = user.vai_tro,
                        style = MaterialTheme.typography.labelSmall,
                        color = roleColor,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    if (isLocked) {
                        Text(
                            text = "(Đã khóa)",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.error
                        )
                    }
                }
            }
            
            if (user.vai_tro != "ADMIN") {
                IconButton(onClick = onToggleLock) {
                    Icon(
                        if (isLocked) Icons.Default.LockOpen else Icons.Default.Lock,
                        contentDescription = if (isLocked) "Mở khóa" else "Khóa",
                        tint = if (isLocked) Color(0xFF4CAF50) else MaterialTheme.colorScheme.error
                    )
                }
            }
        }
    }
}
