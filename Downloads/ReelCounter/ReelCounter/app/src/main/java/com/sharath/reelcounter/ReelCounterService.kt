package com.sharath.reelcounter

import android.accessibilityservice.AccessibilityService
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.drawable.GradientDrawable
import android.os.SystemClock
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.view.accessibility.AccessibilityEvent
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast

/**
 * Watches Instagram / YouTube. When the Reels / Shorts screen is on top and the
 * user swipes to another reel, the count goes up. A floating pill shows the count
 * and a dialog appears when the limit is reached.
 *
 * NOTE: view IDs below belong to the other apps and can change when they update.
 */
class ReelCounterService : AccessibilityService() {

    private val platforms = mapOf(
        "com.instagram.android" to Prefs.INSTAGRAM,
        "com.google.android.youtube" to Prefs.YOUTUBE
    )

    // Views that exist only on the Reels / Shorts screen
    private val reelViewIds = mapOf(
        "com.instagram.android" to listOf(
            "com.instagram.android:id/clips_viewer_view_pager"
        ),
        "com.google.android.youtube" to listOf(
            "com.google.android.youtube:id/reel_recycler",
            "com.google.android.youtube:id/reel_player_page_container"
        )
    )

    private val ignoredPackages = setOf("com.android.systemui", "com.google.android.inputmethod.latin")

    private lateinit var wm: WindowManager
    private var pill: TextView? = null
    private var dialog: View? = null

    private var lastIndex = -1
    private var lastCountTime = 0L
    private var nextAlertAt = 0
    private var currentDay = ""
    private var lastPush = 0L
    private var lastBlock = 0L

    private var cachePkg = ""
    private var cacheTime = 0L
    private var cacheVal = false

    override fun onServiceConnected() {
        wm = getSystemService(WINDOW_SERVICE) as WindowManager
        resetAlert()
    }

    private fun resetAlert() {
        val limit = Prefs.getLimit(this).coerceAtLeast(1)
        val total = Prefs.totalToday(this)
        nextAlertAt = limit * (total / limit + 1)
        currentDay = Prefs.today()
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent) {
        val pkg = event.packageName?.toString() ?: return
        val platform = platforms[pkg]

        if (platform == null) {
            if (pkg !in ignoredPackages && pkg != packageName) {
                hidePill(); lastIndex = -1
            }
            return
        }
        if (Prefs.today() != currentDay) resetAlert()

        // Limit reached + blocking on: kick the user out of the Reels screen (or the whole app)
        if (Prefs.isBlocked(this) && (Prefs.blockWhole(this) || inReels(pkg))) {
            enforceBlock()
            return
        }

        when (event.eventType) {
            AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED,
            AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED -> {
                if (inReels(pkg)) showPill() else { hidePill(); lastIndex = -1 }
            }
            AccessibilityEvent.TYPE_VIEW_SCROLLED -> {
                if (inReels(pkg)) { showPill(); handleScroll(event, platform) }
            }
        }
    }

    private fun handleScroll(event: AccessibilityEvent, platform: String) {
        val now = SystemClock.elapsedRealtime()
        if (now - lastCountTime < 350) return          // debounce drag noise

        val idx = event.fromIndex
        val shouldCount: Boolean
        if (idx >= 0) {
            shouldCount = lastIndex != -1 && idx != lastIndex   // first event = baseline
            lastIndex = idx
        } else {
            shouldCount = now - lastCountTime > 800              // fallback when no index
        }
        if (!shouldCount) return

        lastCountTime = now
        val total = Prefs.increment(this, platform).let { Prefs.totalToday(this) }
        updatePill()
        if (now - lastPush > 60_000) { lastPush = now; CloudSync.pushToday(this) }
        if (Prefs.isBlocked(this)) { CloudSync.pushToday(this); enforceBlock() }
        else if (total >= nextAlertAt) showLimitDialog(total)
    }

