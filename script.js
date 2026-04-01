import { Client } from "https://cdn.jsdelivr.net/npm/@gradio/client/+esm";

document.getElementById("fileInput").addEventListener("change", function() {
    const fileName = this.files[0] ? this.files[0].name : "No Video Selected";
    document.getElementById("fileName").innerText = fileName;
}); 
function speakText(text) {
    const speech = new SpeechSynthesisUtterance(text);

    speech.lang = "en-US";
    speech.rate = 0.85;
    speech.pitch = 1;

    let voices = window.speechSynthesis.getVoices();

    if (voices.length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
            voices = window.speechSynthesis.getVoices();
            speech.voice = voices.find(v => v.name.includes("Google")) || voices[0];
            window.speechSynthesis.speak(speech);
        };
    } else {
        speech.voice = voices.find(v => v.name.includes("Google")) || voices[0];
        window.speechSynthesis.speak(speech);
    }
}  

async function sendData() {
    document.getElementById("result").innerText = "Generating answer...";

    const file = document.getElementById("fileInput").files[0];
    const question = document.getElementById("question").value;

    try {
        const client = await Client.connect(
            "ayushi18270/Explain-like-my-teacher"
        );

        const result = await client.predict("/run_pipeline", {
            file: file,
            question: question
        });

        const answerText = result.data[0];

        document.getElementById("result").innerText =
            "Answer: " + answerText;

        speakText(answerText.substring(0, 500));

    } catch (error) {
        console.error(error);
        document.getElementById("result").innerText =
            "Error generating answer";
    }
}
window.sendData = sendData;