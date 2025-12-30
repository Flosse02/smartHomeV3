from flask import Flask, render_template, jsonify, send_from_directory
from dotenv import load_dotenv
import os

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

if __name__ == "__main__":
     app.run(host="127.0.0.1", port=5000, debug=True)
