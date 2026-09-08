package com.example.caissegains.data.model

import kotlinx.serialization.Serializable

@Serializable
data class ExpenseEntry(
    val id: String,
    val label: String,
    val amount: Long
)
