package com.nhom55.myapplication.feature.room

import android.content.Context
import android.net.Uri
import android.provider.OpenableColumns
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavHostController
import coil.compose.AsyncImage
import com.nhom55.myapplication.core.network.CreateRoomRequest
import com.nhom55.myapplication.core.network.RetrofitInstance
import com.nhom55.myapplication.core.network.UpdateRoomRequest
import com.nhom55.myapplication.core.session.SessionManager
import com.nhom55.myapplication.core.utils.FileUtils
import kotlinx.coroutines.launch
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import java.io.File
import java.io.FileOutputStream

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CreateEditRoomScreen(
    roomId: String, // "new" if creating
    navController: NavHostController,
    roomViewModel: RoomViewModel = viewModel()
) {
    val isEdit = roomId != "new"
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    val currentUser by SessionManager.currentUser.collectAsState()
    val roomImagesMap by roomViewModel.roomImages.collectAsState()
    val existingImages = if (isEdit) roomImagesMap[roomId] ?: emptyList() else emptyList()
    var imageOpsLoading by remember { mutableStateOf(false) }

    var name by remember { mutableStateOf("") }
    var price by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var selectedImageUris by remember { mutableStateOf<List<Uri>>(emptyList()) }
    var isLoading by remember { mutableStateOf(false) }

    // Launcher for new-room create mode (local URIs)
    val imagePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetMultipleContents()
    ) { uris: List<Uri> ->
        if (!isEdit) {
            // Create mode: collect local URIs to upload with room
            selectedImageUris = if (uris.size > 10) uris.take(10) else uris
        } else {
            // Edit mode: immediately upload to server
            val files = uris.mapNotNull { FileUtils.uriToFile(context, it) }
            if (files.isNotEmpty()) {
                imageOpsLoading = true
                roomViewModel.uploadImages(roomId.toInt(), files) { _, message ->
                    imageOpsLoading = false
                    Toast.makeText(context, message, Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    // Load existing data if editing
    LaunchedEffect(roomId) {
        if (isEdit) {
            try {
                val apiRoom = RetrofitInstance.api.getRoomById(roomId.toInt())
                name = apiRoom.ten_phong
                price = apiRoom.gia_phong.toString()
                description = apiRoom.mo_ta ?: ""
            } catch (e: Exception) {
                Toast.makeText(context, "Lỗi tải thông tin phòng", Toast.LENGTH_SHORT).show()
            }
            roomViewModel.loadRoomImages(roomId, forceReload = true)
        }
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
            Text(if (isEdit) "Sửa thông tin phòng" else "Thêm phòng mới", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        }

        Column(
            modifier = Modifier
                .padding(horizontal = 16.dp)
                .weight(1f)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            OutlinedTextField(
                value = name,
                onValueChange = { name = it },
                label = { Text("Tên phòng (bắt buộc)") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true
            )

            OutlinedTextField(
                value = price,
                onValueChange = { price = it },
                label = { Text("Giá phòng (bắt buộc - VNĐ)") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true
            )

            OutlinedTextField(
                value = description,
                onValueChange = { description = it },
                label = { Text("Mô tả phòng") },
                modifier = Modifier.fillMaxWidth(),
                minLines = 3
            )

            if (!isEdit) {
                Text(
                    text = "Lưu ý: Phòng mới tạo sẽ có trạng thái mặc định là 'Trống'",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.outline
                )
            }

            HorizontalDivider()

            // ===== PHẦN ẢNH =====
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = if (isEdit) "Ảnh phòng" else "Hình ảnh phòng (Tối đa 10 ảnh)",
                    fontWeight = FontWeight.Bold,
                    style = MaterialTheme.typography.titleMedium
                )
                IconButton(
                    onClick = { imagePickerLauncher.launch("image/*") },
                    enabled = !imageOpsLoading
                ) {
                    Icon(
                        Icons.Default.Add,
                        contentDescription = "Thêm ảnh",
                        tint = MaterialTheme.colorScheme.primary
                    )
                }
            }

            if (isEdit) {
                if (imageOpsLoading) {
                    Box(
                        modifier = Modifier.fillMaxWidth().height(80.dp),
                        contentAlignment = Alignment.Center
                    ) { CircularProgressIndicator() }
                } else if (existingImages.isEmpty()) {
                    Text(
                        "Chưa có ảnh nào. Nhấn + để thêm ảnh.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.outline
                    )
                } else {
                    val chunkedImages = existingImages.chunked(2)
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        chunkedImages.forEach { rowImages ->
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                rowImages.forEach { image ->
                                    Card(
                                        modifier = Modifier
                                            .weight(1f)
                                            .aspectRatio(1f),
                                        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                                    ) {
                                        Box(modifier = Modifier.fillMaxSize()) {
                                            AsyncImage(
                                                model = image.url,
                                                contentDescription = null,
                                                contentScale = ContentScale.Crop,
                                                modifier = Modifier.fillMaxSize()
                                            )
                                            if (image.isAvatar) {
                                                Box(
                                                    modifier = Modifier
                                                        .align(Alignment.TopEnd)
                                                        .padding(4.dp)
                                                        .background(
                                                            MaterialTheme.colorScheme.primary,
                                                            RoundedCornerShape(4.dp)
                                                        )
                                                        .padding(horizontal = 4.dp, vertical = 2.dp)
                                                ) {
                                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                                        Icon(Icons.Default.Star, null, tint = Color.White, modifier = Modifier.size(12.dp))
                                                        Spacer(modifier = Modifier.width(2.dp))
                                                        Text("Ảnh chính", style = MaterialTheme.typography.labelSmall, color = Color.White)
                                                    }
                                                }
                                            }
                                            Row(
                                                modifier = Modifier
                                                    .align(Alignment.BottomCenter)
                                                    .fillMaxWidth()
                                                    .background(Color.Black.copy(alpha = 0.5f))
                                                    .padding(4.dp),
                                                horizontalArrangement = Arrangement.SpaceEvenly
                                            ) {
                                                IconButton(
                                                    onClick = {
                                                        imageOpsLoading = true
                                                        roomViewModel.setMainImage(roomId.toInt(), image.id) { _, message ->
                                                            imageOpsLoading = false
                                                            Toast.makeText(context, message, Toast.LENGTH_SHORT).show()
                                                        }
                                                    },
                                                    modifier = Modifier.size(32.dp)
                                                ) {
                                                    Icon(Icons.Default.CheckCircle, null, tint = if (image.isAvatar) MaterialTheme.colorScheme.primary else Color.White)
                                                }
                                                IconButton(
                                                    onClick = {
                                                        imageOpsLoading = true
                                                        roomViewModel.deleteImage(roomId.toInt(), image.id) { _, message ->
                                                            imageOpsLoading = false
                                                            Toast.makeText(context, message, Toast.LENGTH_SHORT).show()
                                                        }
                                                    },
                                                    modifier = Modifier.size(32.dp)
                                                ) {
                                                    Icon(Icons.Default.Delete, null, tint = Color.White)
                                                }
                                            }
                                        }
                                    }
                                }
                                if (rowImages.size == 1) Spacer(modifier = Modifier.weight(1f))
                            }
                        }
                    }
                }
            } else {
                if (selectedImageUris.isNotEmpty()) {
                    LazyRow(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier.height(120.dp)
                    ) {
                        items(selectedImageUris) { uri ->
                            Box(contentAlignment = Alignment.TopEnd) {
                                AsyncImage(
                                    model = uri,
                                    contentDescription = null,
                                    contentScale = ContentScale.Crop,
                                    modifier = Modifier.fillMaxHeight().aspectRatio(1f).clip(RoundedCornerShape(8.dp))
                                )
                                IconButton(onClick = { selectedImageUris = selectedImageUris.filter { it != uri } }) {
                                    Icon(Icons.Default.Delete, null, tint = MaterialTheme.colorScheme.error)
                                }
                            }
                        }
                    }
                } else {
                    Text("Chưa chọn ảnh nào", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.outline)
                }
            }
            Spacer(modifier = Modifier.height(16.dp))
        }

        // Nút lưu cố định ở dưới
        Button(
            onClick = {
                if (name.isBlank() || price.isBlank()) {
                    Toast.makeText(context, "Vui lòng nhập tên và giá phòng", Toast.LENGTH_SHORT).show()
                    return@Button
                }
                val priceVal = price.toLongOrNull()
                if (priceVal == null || priceVal <= 0) {
                    Toast.makeText(context, "Giá phòng không hợp lệ", Toast.LENGTH_SHORT).show()
                    return@Button
                }

                isLoading = true
                scope.launch {
                    try {
                        val role = currentUser?.role
                        val idChuTro = if (role == "CHU_TRO") currentUser?.id?.toIntOrNull() else 1
                        val actualChuTro = idChuTro ?: 1

                        var newOrEditedRoomId: Int? = null

                        if (isEdit) {
                            val req = UpdateRoomRequest(ten_phong = name, gia_phong = priceVal, mo_ta = description, trang_thai = null)
                            val res = RetrofitInstance.api.updateRoom(roomId.toInt(), req)
                            newOrEditedRoomId = res.id_phong
                            Toast.makeText(context, "Cập nhật thành công", Toast.LENGTH_SHORT).show()
                        } else {
                            val req = CreateRoomRequest(id_chu_tro = actualChuTro, ten_phong = name, gia_phong = priceVal, mo_ta = description)
                            val res = RetrofitInstance.api.createRoom(req)
                            newOrEditedRoomId = res.id_phong
                            // Upload Images if any
                            if (newOrEditedRoomId != null && selectedImageUris.isNotEmpty()) {
                                Toast.makeText(context, "Đang tải ảnh lên...", Toast.LENGTH_SHORT).show()
                                val files = selectedImageUris.mapNotNull { FileUtils.uriToFile(context, it) }
                                if (files.isNotEmpty()) {
                                    roomViewModel.uploadImages(newOrEditedRoomId, files) { success, message ->
                                        if (success) {
                                            Toast.makeText(context, "Tải ảnh hoàn tất", Toast.LENGTH_SHORT).show()
                                        } else {
                                            Toast.makeText(context, "Lỗi upload ảnh: $message", Toast.LENGTH_LONG).show()
                                        }
                                    }
                                }
                            }
                            Toast.makeText(context, "Tạo phòng thành công", Toast.LENGTH_SHORT).show()
                        }

                        roomViewModel.loadRooms()
                        navController.previousBackStackEntry?.savedStateHandle?.set("refresh", true)
                        navController.popBackStack()
                    } catch (e: Exception) {
                        Toast.makeText(context, "Lỗi: ${e.message}", Toast.LENGTH_LONG).show()
                    } finally {
                        isLoading = false
                    }
                }
            },
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
                .height(50.dp),
            enabled = !isLoading
        ) {
            if (isLoading) {
                CircularProgressIndicator(modifier = Modifier.size(24.dp), color = MaterialTheme.colorScheme.onPrimary)
            } else {
                Text(if (isEdit) "Lưu thay đổi" else "Thêm phòng")
            }
        }
    }
}
