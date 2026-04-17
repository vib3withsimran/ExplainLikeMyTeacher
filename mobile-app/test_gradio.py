from gradio_client import Client, handle_file

client = Client("ayushi18270/Explain-like-my-teacher")
result = client.predict(
		file=handle_file('https://github.com/gradio-app/gradio/raw/main/test/test_files/audio_sample.wav'),
		question="What is this?",
		language="english",
		api_name="/run_pipeline"
)
print(result)
