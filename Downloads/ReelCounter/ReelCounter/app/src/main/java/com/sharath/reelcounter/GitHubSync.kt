package com.sharath.reelcounter

import android.content.Context
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.util.Base64

/**
 * GitHub is not a real database, so we use a (private) repo as a cloud backup:
 * all daily counts are written to reel-data/stats.json through the GitHub
 * Contents API. Needs a fine-grained Personal Access Token with
 * "Contents: Read and write" on that one repo.
 */
object GitHubSync {

    private const val PATH = "reel-data/stats.json"

    fun push(c: Context): Result<String> = runCatching {
        val owner = Prefs.gh(c, "owner")
        val repo = Prefs.gh(c, "repo")
        val token = Prefs.gh(c, "token")
        val branch = Prefs.gh(c, "branch").ifEmpty { "main" }
        require(owner.isNotEmpty() && repo.isNotEmpty() && token.isNotEmpty()) {
            "Fill GitHub owner, repo and token first"
        }

        val url = "https://api.github.com/repos/$owner/$repo/contents/$PATH"

        // 1) existing file sha (needed to update)
        val (getCode, getBody) = request("GET", "$url?ref=$branch", token, null)
        val sha = if (getCode == 200) JSONObject(getBody).getString("sha") else null

        // 2) upload
        val content = Base64.getEncoder()
            .encodeToString(Prefs.exportJson(c).toString(2).toByteArray())
        val body = JSONObject()
            .put("message", "Update reel stats ${Prefs.today()}")
            .put("content", content)
            .put("branch", branch)
        if (sha != null) body.put("sha", sha)

        val (putCode, putBody) = request("PUT", url, token, body.toString())
        if (putCode !in 200..201) error("GitHub error $putCode: ${putBody.take(150)}")
        "Backed up to $owner/$repo"
    }

    private fun request(method: String, url: String, token: String, body: String?): Pair<Int, String> {
        val conn = URL(url).openConnection() as HttpURLConnection
        conn.requestMethod = method
        conn.setRequestProperty("Authorization", "Bearer $token")
        conn.setRequestProperty("Accept", "application/vnd.github+json")
        conn.connectTimeout = 15000
        conn.readTimeout = 15000
        if (body != null) {
            conn.doOutput = true
            conn.setRequestProperty("Content-Type", "application/json")
            conn.outputStream.use { it.write(body.toByteArray()) }
        }
        val code = conn.responseCode
        val stream = if (code < 400) conn.inputStream else conn.errorStream
        val text = stream?.bufferedReader()?.use { it.readText() } ?: ""
        conn.disconnect()
        return code to text
    }
}
