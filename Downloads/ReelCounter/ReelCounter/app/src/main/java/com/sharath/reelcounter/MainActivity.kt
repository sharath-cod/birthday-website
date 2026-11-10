package com.sharath.reelcounter

import android.app.Activity
import android.content.Intent
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.os.Bundle
import android.provider.Settings
import android.text.InputType
import android.view.Gravity
import android.widget.Button
import android.widget.CheckBox
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.ScrollView
import android.widget.TextView
import android.widget.Toast
import com.google.firebase.auth.FirebaseAuth
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale

class MainActivity : Activity() {

    // Assumption used for the time estimate (average Reel / Short length)
    private val secondsPerReel = 30

    private lateinit var bigCount: TextView
    private lateinit var subText: TextView
    private lateinit var progress: ProgressBar
    private lateinit var timeText: TextView
    private lateinit var levelCard: LinearLayout
    private lateinit var levelTitle: TextView
    private lateinit var levelBody: TextView
    private lateinit var weekText: TextView
    private lateinit var limitInput: EditText

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val user = FirebaseAuth.getInstance().currentUser
        if (user == null) {
            startActivity(Intent(this, LoginActivity::class.java))
            finish()
            return
        }

        val col = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(48, 64, 48, 48)
        }
        setContentView(ScrollView(this).apply { fitsSystemWindows = true; addView(col) })

        fun label(t: String, size: Float = 14f) = TextView(this).apply {
            text = t; textSize = size; setPadding(0, 28, 0, 8)
        }
        fun input(hint: String, value: String, password: Boolean = false) = EditText(this).apply {
            this.hint = hint; setText(value); setSingleLine()
            if (password) inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_PASSWORD
        }

        // ================= DASHBOARD =================
        col.addView(label("Reel Counter", 26f))
        col.addView(TextView(this).apply {
            text = "Signed in as ${user.displayName?.takeIf { it.isNotBlank() } ?: user.email}"
            textSize = 13f
        })
        col.addView(Button(this).apply {
            text = "Log out"
            setOnClickListener {
                FirebaseAuth.getInstance().signOut()
                Prefs.clearCounts(this@MainActivity)
                startActivity(Intent(this@MainActivity, LoginActivity::class.java))
                finish()
            }
        })
        col.addView(label("Reels watched today", 14f))

        bigCount = TextView(this).apply {
            textSize = 64f; gravity = Gravity.CENTER; setTextColor(Color.BLACK)
        }
        col.addView(bigCount)

        subText = TextView(this).apply { textSize = 14f; gravity = Gravity.CENTER }
        col.addView(subText)

        progress = ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal).apply {
            max = 100
            setPadding(0, 24, 0, 8)
        }
        col.addView(progress)

        timeText = TextView(this).apply { textSize = 15f; gravity = Gravity.CENTER; setPadding(0, 8, 0, 16) }
        col.addView(timeText)

        // harm / health card
        levelCard = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(40, 32, 40, 32)
        }
        levelTitle = TextView(this).apply { textSize = 20f; setTextColor(Color.WHITE) }
        levelBody = TextView(this).apply {
            textSize = 14f; setTextColor(Color.WHITE); setPadding(0, 12, 0, 0)
        }
        levelCard.addView(levelTitle)
        levelCard.addView(levelBody)
        col.addView(levelCard)

        col.addView(label("Last 7 days", 16f))
        weekText = TextView(this).apply { textSize = 14f; typeface = android.graphics.Typeface.MONOSPACE }
        col.addView(weekText)

        // ================= SETUP =================
        col.addView(label("1. Turn on the counter service (Installed apps → Reel Counter → ON)"))
        col.addView(Button(this).apply {
            text = "Open Accessibility settings"
            setOnClickListener { startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)) }
        })

        col.addView(label("2. Daily reel limit (Instagram + YouTube combined)"))
        limitInput = input("e.g. 30", Prefs.getLimit(this).toString()).apply {
            inputType = InputType.TYPE_CLASS_NUMBER
        }
        col.addView(limitInput)
        col.addView(Button(this).apply {
            text = "Save limit"
            setOnClickListener {
                val v = limitInput.text.toString().toIntOrNull()
                if (v == null || v < 1) toast("Enter a number ≥ 1")
else if (Prefs.isBlocked(this@MainActivity) && v > Prefs.getLimit(this@MainActivity))
                    toast("Locked until tomorrow: you can't raise the limit after reaching it")
                else { Prefs.setLimit(this@MainActivity, v); toast("Limit set to $v"); refresh() }
            }
        })

        col.addView(CheckBox(this).apply {
            text = "Block Instagram/YouTube when the limit is reached"
            isChecked = Prefs.blockEnabled(this@MainActivity)
            setOnCheckedChangeListener { btn, checked ->
                if (!checked && Prefs.isBlocked(this@MainActivity)) {
                    btn.isChecked = true
                    toast("Locked until tomorrow: you can't turn blocking off after reaching the limit")
                } else {
                    Prefs.setBlockEnabled(this@MainActivity, checked)
                    refresh()
                }
            }
        })
        col.addView(CheckBox(this).apply {
            text = "Block the whole app (unticked = only Reels / Shorts)"
            isChecked = Prefs.blockWhole(this@MainActivity)
            setOnCheckedChangeListener { btn, checked ->
                if (!checked && Prefs.isBlocked(this@MainActivity) && Prefs.blockWhole(this@MainActivity)) {
                    btn.isChecked = true
                    toast("Locked until tomorrow")
                } else {
                    Prefs.setBlockWhole(this@MainActivity, checked)
                }
            }
        })

        col.addView(label("3. GitHub backup (optional)"))
        val owner = input("GitHub username", Prefs.gh(this, "owner"))
        val repo = input("Private repo name", Prefs.gh(this, "repo"))
        val branch = input("Branch (default main)", Prefs.gh(this, "branch"))
        val token = input("Personal access token", Prefs.gh(this, "token"), password = true)
        listOf(owner, repo, branch, token).forEach { col.addView(it) }
        col.addView(Button(this).apply {
            text = "Save & backup to GitHub now"
            setOnClickListener {
                Prefs.setGh(this@MainActivity, "owner", owner.text.toString())
                Prefs.setGh(this@MainActivity, "repo", repo.text.toString())
                Prefs.setGh(this@MainActivity, "branch", branch.text.toString())
                Prefs.setGh(this@MainActivity, "token", token.text.toString())
                Thread {
                    val r = GitHubSync.push(this@MainActivity)
                    runOnUiThread { toast(r.getOrElse { it.message ?: "Failed" }) }
                }.start()
            }
        })
    }

    override fun onResume() {
        super.onResume()
        refresh()
    }

    private fun refresh() {
        val ig = Prefs.getCount(this, Prefs.INSTAGRAM)
        val yt = Prefs.getCount(this, Prefs.YOUTUBE)
        val total = ig + yt
        val limit = Prefs.getLimit(this).coerceAtLeast(1)
        val ratio = total.toFloat() / limit

        bigCount.text = total.toString()
        subText.text = "Instagram $ig  ·  YouTube $yt  ·  Limit $limit"
        progress.progress = (ratio * 100).toInt().coerceAtMost(100)

        val mins = total * secondsPerReel / 60
        timeText.text = "≈ ${formatMinutes(mins)} spent today (estimated at ${secondsPerReel}s per reel)"

        val (color, title, body) = when {
            ratio < 0.5f -> Triple(
                0xFF2E7D32.toInt(), "Healthy 🟢",
                "You're in control today. Keep short-video time low and stay focused on your goals."
            )
            ratio < 1f -> Triple(
                0xFFEF6C00.toInt(), "Getting high 🟠",
                "You're close to your limit. Reels are built for endless scrolling with quick rewards, " +
                    "which makes it hard to stop. Consider putting the phone down soon."
            )
            else -> Triple(
                0xFFC62828.toInt(), "Too much 🔴",
                "You've crossed your limit. Heavy short-video use has been linked in studies to:\n" +
                    "• shorter attention span and poorer focus on study\n" +
                    "• worse sleep, especially at night\n" +
                    "• eye strain and neck pain\n" +
                    "• wasted time and low mood afterwards\n\n" +
                    "Take a break: drink water, stretch, or go for a short walk."
            )
        }
        levelCard.background = GradientDrawable().apply { cornerRadius = 36f; setColor(color) }
        levelTitle.text = title
        levelBody.text = body
        if (Prefs.isBlocked(this)) levelTitle.text = "Blocked until tomorrow 🔒"

        weekText.text = buildWeek(limit)
        CloudSync.pushToday(this)
    }

    private fun buildWeek(limit: Int): String {
        val dayFmt = SimpleDateFormat("yyyy-MM-dd", Locale.US)
        val nameFmt = SimpleDateFormat("EEE dd", Locale.getDefault())
        val cal = Calendar.getInstance()
        val sb = StringBuilder()
        repeat(7) {
            val d = dayFmt.format(cal.time)
            val n = Prefs.getCount(this, Prefs.INSTAGRAM, d) + Prefs.getCount(this, Prefs.YOUTUBE, d)
            val bar = "█".repeat((n * 10 / limit).coerceIn(0, 10))
            sb.append(String.format("%-7s %4d %s\n", nameFmt.format(cal.time), n, bar))
            cal.add(Calendar.DAY_OF_YEAR, -1)
        }
        return sb.toString().trimEnd()
    }

    private fun formatMinutes(m: Int) =
        if (m >= 60) "${m / 60} h ${m % 60} min" else "$m min"

    private fun toast(m: String) = Toast.makeText(this, m, Toast.LENGTH_LONG).show()
}
