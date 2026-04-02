package com.nhom55.myapplication.core.utils

import android.content.Context
import android.net.Uri
import java.io.File
import java.io.FileOutputStream
import java.io.InputStream

object FileUtils {
    fun uriToFile(context: Context, uri: Uri): File? {
        val contentResolver = context.contentResolver
        val mimeType = contentResolver.getType(uri)
        val extension = android.webkit.MimeTypeMap.getSingleton().getExtensionFromMimeType(mimeType) ?: "jpg"
        val fileName = "temp_image_${System.currentTimeMillis()}.$extension"
        val tempFile = File(context.cacheDir, fileName)
        
        return try {
            val inputStream: InputStream? = contentResolver.openInputStream(uri)
            val outputStream = FileOutputStream(tempFile)
            inputStream?.use { input ->
                outputStream.use { output ->
                    input.copyTo(output)
                }
            }
            tempFile
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }
}
