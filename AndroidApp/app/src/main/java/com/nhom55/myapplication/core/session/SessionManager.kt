package com.nhom55.myapplication.core.session

import android.content.Context
import android.content.SharedPreferences
import com.google.gson.Gson
import com.nhom55.myapplication.navigation.User
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

object SessionManager {
    private const val PREF_NAME = "app_session"
    private const val KEY_TOKEN = "token"
    private const val KEY_USER = "user"

    private lateinit var prefs: SharedPreferences
    private val gson = Gson()

    private val _currentUser = MutableStateFlow<User?>(null)
    val currentUser: StateFlow<User?> = _currentUser.asStateFlow()

    private var _token: String? = null
    val token: String? get() = _token

    fun init(context: Context) {
        prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
        _token = prefs.getString(KEY_TOKEN, null)
        val userJson = prefs.getString(KEY_USER, null)
        if (userJson != null) {
            _currentUser.value = gson.fromJson(userJson, User::class.java)
        }
    }

    fun login(user: User, token: String) {
        _token = token
        _currentUser.value = user
        prefs.edit().apply {
            putString(KEY_TOKEN, token)
            putString(KEY_USER, gson.toJson(user))
            apply()
        }
    }

    fun logout() {
        _token = null
        _currentUser.value = null
        prefs.edit().clear().apply()
    }

    val isLoggedIn: Boolean get() = _token != null
}