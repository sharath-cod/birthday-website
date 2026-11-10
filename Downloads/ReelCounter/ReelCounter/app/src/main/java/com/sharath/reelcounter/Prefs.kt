package com.sharath.reelcounter

import android.content.Context
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/** Local storage: daily reel counts per platform + settings. */
object Prefs {
    const val INSTAGRAM = "instagram"
    const val YOUTUBE = "youtube"

    private fun sp(c: Context) = c.getSharedPreferences("reel_prefs", Context.MODE_PRIVATE)

    fun today(): String = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())

    // ---- limit ----
    fun getLimit(c: Context): Int = sp(c).getInt("limit", 30)
    fun setLimit(c: Context, v: Int) = sp(c).edit().putInt("limit", v).apply()

    // ---- blocking ----
    fun blockEnabled(c: Context): Boolean = sp(c).getBoolean("block", true)
    fun setBlockEnabled(c: Context, v: Boolean) = sp(c).edit().putBoolean("block", v).apply()
    fun blockWhole(c: Context): Boolean = sp(c).getBoolean("block_whole", false)
    fun setBlockWhole(c: Context, v: Boolean) = sp(c).edit().putBoolean("block_whole", v).apply()

    /** True once today's total has reached the limit and blocking is on. Resets by itself at midnight. */
    fun isBlocked(c: Context): Boolean = blockEnabled(c) && totalToday(c) >= getLimit(c)

    // ---- counts ----
    fun getCount(c: Context, platform: String, day: String = today()): Int =
        sp(c).getInt("c_${day}_$platform", 0)

    fun increment(c: Context, platform: String): Int {
        val n = getCount(c, platform) + 1
        sp(c).edit().putInt("c_${today()}_$platform", n).apply()
        return n
    }

    fun totalToday(c: Context): Int = getCount(c, INSTAGRAM) + getCount(c, YOUTUBE)

    fun setCount(c: Context, platform: String, day: String, v: Int) =
        sp(c).edit().putInt("c_${day}_$platform", v).apply()

    /** Called on logout so the next user does not see this user's counts. */
    fun clearCounts(c: Context) {
        val e = sp(c).edit()
        sp(c).all.keys.filter { it.startsWith("c_") }.forEach { e.remove(it) }
        e.apply()
    }

    // ---- GitHub backup settings ----
    fun gh(c: Context, key: String): String = sp(c).getString("gh_$key", "") ?: ""
    fun setGh(c: Context, key: String, v: String) = sp(c).edit().putString("gh_$key", v.trim()).apply()

    /** { "2026-11-10": { "instagram": 12, "youtube": 8 }, ... } */
    fun exportJson(c: Context): JSONObject {
        val root = JSONObject()
        for ((k, v) in sp(c).all) {
            if (!k.startsWith("c_") || v !is Int) continue
            val parts = k.removePrefix("c_").split("_")
            if (parts.size != 2) continue
            val day = root.optJSONObject(parts[0]) ?: JSONObject().also { root.put(parts[0], it) }
            day.put(parts[1], v)
        }
        return root
    }
}
