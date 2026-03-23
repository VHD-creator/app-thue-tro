package com.nhom55.myapplication.feature.tenant

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.List
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Home
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.navigation.NavHostController
import com.nhom55.myapplication.core.session.SessionManager
import com.nhom55.myapplication.navigation.Screen

@Composable
fun TenantDashboardScreen(navController: NavHostController) {
    val user by SessionManager.currentUser.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Welcome Header
        Text(
            text = "Xin chào, ${user?.name ?: "Người Dùng"}!",
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.primary
        )
        
        Text(
            text = "Email: ${user?.email ?: "Chưa cập nhật"}",
            style = MaterialTheme.typography.bodyLarge
        )

        HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))

        // Options
        DashboardCard(
            title = "Hồ sơ cá nhân",
            description = "Xem và điền thông tin định danh cá nhân",
            icon = Icons.Default.Person,
            onClick = { navController.navigate(Screen.Profile.route) }
        )

        DashboardCard(
            title = "Phòng đã thuê",
            description = "Xem thông tin chi tiết phòng bạn đang ở",
            icon = Icons.Default.Home,
            onClick = { navController.navigate("my_room") }
        )

        DashboardCard(
            title = "Phòng Trọ 55",
            description = "Lướt xem các khu nhà và tìm thuê phòng mới",
            icon = Icons.Default.List,
            onClick = { navController.navigate("all_rooms") }
        )

        DashboardCard(
            title = "Hoá đơn của tôi",
            description = "Xem lịch sử dùng điện nước và thanh toán",
            icon = Icons.Default.List,
            onClick = { navController.navigate(Screen.Invoices.route) }
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardCard(
    title: String,
    description: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    onClick: () -> Unit
) {
    Card(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(40.dp)
            )
            Spacer(modifier = Modifier.width(16.dp))
            Column {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = description,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}
