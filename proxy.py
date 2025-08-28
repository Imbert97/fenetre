import js, asyncio 

async def send_to_proxy(event=None):
    api_key = js.document.getElementById("apiKey").value.strip()
    file_input = js.document.getElementById("imageUpload")
    prompt = js.document.getElementById("prompt").value
    out = js.document.getElementById("iaResponse")

    if not api_key or file_input.files.length == 0:
        out.textContent = "⚠️ Fournis ta clé API et une image !"
        return

    file = file_input.files.item(0)
    form_data = js.FormData.new()
    form_data.append("apiKey", api_key)
    form_data.append("prompt", prompt)
    form_data.append("image", file)

    try:
        resp = await js.fetch("http://localhost:5000/api/analyse", {
            "method": "POST",
            "body": form_data
        })
        text = await resp.text()
        out.textContent = text
    except Exception as e:
        out.textContent = f"❌ Erreur : {e}"
