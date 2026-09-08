package com.example.caissegains.data.model

import kotlinx.serialization.Serializable

@Serializable
enum class CalculationFormula {
    EXCEL_SHEET_MODE,
    STANDARD_PROFIT_MODE
}

@Serializable
data class AppSettings(
    val businessName: String = "Boulangerie & Commerce",
    val businessType: String = "Boulangerie / Distribution / Commerce",
    val currency: String = "CFA",
    val defaultProductName: String = "Pain / Baguette",
    val defaultSellingPrice: Long = 175L,
    val defaultReturnPrice: Long = 50L,
    val defaultCostPrice: Long = 100L,
    val calculationFormula: CalculationFormula = CalculationFormula.EXCEL_SHEET_MODE,
    val notificationEmail: String = "papef4261@gmail.com",
    val notificationPhone: String = "",
    val autoSendMessageOnSave: Boolean = false
)
