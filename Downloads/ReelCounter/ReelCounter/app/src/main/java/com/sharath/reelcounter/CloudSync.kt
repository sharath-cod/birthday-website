package com.sharath.reelcounter

import android.content.Context
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.CollectionReference
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore

/**
 * Firestore layout:
 *   users/{uid}                 -> { name, email, createdAt }
 *   users/{uid}/daily/{date}    -> { date, instagram, youtube, total, updatedAt }
 */
object CloudSync {

    private fun daily(): CollectionReference? {
        val uid = FirebaseAuth.getInstance().currentUser?.uid ?: return null
        return FirebaseFirestore.getInstance()
            .collection("users").document(uid).collection("daily")
    }

    /** Uploads today's counts. Firestore queues the write if the phone is offline. */
    fun pushToday(c: Context, onDone: ((Boolean) -> Unit)? = null) {
        val col = daily()
        if (col == null) {
            onDone?.invoke(false)
            return
        }
        val day = Prefs.today()
        val ig = Prefs.getCount(c, Prefs.INSTAGRAM, day)
        val yt = Prefs.getCount(c, Prefs.YOUTUBE, day)
        val data = hashMapOf<String, Any>(
            "date" to day,
            "instagram" to ig,
            "youtube" to yt,
            "total" to ig + yt,
            "updatedAt" to FieldValue.serverTimestamp()
        )
        col.document(day).set(data)
            .addOnSuccessListener { onDone?.invoke(true) }
            .addOnFailureListener { onDone?.invoke(false) }
    }

    /** Restores history after login / reinstall. Keeps the larger value per day. */
    fun pullAll(c: Context, onDone: () -> Unit) {
        val col = daily()
        if (col == null) {
            onDone()
            return
        }
        col.get()
            .addOnSuccessListener { snap ->
                for (doc in snap.documents) {
                    val day = doc.id
                    val ig = doc.getLong("instagram")?.toInt() ?: 0
                    val yt = doc.getLong("youtube")?.toInt() ?: 0
                    if (ig > Prefs.getCount(c, Prefs.INSTAGRAM, day)) Prefs.setCount(c, Prefs.INSTAGRAM, day, ig)
                    if (yt > Prefs.getCount(c, Prefs.YOUTUBE, day)) Prefs.setCount(c, Prefs.YOUTUBE, day, yt)
                }
                onDone()
            }
            .addOnFailureListener { onDone() }
    }
}
