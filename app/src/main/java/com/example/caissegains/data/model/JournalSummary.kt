package com.example.caissegains.data.model

import kotlinx.serialization.Serializable

@Serializable
data class JournalSummary(
    val totalProducedOrGiven: Int = 0,
    val totalSold: Int = 0,
    val totalReturned: Int = 0,
    val totalLost: Int = 0,
    val lossPerReturnUnit: Long = 0L,
    val returnLossAmount: Long = 0L,
    val missingLossAmount: Long = 0L,
    val grossRevenue: Long = 0L,
    val returnPriceTotal: Long = 0L,
    val lossAmount: Long = 0L,
    val totalExpenses: Long = 0L,
    val netGain: Long = 0L,
    val salePercentage: Float = 0f,
    val returnPercentage: Float = 0f,
    val lossPercentage: Float = 0f
)
