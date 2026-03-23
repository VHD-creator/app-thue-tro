package com.nhom55.myapplication.feature.room

import android.content.Context
import android.net.Uri
import android.provider.OpenableColumns
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
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
import com.nhom55.myapplication.core.network.CreateRoomRequest
import com.nhom55.myapplication.core.network.RetrofitInstance
import com.nhom55.myapplication.core.network.UpdateRoomRequest
import com.nhom55.myapplication.core.session.SessionManager
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

    var name by remember { mutableStateOf("") }
    var price by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var selectedImageUris by remember { mutableStateOf<List<Uri>>(emptyList()) }
    var isLoading by remember { mutableStateOf(false) }

    val imagePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetMultipleContents()
    ) { uris: List<Uri> ->
        if (uris.size > 10) {
            Toast.makeText(context, "Chỉ được chọn tối đa 10 ảnh", Toast.LENGTH_SHORT).show()
            selectedImageUris = uris.take(10)
        } else {
            selectedImageUris = uris
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
        }
    }

    Column(modifier = Modifier.fillMaxSize()) {
        // Custom Header tránh lỗi double Insets của Scaffold lồng nhau
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
                .fillMaxSize()
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

            Text("Hình ảnh phòng (Tối đa 10 ảnh)", fontWeight = FontWeight.Bold)

            Button(
                onClick = { imagePickerLauncher.launch("image/*") },
                modifier = Modifier.fillMaxWidth()
            ) {
                Icon(Icons.Default.Add, contentDescription = null)
                Spacer(Modifier.width(8.dp))
                Text("Chọn ảnh từ thư viện")
            }

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
                                modifier = Modifier
                                    .fillMaxHeight()
                                    .aspectRatio(1f)
                            )
                            IconButton(onClick = {
                                selectedImageUris = selectedImageUris.filter { it != uri }
                            }) {
                                Icon(Icons.Default.Delete, contentDescription = "Xóa", tint = MaterialTheme.colorScheme.error)
                            }
                        }
                    }
                }
            } else {
                Text("Chưa chọn ảnh nào", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.outline)
            }

            Spacer(modifier = Modifier.weight(1f))

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
                            val idChuTro = if (role == "CHU_TRO") currentUser?.id?.toIntOrNull() else 1 // Dummy default
                            val actualChuTro = idChuTro ?: 1

                            var newOrEditedRoomId: Int? = null

                            if (isEdit) {
                                val req = UpdateRoomRequest(
                                    ten_phong = name,
                                    gia_phong = priceVal,
                                    mo_ta = description,
                                    trang_thai = null
                                )
                                val res = RetrofitInstance.api.updateRoom(roomId.toInt(), req)
                                newOrEditedRoomId = res.id_phong
                                Toast.makeText(context, "Cập nhật thành công", Toast.LENGTH_SHORT).show()
                            } else {
                                val req = CreateRoomRequest(
                                    id_chu_tro = actualChuTro,
                                    ten_phong = name,
                                    gia_phong = priceVal,
                                    mo_ta = description
                                )
                                val res = RetrofitInstance.api.createRoom(req)
                                newOrEditedRoomId = res.id_phong
                                Toast.makeText(context, "Tạo phòng thành công", Toast.LENGTH_SHORT).show()
                            }

                            // Upload Images if any
                            if (newOrEditedRoomId != null && selectedImageUris.isNotEmpty()) {
                                Toast.makeText(context, "Đang tải ảnh lên...", Toast.LENGTH_SHORT).show()
                                val parts = selectedImageUris.mapNotNull { uri ->
                                    val file = getFileFromUri(context, uri)
                                    val mimeType = context.contentResolver.getType(uri) ?: "image/jpeg"
                                    if (file != null) {
                                        val reqFile = file.asRequestBody(mimeType.toMediaTypeOrNull())
                                        MultipartBody.Part.createFormData("images", file.name, reqFile)
                                    } else null
                                }
                                if (parts.isNotEmpty()) {
                                    RetrofitInstance.api.uploadRoomImages(newOrEditedRoomId, parts)
                                    Toast.makeText(context, "Tải ảnh hoàn tất", Toast.LENGTH_SHORT).show()
                                }
                            }

                            roomViewModel.loadRooms()
                            navController.popBackStack()
                        } catch (e: Exception) {
                            Toast.makeText(context, "Lỗi: ${e.message}", Toast.LENGTH_LONG).show()
                        } finally {
                            isLoading = false
                        }
                    }
                },
                modifier = Modifier.fillMaxWidth().height(50.dp),
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
}

private fun getFileFromUri(context: Context, uri: Uri): File? {
    try {
        val inputStream = context.contentResolver.openInputStream(uri) ?: return null
        val cursor = context.contentResolver.query(uri, null, null, null, null)
        var name = "temp_image_${System.currentTimeMillis()}.jpg"
        if (cursor != null && cursor.moveToFirst()) {
            val nameIndex = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
            if (nameIndex != -1) {
                name = cursor.getString(nameIndex)
            }
            cursor.close()
        }
        val file = File(context.cacheDir, name)
        val outputStream = FileOutputStream(file)
        inputStream.copyTo(outputStream)
        inputStream.close()
        outputStream.close()
        return file
    } catch (e: Exception) {
        e.printStackTrace()
        return null
    }
}
