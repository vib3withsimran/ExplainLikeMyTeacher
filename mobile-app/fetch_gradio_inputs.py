import urllib.request
import json

req = urllib.request.urlopen("https://ayushi18270-explain-like-my-teacher.hf.space/config")
data = json.loads(req.read())

components = {c["id"]: c for c in data["components"]}
for fn in data["dependencies"]:
    if fn.get("api_name") == "run_pipeline":
        for i, inId in enumerate(fn["inputs"]):
            c = components[inId]
            label = c.get("props", {}).get("label", "")
            comp_type = c.get("type", "")
            print(f"Input {i}: component id={inId}, type={comp_type}, label={label}")
