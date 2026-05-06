package com.nhom55.myapplication.navigation

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.List
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
import com.nhom55.myapplication.feature.dashboard.DashboardScreen
import com.nhom55.myapplication.feature.room.RoomDetailScreen
import com.nhom55.myapplication.feature.room.RoomListScreen
import com.nhom55.myapplication.feature.invoice.InvoiceListScreen
import com.nhom55.myapplication.feature.payment.PaymentScreen
import com.nhom55.myapplication.feature.tenant.TenantDetailScreen
import com.nhom55.myapplication.feature.tenant.TenantListScreen
import com.nhom55.myapplication.feature.tenant.TenantDashboardScreen
import kotlinx.coroutines.launch

// Định nghĩa các route
sealed class Screen(val route: String, val title: String, val icon: ImageVector) {
    object Dashboard : Screen("dashboard", "Dashboard", Icons.Default.Home)
    object RoomList : Screen("room_list", "Danh sách phòng", Icons.Default.Home)
    object Login : Screen("login", "Đăng nhập", Icons.Default.Person)
    object Register : Screen("register", "Đăng ký", Icons.Default.Person)
    object RoomDetail : Screen("room_detail/{roomId}", "Chi tiết phòng", Icons.Default.Info)
    object Tenants : Screen("tenants", "Khách thuê", Icons.Default.Person)
    object TenantDetail : Screen("tenant_detail/{tenantId}", "Chi tiết khách thuê", Icons.Default.Person)
    object Contracts : Screen("contracts", "Hợp đồng", Icons.Default.Info)
    object ContractDetail : Screen("contract_detail/{contractId}", "Chi tiết hợp đồng", Icons.Default.Info)
    object Invoices : Screen("invoices", "Hóa đơn", Icons.AutoMirrored.Filled.List)
    object Reports : Screen("reports", "Báo cáo", Icons.Default.Check)
    object Settings : Screen("settings", "Cài đặt", Icons.Default.Settings)
    object Profile : Screen("profile", "Hồ sơ cá nhân", Icons.Default.Person)
    object UserList : Screen("user_list", "Quản lý người dùng", Icons.Default.Person)
    object BankConfig : Screen("bank_config", "Cấu hình ngân hàng", Icons.Default.AccountBalance)
    object MyRequests : Screen("my_requests", "Yêu cầu của tôi", Icons.Default.MailOutline)
    object LandlordRequests : Screen("landlord_requests", "Duyệt yêu cầu thuê", Icons.Default.CheckCircle)
    object ChatBot : Screen("chatbot", "Trợ lý ảo AI", Icons.Default.Email)
    object EditProfile : Screen("edit_profile", "Chỉnh sửa hồ sơ", Icons.Default.Edit)
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen() {
    val navController = rememberNavController()
    val drawerState = rememberDrawerState(initialValue = DrawerValue.Closed)
    val scope = rememberCoroutineScope()

    val currentUser by SessionManager.currentUser.collectAsState()
    val isLoggedIn = currentUser != null
    val isAdminOrChuTro = currentUser?.role == "ADMIN" || currentUser?.role == "CHU_TRO"
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    val isTopLevelRoute = currentRoute in listOf(
        Screen.Dashboard.route,
        Screen.RoomList.route,
        "all_rooms",
        Screen.Tenants.route,
        Screen.Contracts.route,
        Screen.Invoices.route,
        Screen.Reports.route,
        Screen.Profile.route,
        Screen.Settings.route,
        Screen.UserList.route
    )

    // Đảm bảo đóng Drawer mỗi lần đổi route (ví dụ: chuyển từ Login sang Dashboard)
    LaunchedEffect(currentRoute) {
        drawerState.close()
    }

    ModalNavigationDrawer(
        drawerState = drawerState,
        gesturesEnabled = isAdminOrChuTro && drawerState.isOpen,
        drawerContent = {
            if (isAdminOrChuTro) {
                DrawerContent(
                    isLoggedIn = isLoggedIn,
                    currentUser = currentUser,
                    navController = navController,
                    onCloseDrawer = {
                        scope.launch { drawerState.close() }
                    }
                )
            }
        }
    ) {
        Scaffold(
            topBar = {
                if (isTopLevelRoute) {
                    TopAppBar(
                        title = {
                            Text(
                                when {
                                    isAdminOrChuTro -> "Quản lý trọ"
                                    isLoggedIn -> "Dashboard Của Tôi"
                                    else -> "Phòng Trọ 55"
                                }
                            )
                        },
                        navigationIcon = {
                            if (isAdminOrChuTro) {
                                IconButton(onClick = {
                                    scope.launch { drawerState.open() }
                                }) {
                                    Icon(Icons.Default.Menu, contentDescription = "Menu")
                                }
                            }
                        },
                        actions = {
                            if (!isLoggedIn && currentRoute != Screen.Login.route && currentRoute != Screen.Register.route) {
                                // Guest on home: show Login button
                                TextButton(
                                    onClick = {
                                        navController.navigate(Screen.Login.route) {
                                            launchSingleTop = true
                                        }
                                    }
                                ) {
                                    Text("Đăng nhập", color = MaterialTheme.colorScheme.onPrimary)
                                }
                            } else if (!isLoggedIn && (currentRoute == Screen.Login.route || currentRoute == Screen.Register.route)) {
                                // Guest on Login/Register: show Home button
                                TextButton(
                                    onClick = {
                                        navController.navigate(Screen.RoomList.route) {
                                            popUpTo(Screen.RoomList.route) { inclusive = true }
                                            launchSingleTop = true
                                        }
                                    }
                                ) {
                                    Text("Trang chủ", color = MaterialTheme.colorScheme.onPrimary)
                                }
                            } else if (!isAdminOrChuTro) {
                                // Tenant: show 3-dot menu
                                var showMenu by remember { mutableStateOf(false) }
                                IconButton(onClick = { showMenu = true }) {
                                    Icon(Icons.Default.MoreVert, contentDescription = "Tùy chọn")
                                }
                                DropdownMenu(
                                    expanded = showMenu,
                                    onDismissRequest = { showMenu = false }
                                ) {
                                    DropdownMenuItem(
                                        text = { Text("Đăng xuất") },
                                        onClick = {
                                            showMenu = false
                                            SessionManager.logout()
                                            navController.navigate(Screen.Login.route) {
                                                popUpTo(0) { inclusive = true }
                                            }
                                        }
                                    )
                                }
                            }
                        },
                        colors = TopAppBarDefaults.topAppBarColors(
                            containerColor = MaterialTheme.colorScheme.primary,
                            titleContentColor = MaterialTheme.colorScheme.onPrimary,
                            navigationIconContentColor = MaterialTheme.colorScheme.onPrimary,
                            actionIconContentColor = MaterialTheme.colorScheme.onPrimary
                        )
                    )
                }
            }
        ) { paddingValues ->
            NavHost(
                navController = navController,
                startDestination = Screen.RoomList.route,
                modifier = Modifier.padding(paddingValues)
            ) {
                composable(Screen.RoomList.route) {
                    if (!isAdminOrChuTro && isLoggedIn) {
                        TenantDashboardScreen(navController = navController)
                    } else if (isAdminOrChuTro) {
                        DashboardScreen(navController = navController)
                    } else {
                        RoomListScreen(navController = navController)
                    }
                }
                composable(Screen.Dashboard.route) {
                    DashboardScreen(navController = navController)
                }
                composable("all_rooms") {
                    RoomListScreen(navController = navController)
                }
                composable("my_room") {
                    com.nhom55.myapplication.feature.room.MyRoomScreen(navController = navController)
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
                composable(
                    route = "create_edit_tenant/{tenantId}",
                    arguments = listOf(navArgument("tenantId") { type = NavType.StringType })
                ) { backStackEntry ->
                    val tenantId = backStackEntry.arguments?.getString("tenantId") ?: "new"
                    com.nhom55.myapplication.feature.tenant.CreateEditTenantScreen(
                        tenantId = if (tenantId == "new") null else tenantId,
                        navController = navController
                    )
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
                composable(
                    route = "invoice_detail/{invoiceId}",
                    arguments = listOf(navArgument("invoiceId") { type = NavType.IntType })
                ) { backStackEntry ->
                    val invoiceId = backStackEntry.arguments?.getInt("invoiceId") ?: 0
                    com.nhom55.myapplication.feature.invoice.InvoiceDetailScreen(
                        invoiceId = invoiceId,
                        navController = navController
                    )
                }
                composable(
                    route = "create_edit_invoice/{invoiceId}",
                    arguments = listOf(navArgument("invoiceId") { type = NavType.StringType })
                ) { backStackEntry ->
                    val invoiceId = backStackEntry.arguments?.getString("invoiceId") ?: "new"
                    com.nhom55.myapplication.feature.invoice.CreateEditInvoiceScreen(
                        invoiceId = if (invoiceId == "new") null else invoiceId.toIntOrNull(),
                        navController = navController
                    )
                }
                composable(
                    route = "create_edit_contract/{contractId}?roomId={roomId}",
                    arguments = listOf(
                        navArgument("contractId") { type = NavType.StringType },
                        navArgument("roomId") { type = NavType.StringType; nullable = true }
                    )
                ) { backStackEntry ->
                    val contractId = backStackEntry.arguments?.getString("contractId") ?: "new"
                    val roomId = backStackEntry.arguments?.getString("roomId")
                    com.nhom55.myapplication.feature.contract.CreateEditContractScreen(
                        contractId = if (contractId == "new") null else contractId,
                        roomId = roomId,
                        navController = navController
                    )
                }
                composable(
                    route = "create_edit_room/{roomId}",
                    arguments = listOf(navArgument("roomId") { type = NavType.StringType })
                ) { backStackEntry ->
                    val roomId = backStackEntry.arguments?.getString("roomId") ?: "new"
                    com.nhom55.myapplication.feature.room.CreateEditRoomScreen(
                        roomId = roomId,
                        navController = navController
                    )
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
                    com.nhom55.myapplication.feature.report.ReportScreen(navController = navController)
                }
                composable(Screen.Settings.route) {
                    PlaceholderScreen("Cài đặt")
                }
                composable(Screen.Profile.route) {
                    com.nhom55.myapplication.feature.profile.ProfileScreen(navController = navController)
                }
                composable(Screen.EditProfile.route) {
                    com.nhom55.myapplication.feature.profile.EditProfileScreen(navController = navController)
                }
                composable(Screen.UserList.route) {
                    com.nhom55.myapplication.feature.admin.UserListScreen(navController = navController)
                }
                composable(
                    route = "vietqr_payment/{invoiceId}",
                    arguments = listOf(navArgument("invoiceId") { type = NavType.IntType })
                ) { backStackEntry ->
                    val invoiceId = backStackEntry.arguments?.getInt("invoiceId") ?: 0
                    com.nhom55.myapplication.feature.payment.VietQRPaymentScreen(
                        invoiceId = invoiceId,
                        navController = navController
                    )
                }
                composable(Screen.BankConfig.route) {
                    com.nhom55.myapplication.feature.payment.BankConfigScreen(navController = navController)
                }
                composable(Screen.MyRequests.route) {
                    com.nhom55.myapplication.feature.room.MyRequestsScreen(navController = navController)
                }
                composable(Screen.LandlordRequests.route) {
                    com.nhom55.myapplication.feature.room.LandlordRequestsScreen(navController = navController)
                }
                composable(Screen.ChatBot.route) {
                    com.nhom55.myapplication.feature.chatbot.ChatScreen(navController = navController)
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
                text = "COMING SOON",
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
