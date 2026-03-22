package com.nhom55.myapplication.navigation

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import androidx.navigation.compose.*
import androidx.navigation.navArgument
import androidx.navigation.NavType
import com.nhom55.myapplication.feature.contract.ContractDetailScreen
import com.nhom55.myapplication.feature.contract.ContractListScreen
import com.nhom55.myapplication.core.session.SessionManager
import com.nhom55.myapplication.feature.auth.LoginScreen
import com.nhom55.myapplication.feature.auth.RegisterScreen
import com.nhom55.myapplication.feature.room.RoomDetailScreen
import com.nhom55.myapplication.feature.room.RoomListScreen
import com.nhom55.myapplication.feature.invoice.InvoiceListScreen
import com.nhom55.myapplication.feature.payment.PaymentScreen
import com.nhom55.myapplication.feature.tenant.TenantDetailScreen
import com.nhom55.myapplication.feature.tenant.TenantListScreen
import kotlinx.coroutines.launch

// Định nghĩa các route
sealed class Screen(val route: String, val title: String, val icon: ImageVector) {
    object RoomList : Screen("room_list", "Danh sách phòng", Icons.Default.Home)
    object Login : Screen("login", "Đăng nhập", Icons.Default.Person)
    object Register : Screen("register", "Đăng ký", Icons.Default.Person)
    object RoomDetail : Screen("room_detail/{roomId}", "Chi tiết phòng", Icons.Default.Info)
    object Tenants : Screen("tenants", "Khách thuê", Icons.Default.Person)
    object TenantDetail : Screen("tenant_detail/{tenantId}", "Chi tiết khách thuê", Icons.Default.Person)
    object Contracts : Screen("contracts", "Hợp đồng", Icons.Default.Info)
    object ContractDetail : Screen("contract_detail/{contractId}", "Chi tiết hợp đồng", Icons.Default.Info)
    object Invoices : Screen("invoices", "Hóa đơn", Icons.Default.List)
    object Payments : Screen("payments", "Thanh toán", Icons.Default.Star)
    object Reports : Screen("reports", "Báo cáo", Icons.Default.Check)
    object Settings : Screen("settings", "Cài đặt", Icons.Default.Settings)
    object Profile : Screen("profile", "Hồ sơ cá nhân", Icons.Default.Person)
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen() {
    val navController = rememberNavController()
    val drawerState = rememberDrawerState(initialValue = DrawerValue.Closed)
    val scope = rememberCoroutineScope()

    val currentUser by SessionManager.currentUser.collectAsState()
    val isLoggedIn = currentUser != null

    ModalNavigationDrawer(
        drawerState = drawerState,
        drawerContent = {
            DrawerContent(
                isLoggedIn = isLoggedIn,
                currentUser = currentUser,
                navController = navController,
                onCloseDrawer = {
                    scope.launch { drawerState.close() }
                }
            )
        }
    ) {
        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text("Quản lý trọ") },
                    navigationIcon = {
                        IconButton(onClick = {
                            scope.launch { drawerState.open() }
                        }) {
                            Icon(Icons.Default.Menu, contentDescription = "Menu")
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
            NavHost(
                navController = navController,
                startDestination = Screen.RoomList.route,
                modifier = Modifier.padding(paddingValues)
            ) {
                composable(Screen.RoomList.route) {
                    RoomListScreen(navController = navController)
                }
                composable(Screen.Login.route) {
                    LoginScreen(navController = navController)
                }
                composable(Screen.Register.route) {
                    RegisterScreen(navController = navController)
                }
                composable(Screen.RoomDetail.route) { backStackEntry ->
                    val roomId = backStackEntry.arguments?.getString("roomId")
                    RoomDetailScreen(roomId = roomId, navController = navController)
                }
                composable(Screen.Tenants.route) {
                    TenantListScreen(navController = navController)
                }
                composable(Screen.TenantDetail.route) { backStackEntry ->
                    val tenantId = backStackEntry.arguments?.getString("tenantId")
                    TenantDetailScreen(tenantId = tenantId, navController = navController)
                }
                composable(Screen.Contracts.route) {
                    ContractListScreen(navController = navController)
                }
                composable(Screen.ContractDetail.route) { backStackEntry ->
                    val contractId = backStackEntry.arguments?.getString("contractId")
                    ContractDetailScreen(contractId = contractId, navController = navController)
                }
                composable(Screen.Invoices.route) {
                    InvoiceListScreen(navController = navController)
                }
                composable(Screen.Payments.route) {
                    PlaceholderScreen("Thanh toán")
                }
                
                composable(
                    route = "payment_form/{invoiceId}/{totalAmount}",
                    arguments = listOf(
                        navArgument("invoiceId") { type = NavType.IntType },
                        navArgument("totalAmount") { type = NavType.FloatType }
                    )
                ) { backStackEntry ->
                    val invoiceId = backStackEntry.arguments?.getInt("invoiceId") ?: 0
                    val totalAmount = backStackEntry.arguments?.getFloat("totalAmount")?.toDouble() ?: 0.0
                    PaymentScreen(
                        invoiceId = invoiceId,
                        totalAmount = totalAmount,
                        navController = navController
                    )
                }
                composable(Screen.Reports.route) {
                    PlaceholderScreen("Báo cáo")
                }
                composable(Screen.Settings.route) {
                    PlaceholderScreen("Cài đặt")
                }
                composable(Screen.Profile.route) {
                    com.nhom55.myapplication.feature.profile.ProfileScreen(navController = navController)
                }
            }
        }
    }
}

@Composable
fun PlaceholderScreen(title: String) {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                text = title,
                style = MaterialTheme.typography.headlineMedium
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "// TODO: Đang phát triển tính năng này",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.outline
            )
        }
    }
}

// Data class cho User
data class User(
    val id: String,
    val name: String,
    val email: String,
    val avatarUrl: String? = null,
    val role: String = "NGUOI_THUE"
)
