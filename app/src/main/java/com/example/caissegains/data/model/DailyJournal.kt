package com.example.caissegains.data.model

import kotlinx.serialization.Serializable

@Serializable
data class DailyJournal(
    val id: String,
    val date: String, // YYYY-MM-DD
    val title: String = "",
    val productName: String = "Pain / Baguette",
    val unitSellingPrice: Long = 175L,
    val unitReturnPrice: Long = 50L,
    val unitCostPrice: Long = 100L,
    val sellers: List<SellerEntry> = emptyList(),
    val expenses: List<ExpenseEntry> = emptyList(),
    val summary: JournalSummary = JournalSummary(),
    val notes: String = "",
    val createdAt: String = "",
    val updatedAt: String = ""
)
