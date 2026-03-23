package com.nhom55.myapplication.core.utils

import java.text.SimpleDateFormat
import java.util.Locale

object DateFormatter {
    fun formatDateOnly(dateString: String?): String? {
        if (dateString.isNullOrEmpty()) return null
        return try {
            // Case 1: Thường từ Node.js (Sequelize) về sẽ có dạng ISO 8601
            if (dateString.contains("T")) {
                val parser = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault())
                // parser.timeZone = TimeZone.getTimeZone("UTC") // Nếu cần chỉnh timezone
                val date = parser.parse(dateString)
                val formatter = SimpleDateFormat("dd/MM/yyyy", Locale.getDefault())
                date?.let { formatter.format(it) } ?: dateString
            } 
            // Case 2: Đã định dạng yyyy-MM-dd
            else if (dateString.matches(Regex("\\d{4}-\\d{2}-\\d{2}"))) {
                val parts = dateString.split("-")
                "${parts[2]}/${parts[1]}/${parts[0]}"
            }
            // Case 3: Đã định dạng kiểu khác hoặc bị lỗi, trả về nguyên gốc
            else {
                dateString
            }
        } catch (e: Exception) {
            // Nếu parse lỗi, dùng chiêu substring đơn giản (yyyy-MM-dd)
            try {
                if (dateString.length >= 10 && dateString[4] == '-' && dateString[7] == '-') {
                    val y = dateString.substring(0, 4)
                    val m = dateString.substring(5, 7)
                    val d = dateString.substring(8, 10)
                    "$d/$m/$y"
                } else {
                    dateString
                }
            } catch (ex: Exception) {
                dateString
            }
        }
    }
}
