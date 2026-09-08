package com.example.caissegains.domain

import com.example.caissegains.data.model.CalculationFormula
import com.example.caissegains.data.model.ExpenseEntry
import com.example.caissegains.data.model.JournalSummary
import com.example.caissegains.data.model.SellerEntry
import java.text.NumberFormat
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.Locale
import kotlin.math.max

object CalculationEngine {

    fun calculateJournalSummary(
        sellers: List<SellerEntry>,
        unitSellingPrice: Long,
        unitReturnPrice: Long,
        unitCostPrice: Long,
        expenses: List<ExpenseEntry> = emptyList(),
        formula: CalculationFormula = CalculationFormula.EXCEL_SHEET_MODE
    ): JournalSummary {
        var totalProducedOrGiven = 0
        var totalSold = 0
        var totalReturned = 0
        var totalLost = 0

        for (seller in sellers) {
            val given = max(0, seller.totalGiven)
            val sold = max(0, seller.soldCount)
            val returned = max(0, seller.returnCount)
            val lost = max(0, given - (sold + returned))

            totalProducedOrGiven += given
            totalSold += sold
            totalReturned += returned
            totalLost += lost
        }

        val grossRevenue = totalSold.toLong() * unitSellingPrice
        val returnPriceTotal = totalReturned.toLong() * unitReturnPrice

        // Perte par pain de retour : Prix Vente - Prix Retour (ex: 175 - 50 = 125 CFA)
        val lossPerReturnUnit = max(0L, unitSellingPrice - unitReturnPrice)
        // Perte sur retours : totalReturned * lossPerReturnUnit
        val returnLossAmount = totalReturned.toLong() * lossPerReturnUnit
        // Perte sur pains manquants / écarts non justifiés : totalLost * unitSellingPrice
        val missingLossAmount = totalLost.toLong() * unitSellingPrice
        // Total des pertes constatées
        val lossAmount = returnLossAmount + missingLossAmount

        val totalExpenses = expenses.sumOf { max(0L, it.amount) }

        // Mode feuille Excel de caisse : Gagné Net = grossRevenue + returnPriceTotal - totalExpenses
        // Mode standard : grossRevenue + returnPriceTotal - COGS - lossAmount - totalExpenses
        val netGain = if (formula == CalculationFormula.EXCEL_SHEET_MODE) {
            grossRevenue + returnPriceTotal - totalExpenses
        } else {
            val cogs = totalSold.toLong() * unitCostPrice
            grossRevenue + returnPriceTotal - cogs - lossAmount - totalExpenses
        }

        val salePercentage = if (totalProducedOrGiven > 0) {
            (totalSold.toFloat() / totalProducedOrGiven.toFloat()) * 100f
        } else 0f

        val returnPercentage = if (totalProducedOrGiven > 0) {
            (totalReturned.toFloat() / totalProducedOrGiven.toFloat()) * 100f
        } else 0f

        val lossPercentage = if (totalProducedOrGiven > 0) {
            ((totalReturned + totalLost).toFloat() / totalProducedOrGiven.toFloat()) * 100f
        } else 0f

        return JournalSummary(
            totalProducedOrGiven = totalProducedOrGiven,
            totalSold = totalSold,
            totalReturned = totalReturned,
            totalLost = totalLost,
            lossPerReturnUnit = lossPerReturnUnit,
            returnLossAmount = returnLossAmount,
            missingLossAmount = missingLossAmount,
            grossRevenue = grossRevenue,
            returnPriceTotal = returnPriceTotal,
            lossAmount = lossAmount,
            totalExpenses = totalExpenses,
            netGain = netGain,
            salePercentage = salePercentage,
            returnPercentage = returnPercentage,
            lossPercentage = lossPercentage
        )
    }

    fun formatNumber(value: Long): String {
        val format = NumberFormat.getInstance(Locale.FRANCE)
        return format.format(value).replace('\u00A0', ' ')
    }

    fun formatCurrency(amount: Long, currency: String = "CFA"): String {
        return "${formatNumber(amount)} $currency"
    }

    fun formatDateFrench(dateString: String): String {
        if (dateString.isBlank()) return ""
        return try {
            val parsed = LocalDate.parse(dateString, DateTimeFormatter.ISO_LOCAL_DATE)
            val formatter = DateTimeFormatter.ofPattern("EEEE d MMMM yyyy", Locale.FRENCH)
            val formatted = parsed.format(formatter)
            formatted.replaceFirstChar { if (it.isLowerCase()) it.titlecase(Locale.FRENCH) else it.toString() }
        } catch (_: Exception) {
            dateString
        }
    }
}
