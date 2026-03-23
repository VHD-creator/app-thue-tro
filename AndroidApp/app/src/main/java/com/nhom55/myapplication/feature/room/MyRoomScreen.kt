package com.nhom55.myapplication.feature.room

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import com.nhom55.myapplication.core.network.RetrofitInstance
import retrofit2.HttpException

@Composable
fun MyRoomScreen(navController: NavController) {
    var isLoading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Unit) {
        try {
            val room = RetrofitInstance.api.getMyRentedRoom()
            isLoading = false
            navController.navigate("room_detail/${room.id_phong}") {
                popUpTo("my_room") { inclusive = true }
            }
        } catch (e: HttpException) {
            isLoading = false
            error = if (e.code() == 404) {
                "Bạn chưa thuê phòng nào"
            } else {
                "Lỗi máy chủ: ${e.message()}"
            }
        } catch (e: Exception) {
            isLoading = false
            error = "Đã xảy ra lỗi kết nối mạng"
        }
    }

    if (isLoading) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            CircularProgressIndicator()
        }
    } else if (error != null) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(text = error!!, color = MaterialTheme.colorScheme.error)
                Spacer(modifier = Modifier.height(16.dp))
                Button(onClick = { navController.popBackStack() }) {
                    Text("Quay lại")
                }
            }
        }
    }
}
