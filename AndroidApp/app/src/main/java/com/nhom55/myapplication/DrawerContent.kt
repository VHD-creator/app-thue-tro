package com.nhom55.myapplication

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.material3.HorizontalDivider
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.navigation.NavHostController

@Composable
fun DrawerContent(
    isLoggedIn: Boolean,
    currentUser: User?,
    navController: NavHostController,
    onCloseDrawer: () -> Unit
) {
    ModalDrawerSheet(
        modifier = Modifier.width(300.dp)
    ) {
        // Profile Section
        ProfileSection(
            isLoggedIn = isLoggedIn,
            currentUser = currentUser,
            onLoginClick = {
                navController.navigate(Screen.Login.route)
                onCloseDrawer()
            }
        )

        HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))

        // Menu Items
        DrawerMenuItem(
            icon = Icons.Default.Home,
            title = "Danh sách phòng",
            onClick = {
                navController.navigate(Screen.RoomList.route) {
                    popUpTo(Screen.RoomList.route) { inclusive = true }
                }
                onCloseDrawer()
            }
        )

        val isAdminOrChuTro = currentUser?.role == "ADMIN" || currentUser?.role == "CHU_TRO"

        if (isAdminOrChuTro) {
            DrawerMenuItem(
                icon = Icons.Default.Person,
                title = "Khách thuê",
                onClick = {
                    navController.navigate(Screen.Tenants.route) {
                        popUpTo(Screen.RoomList.route)
                    }
                    onCloseDrawer()
                }
            )

            DrawerMenuItem(
                icon = Icons.Default.Info,
                title = "Hợp đồng",
                onClick = {
                    navController.navigate(Screen.Contracts.route) {
                        popUpTo(Screen.RoomList.route)
                    }
                    onCloseDrawer()
                }
            )

            DrawerMenuItem(
                icon = Icons.Default.List,
                title = "Hóa đơn",
                onClick = {
                    // TODO: Replace with real invoice route when available
                    navController.navigate("invoices") {
                        popUpTo(Screen.RoomList.route)
                    }
                    onCloseDrawer()
                }
            )

            DrawerMenuItem(
                icon = Icons.Default.Check,
                title = "Thanh toán",
                onClick = {
                    // TODO: Handle navigation
                    navController.navigate(Screen.Payments.route)
                    onCloseDrawer()
                }
            )

            DrawerMenuItem(
                icon = Icons.Default.Info,
                title = "Báo cáo",
                onClick = {
                    // TODO: Handle navigation
                    navController.navigate(Screen.Reports.route)
                    onCloseDrawer()
                }
            )

            Spacer(modifier = Modifier.weight(1f))

            HorizontalDivider()

            DrawerMenuItem(
                icon = Icons.Default.Settings,
                title = "Cài đặt",
                onClick = {
                    // TODO: Handle navigation
                    navController.navigate(Screen.Settings.route)
                    onCloseDrawer()
                }
            )
        } else {
            Spacer(modifier = Modifier.weight(1f))
        }

        if (isLoggedIn) {
            DrawerMenuItem(
                icon = Icons.Default.Close,
                title = "Đăng xuất",
                onClick = {
                    SessionManager.logout()
                    onCloseDrawer()
                }
            )
        }

        Spacer(modifier = Modifier.height(16.dp))
    }
}

@Composable
fun ProfileSection(
    isLoggedIn: Boolean,
    currentUser: User?,
    onLoginClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .background(MaterialTheme.colorScheme.primaryContainer)
            .padding(16.dp)
    ) {
        if (isLoggedIn && currentUser != null) {
            Column(modifier = Modifier.fillMaxWidth()) {
                // Hiển thị thông tin user
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    // Avatar
                    Box(
                        modifier = Modifier
                            .size(60.dp)
                            .clip(CircleShape)
                            .background(MaterialTheme.colorScheme.primary),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = currentUser.name.take(1).uppercase(),
                            style = MaterialTheme.typography.headlineMedium,
                            color = MaterialTheme.colorScheme.onPrimary
                        )
                    }

                    Spacer(modifier = Modifier.width(16.dp))

                    Column {
                        Text(
                            text = currentUser.name,
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = currentUser.email,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
                
                Spacer(modifier = Modifier.height(12.dp))
                
                OutlinedButton(
                    onClick = { /* TODO: Navigate to Profile */ },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Xem thông tin")
                }
            }
        } else {
            // Hiển thị nút đăng nhập
            Column(
                modifier = Modifier.fillMaxWidth(),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Box(
                    modifier = Modifier
                        .size(60.dp)
                        .clip(CircleShape)
                        .background(MaterialTheme.colorScheme.surfaceVariant),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        Icons.Default.Person,
                        contentDescription = null,
                        modifier = Modifier.size(32.dp),
                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                Spacer(modifier = Modifier.height(12.dp))

                Button(
                    onClick = onLoginClick,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(Icons.Default.PlayArrow, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Đăng nhập")
                }
            }
        }
    }
}

@Composable
fun DrawerMenuItem(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    title: String,
    onClick: () -> Unit
) {
    NavigationDrawerItem(
        icon = { Icon(icon, contentDescription = null) },
        label = { Text(title) },
        selected = false,
        onClick = onClick,
        modifier = Modifier.padding(horizontal = 12.dp)
    )
}
