package com.sharath.reelcounter

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.text.InputType
import android.util.Patterns
import android.view.Gravity
import android.view.View
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.UserProfileChangeRequest
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore

/**
 * Email + password login / sign-up with Firebase Authentication.
 * Passwords are handled by Firebase and are never stored by this app.
 * The profile (name, email) is saved in Firestore under users/{uid}.
 */
class LoginActivity : Activity() {

    private val auth by lazy { FirebaseAuth.getInstance() }
    private val db by lazy { FirebaseFirestore.getInstance() }

    private var isRegister = false

    private lateinit var title: TextView
    private lateinit var nameInput: EditText
    private lateinit var emailInput: EditText
    private lateinit var passInput: EditText
    private lateinit var actionBtn: Button
    private lateinit var toggleText: TextView
    private lateinit var forgotText: TextView
    private lateinit var busy: ProgressBar

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        if (auth.currentUser != null) {
            goHome()
            return
        }

        val col = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(64, 64, 64, 64)
        }
        col.fitsSystemWindows = true
        setContentView(col)

        col.addView(TextView(this).apply { text = "Reel Counter"; textSize = 30f })
        title = TextView(this).apply { textSize = 16f; setPadding(0, 8, 0, 32) }
        col.addView(title)

        nameInput = EditText(this).apply { hint = "Your name"; setSingleLine() }
        emailInput = EditText(this).apply {
            hint = "Email"; setSingleLine()
            inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS
        }
        passInput = EditText(this).apply {
            hint = "Password (min 6 characters)"; setSingleLine()
            inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_PASSWORD
        }
        col.addView(nameInput)
        col.addView(emailInput)
        col.addView(passInput)

        actionBtn = Button(this).apply { setOnClickListener { submit() } }
        col.addView(actionBtn)

        busy = ProgressBar(this).apply { visibility = View.GONE }
        col.addView(busy)

        forgotText = TextView(this).apply {
            text = "Forgot password?"
            textSize = 14f
            setPadding(0, 32, 0, 8)
            setOnClickListener { resetPassword() }
        }
        col.addView(forgotText)

        toggleText = TextView(this).apply {
            textSize = 15f
            setPadding(0, 16, 0, 8)
            setOnClickListener { isRegister = !isRegister; render() }
        }
        col.addView(toggleText)

        render()
    }

    private fun render() {
        title.text = if (isRegister) "Create your account" else "Log in to continue"
        nameInput.visibility = if (isRegister) View.VISIBLE else View.GONE
        actionBtn.text = if (isRegister) "Sign up" else "Log in"
        forgotText.visibility = if (isRegister) View.GONE else View.VISIBLE
        toggleText.text = if (isRegister) "Already have an account? Log in" else "New here? Create an account"
    }

    private fun submit() {
        val email = emailInput.text.toString().trim()
        val pass = passInput.text.toString()
        val name = nameInput.text.toString().trim()

        if (!Patterns.EMAIL_ADDRESS.matcher(email).matches()) return toast("Enter a valid email")
        if (pass.length < 6) return toast("Password must be at least 6 characters")
        if (isRegister && name.isEmpty()) return toast("Enter your name")

        setBusy(true)
        if (isRegister) register(name, email, pass) else login(email, pass)
    }

    private fun login(email: String, pass: String) {
        auth.signInWithEmailAndPassword(email, pass).addOnCompleteListener { task ->
            if (task.isSuccessful) {
                // bring back saved history from the cloud, then open the app
                CloudSync.pullAll(this) { goHome() }
            } else {
                setBusy(false)
                toast(task.exception?.message ?: "Login failed")
            }
        }
    }

    private fun register(name: String, email: String, pass: String) {
        auth.createUserWithEmailAndPassword(email, pass).addOnCompleteListener { task ->
            val user = auth.currentUser
            if (task.isSuccessful && user != null) {
                user.updateProfile(UserProfileChangeRequest.Builder().setDisplayName(name).build())
                val profile = hashMapOf<String, Any>(
                    "name" to name,
                    "email" to email,
                    "createdAt" to FieldValue.serverTimestamp()
                )
                db.collection("users").document(user.uid).set(profile)
                    .addOnCompleteListener { goHome() }
            } else {
                setBusy(false)
                toast(task.exception?.message ?: "Sign up failed")
            }
        }
    }

    private fun resetPassword() {
        val email = emailInput.text.toString().trim()
        if (!Patterns.EMAIL_ADDRESS.matcher(email).matches()) return toast("Type your email above first")
        auth.sendPasswordResetEmail(email).addOnCompleteListener { t ->
            toast(if (t.isSuccessful) "Reset link sent to $email" else t.exception?.message ?: "Failed")
        }
    }

    private fun setBusy(b: Boolean) {
        busy.visibility = if (b) View.VISIBLE else View.GONE
        actionBtn.isEnabled = !b
    }

    private fun goHome() {
        startActivity(Intent(this, MainActivity::class.java))
        finish()
    }

    private fun toast(m: String) = Toast.makeText(this, m, Toast.LENGTH_LONG).show()
}
