from flask import Flask, render_template, jsonify, send_from_directory
from dotenv import load_dotenv
import os, requests, subprocess, json

load_dotenv()  
app = Flask(__name__)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
IMAGE_FOLDER = os.path.join(BASE_DIR, "static/media/images")  # adjust if needed
CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
API_KEY = os.getenv("GOOGLE_API_KEY")

@app.route("/config")
def config():
    return jsonify({
        "client_id": CLIENT_ID,
        "api_key": API_KEY
    })

@app.route("/")
def index():
    return render_template("index.html")  # serve your HTML page

@app.route("/slideshow-images")
def slideshow_images():
    print("Looking for images in:", IMAGE_FOLDER)
    print("Files found:", os.listdir(IMAGE_FOLDER))
    # Get all image files in the folder
    images = [f"/media/images/{file}" for file in os.listdir(IMAGE_FOLDER)
              if file.lower().endswith((".png", ".jpg", ".jpeg", ".gif"))]
    return jsonify(images)

# Serve the images statically
@app.route("/media/images/<path:filename>")
def serve_image(filename):
    return send_from_directory(IMAGE_FOLDER, filename)

# Get music code, this one is for jellyfin
def loginAndGetMusic():
    JELLYFIN_URL = os.getenv("JELLYFIN_URL")
    JELLYFIN_API_KEY = os.getenv("JELLYFIN_API_KEY")
    JELLYFIN_USER_ID = os.getenv("JELLYFIN_USER_ID")

    response = requests.get(
        f"{JELLYFIN_URL}/Users/{JELLYFIN_USER_ID}/Items",
        params={
            "IncludeItemTypes": "Audio",
            "Recursive": "true",
            "Fields": "Album,Artist,RunTimeTicks"
        },
        headers={"X-Emby-Token": JELLYFIN_API_KEY}
    )
    try:
        data = response.json()
    except Exception as e:
        print("JSON PARSE ERROR:", e)
        data = {"Items": []}  # fallback so Flask won't crash

    return data.get("Items", [])

@app.route("/api/music")
def music():
    musicDict = {}
    music = loginAndGetMusic()

    for item in music:
        artist = item['Artists'][0] if item['Artists'] else "Unknown Artist"
        album = item.get('Album', 'Unknown Album')
        songData = {
            "id": item['Id'],
            "title": item['Name', 'Unknown Title'],
            "duration": int(item['RunTimeTicks', 0] / 10_000_000)
        }

        if artist not in musicDict:
            musicDict[artist] = {}
        if album not in musicDict[artist]:
            musicDict[artist][album] = []
        musicDict[artist][album].append(songData)

    return jsonify(musicDict)



if __name__ == "__main__":
     app.run(host="127.0.0.1", port=5000, debug=True)