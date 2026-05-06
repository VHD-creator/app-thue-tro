package com.nhom55.myapplication.feature.chatbot

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.nhom55.myapplication.core.network.RetrofitInstance
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class Message(
    val text: String,
    val isUser: Boolean
)

sealed class ChatUiState {
    object Idle : ChatUiState()
    object Loading : ChatUiState()
    data class Success(val reply: String) : ChatUiState()
    data class Error(val message: String) : ChatUiState()
}

class ChatViewModel : ViewModel() {
    private val _messages = MutableStateFlow<List<Message>>(listOf(
        Message("Xin chào! 👋 Mình là trợ lý ảo Phòng Trọ 55. Bạn cần hỗ trợ tìm phòng hay giải đáp thắc mắc gì không?", false)
    ))
    val messages = _messages.asStateFlow()

    private val _uiState = MutableStateFlow<ChatUiState>(ChatUiState.Idle)
    val uiState = _uiState.asStateFlow()

    fun sendMessage(text: String) {
        if (text.isBlank()) return

        // Add user message to list
        val currentMessages = _messages.value.toMutableList()
        currentMessages.add(Message(text, true))
        _messages.value = currentMessages

        viewModelScope.launch {
            _uiState.value = ChatUiState.Loading
            try {
                // Convert current messages to history format
                // Lấy tất cả ngoại trừ tin nhắn cuối cùng (là tin nhắn vừa nhập)
                val allMessages = _messages.value
                val history = allMessages.take(allMessages.size - 1).map { msg ->
                    ChatHistoryItem(
                        role = if (msg.isUser) "user" else "model",
                        parts = listOf(ChatPart(msg.text))
                    )
                }.drop(1) // Bỏ qua lời chào mặc định ban đầu vì backend đã tự thêm

                val request = ChatRequest(
                    message = text,
                    history = history
                )
                
                val response = RetrofitInstance.chatApi.sendMessage(request)
                
                // Add AI reply to list
                val updatedMessages = _messages.value.toMutableList()
                updatedMessages.add(Message(response.reply, false))
                _messages.value = updatedMessages
                
                _uiState.value = ChatUiState.Success(response.reply)
            } catch (e: Exception) {
                _uiState.value = ChatUiState.Error(e.message ?: "Lỗi kết nối AI")
            }
        }
    }
}
