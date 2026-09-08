package com.example.caissegains.data.model

import kotlinx.serialization.Serializable

@Serializable
data class SellerEntry(
    val id: String,
    val name: String,
    val phone: String = "",
    val age: Int = 25,
    val nationalId: String = "",
    val role: String = "Vendeur",
    val totalGiven: Int = 0,
    val soldCount: Int = 0,
    val returnCount: Int = 0,
    val lostCount: Int = 0,
    val cashCollected: Long = 0L,
    val notes: String = ""
)
