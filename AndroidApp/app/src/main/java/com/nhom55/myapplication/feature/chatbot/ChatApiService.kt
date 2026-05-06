package com.nhom55.myapplication.feature.chatbot

import retrofit2.http.Body
import retrofit2.http.POST

data class ChatPart(
    val text: String
)

data class ChatHistoryItem(
    val role: String, // "user" hoặc "model"
    val parts: List<ChatPart>
)

data class ChatRequest(
    val message: String,
    val history: List<ChatHistoryItem> = emptyList()
)

data class ChatResponse(
    val reply: String
)

interface ChatApiService {
    @POST("api/chatbot")
    suspend fun sendMessage(@Body request: ChatRequest): ChatResponse
}
