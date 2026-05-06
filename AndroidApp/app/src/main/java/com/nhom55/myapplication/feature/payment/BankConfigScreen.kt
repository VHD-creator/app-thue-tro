package com.nhom55.myapplication.feature.payment

import android.widget.Toast
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavHostController
import coil.compose.AsyncImage

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BankConfigScreen(
    navController: NavHostController,
    viewModel: VietQRViewModel = viewModel()
) {
    val context = LocalContext.current
    val banksState by viewModel.banks.collectAsState()
    val bankInfoState by viewModel.landlordBankInfo.collectAsState()
    val updateState by viewModel.updateState.collectAsState()

    var soTaiKhoan by remember { mutableStateOf("") }
    var selectedBank by remember { mutableStateOf<BankApiModel?>(null) }
    var isExpended by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        viewModel.getBanks()
        viewModel.getLandlordBankInfo()
    }

    LaunchedEffect(bankInfoState) {
        if (bankInfoState is VietQRState.Success) {
            val data = (bankInfoState as VietQRState.Success).data.data
            soTaiKhoan = data?.so_tai_khoan ?: ""
            // We'll set selectedBank once banks are loaded
        }
    }

    LaunchedEffect(banksState, bankInfoState) {
        if (banksState is VietQRState.Success && bankInfoState is VietQRState.Success) {
            val banks = (banksState as VietQRState.Success).data
            val currentMaBin = (bankInfoState as VietQRState.Success).data.data?.ma_ngan_hang
            selectedBank = banks.find { it.ma_bin == currentMaBin }
        }
    }

    LaunchedEffect(updateState) {
        if (updateState is VietQRState.Success) {
            Toast.makeText(context, "Cập nhật thành công", Toast.LENGTH_SHORT).show()
            viewModel.resetUpdateState()
        } else if (updateState is VietQRState.Error) {
            Toast.makeText(context, (updateState as VietQRState.Error).message, Toast.LENGTH_SHORT).show()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Cấu hình Ngân hàng", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text("Thiết lập tài khoản nhận tiền qua QR", style = MaterialTheme.typography.titleMedium)

            OutlinedTextField(
                value = soTaiKhoan,
                onValueChange = { soTaiKhoan = it },
                label = { Text("Số tài khoản") },
                modifier = Modifier.fillMaxWidth()
            )

            ExposedDropdownMenuBox(
                expanded = isExpended,
                onExpandedChange = { isExpended = !isExpended },
                modifier = Modifier.fillMaxWidth()
            ) {
                OutlinedTextField(
                    value = selectedBank?.ten ?: "Chọn ngân hàng",
                    onValueChange = {},
                    readOnly = true,
                    label = { Text("Ngân hàng") },
                    trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = isExpended) },
                    modifier = Modifier.menuAnchor().fillMaxWidth()
                )

                ExposedDropdownMenu(
                    expanded = isExpended,
                    onDismissRequest = { isExpended = false }
                ) {
                    if (banksState is VietQRState.Success) {
                        (banksState as VietQRState.Success).data.forEach { bank ->
                            DropdownMenuItem(
                                text = { Text("${bank.ten_viet_tat} - ${bank.ten}") },
                                onClick = {
                                    selectedBank = bank
                                    isExpended = false
                                }
                            )
                        }
                    }
                }
            }

            Button(
                onClick = {
                    val bank = selectedBank
                    if (bank != null && soTaiKhoan.isNotBlank()) {
                        viewModel.updateLandlordBankInfo(soTaiKhoan, bank.ten, bank.ma_bin)
                    } else {
                        Toast.makeText(context, "Vui lòng nhập đầy đủ thông tin", Toast.LENGTH_SHORT).show()
                    }
                },
                modifier = Modifier.fillMaxWidth(),
                enabled = updateState !is VietQRState.Loading
            ) {
                if (updateState is VietQRState.Loading) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(24.dp),
                        color = MaterialTheme.colorScheme.onPrimary
                    )
                } else {
                    Text("Lưu cấu hình")
                }
            }

            if (bankInfoState is VietQRState.Success) {
                val info = (bankInfoState as VietQRState.Success).data
                if (info.da_cap_nhat && info.qr_preview != null) {
                    Spacer(modifier = Modifier.height(24.dp))
                    HorizontalDivider()
                    Spacer(modifier = Modifier.height(16.dp))
                    Text("Xem trước mã QR của bạn", style = MaterialTheme.typography.titleMedium)
                    Card(
                        modifier = Modifier.fillMaxWidth().aspectRatio(1f),
                        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
                    ) {
                        AsyncImage(
                            model = info.qr_preview,
                            contentDescription = "QR Preview",
                            modifier = Modifier.fillMaxSize().padding(16.dp),
                            contentScale = ContentScale.Fit
                        )
                    }
                    Text(
                        "Mã QR này sẽ được hiển thị cho người thuê khi họ thanh toán hóa đơn.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.outline
                    )
                }
            }
        }
    }
}