    /** True when the Reels/Shorts pager is currently on screen (cached 400 ms). */
    private fun inReels(pkg: String): Boolean {
        val now = SystemClock.elapsedRealtime()
        if (pkg == cachePkg && now - cacheTime < 400) return cacheVal
        val root = rootInActiveWindow ?: return cacheVal
        var found = false
        for (id in reelViewIds[pkg].orEmpty()) {
            if (root.findAccessibilityNodeInfosByViewId(id).isNotEmpty()) { found = true; break }
        }
        cachePkg = pkg; cacheTime = now; cacheVal = found
        return found
    }

    // ---------------- blocking ----------------

    private fun enforceBlock() {
        val now = SystemClock.elapsedRealtime()
        if (now - lastBlock < 1500) return           // avoid repeating while the app closes
        lastBlock = now
        hidePill(); closeDialog()
        performGlobalAction(GLOBAL_ACTION_HOME)
        Toast.makeText(this, "Daily reel limit reached 🚫 Blocked until tomorrow", Toast.LENGTH_LONG).show()
    }

    // ---------------- floating counter ----------------

    private fun showPill() {
        if (pill == null) {
            val tv = TextView(this).apply {
                setTextColor(Color.WHITE)
                textSize = 14f
                setPadding(36, 18, 36, 18)
            }
            val lp = WindowManager.LayoutParams(
                WindowManager.LayoutParams.WRAP_CONTENT,
                WindowManager.LayoutParams.WRAP_CONTENT,
                WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE,
                PixelFormat.TRANSLUCENT
            ).apply { gravity = Gravity.TOP or Gravity.END; x = 24; y = 220 }
            wm.addView(tv, lp)
            pill = tv
        }
        updatePill()
    }

    private fun updatePill() {
        val tv = pill ?: return
        val total = Prefs.totalToday(this)
        val limit = Prefs.getLimit(this)
        tv.text = "Reels: $total / $limit"
        tv.background = GradientDrawable().apply {
            cornerRadius = 60f
            setColor(if (total >= limit) 0xDDD32F2F.toInt() else 0xCC000000.toInt())
        }
    }

    private fun hidePill() {
        pill?.let { runCatching { wm.removeView(it) } }
        pill = null
    }

    // ---------------- limit reminder ----------------

    private fun showLimitDialog(total: Int) {
        if (dialog != null) return
        val limit = Prefs.getLimit(this).coerceAtLeast(1)

        val box = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(60, 50, 60, 40)
            background = GradientDrawable().apply { cornerRadius = 40f; setColor(Color.WHITE) }
        }
        box.addView(TextView(this).apply {
            text = "Time check ⏰"; textSize = 20f; setTextColor(Color.BLACK)
        })
        box.addView(TextView(this).apply {
            text = "You've watched $total reels today (limit $limit).\nTake a break?"
            textSize = 15f; setTextColor(0xFF444444.toInt()); setPadding(0, 20, 0, 30)
        })
        box.addView(Button(this).apply {
            text = "Take a break"
            setOnClickListener {
                nextAlertAt = total + limit
                closeDialog()
                performGlobalAction(GLOBAL_ACTION_HOME)
            }
        })
        box.addView(Button(this).apply {
            text = "Continue 10 more"
            setOnClickListener { nextAlertAt = total + 10; closeDialog() }
        })

        val lp = WindowManager.LayoutParams(
            (resources.displayMetrics.widthPixels * 0.85).toInt(),
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_DIM_BEHIND,
            PixelFormat.TRANSLUCENT
        ).apply { gravity = Gravity.CENTER; dimAmount = 0.6f }
        wm.addView(box, lp)
        dialog = box
    }

    private fun closeDialog() {
        dialog?.let { runCatching { wm.removeView(it) } }
        dialog = null
    }

    override fun onInterrupt() { hidePill(); closeDialog() }
    override fun onDestroy() { hidePill(); closeDialog(); super.onDestroy() }
}
