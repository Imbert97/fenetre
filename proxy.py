from flask import Flask, request, jsonify
import requests
import base64

app = Flask(__name__)

@app.route("/api/analyse", methods=["POST"])
def analyse():
    try:
        api_key = request.form.get("apiKey")
        prompt = request.form.get("prompt")
        file = request.files.get("image")

        if not api_key or not file:
            return jsonify({"error": "⚠️ Fournis une clé API et une image"}), 400

        # Convertir l’image en base64
        image_base64 = base64.b64encode(file.read()).decode("utf-8")

        # Payload pour Perplexity
        payload = {
            "model": "sonar-deep-research",
            "messages": [{
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": f"data:image/jpeg;base64,{image_base64}"}
                ]
            }]
        }

        headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}

        resp = requests.post("https://api.perplexity.ai/chat/completions", headers=headers, json=payload)
        return jsonify(resp.json())

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(port=5000, debug=True)
