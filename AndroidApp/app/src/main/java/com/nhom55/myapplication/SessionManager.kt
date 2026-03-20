package com.nhom55.myapplication

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

object SessionManager {
    private val _currentUser = MutableStateFlow<User?>(null)
    val currentUser: StateFlow<User?> = _currentUser.asStateFlow()

    private var _token: String? = null
    val token: String?
        get() = _token

    fun login(user: User, token: String) {
        this._token = token
        _currentUser.value = user
    }

    fun logout() {
        this._token = null
        _currentUser.value = null
    }
}
