/**
 * Gradio API client for React Native.
 * Uses the /call/ endpoint pattern (Gradio 4+) which produces a finite SSE stream
 * that completes after the result is ready, making it compatible with React Native.
 * 
 * From the /config endpoint:
 *   - api_prefix: /gradio_api
 *   - run_pipeline: fn_index 2, api_name "run_pipeline"
 *   - inputs: [file, question, language]
 *   - protocol: sse_v3
 */

const SPACE_URL = "https://ayushi18270-explain-like-my-teacher.hf.space";
const API_PREFIX = "/gradio_api";

/**
 * Upload a file to the Gradio space and get back the server file metadata.
 */
async function uploadFile(
  fileUri: string,
  fileName: string,
  mimeType: string
): Promise<{ path: string; url: string | null; orig_name: string; mime_type: string; meta: { _type: string } }> {
  const formData = new FormData();

  formData.append("files", {
    uri: fileUri,
    name: fileName,
    type: mimeType,
  } as any);

  const response = await fetch(`${SPACE_URL}${API_PREFIX}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`File upload failed (${response.status}): ${text}`);
  }

  const result = await response.json();
  const uploadedPath = result[0];

  return {
    path: uploadedPath,
    url: null,
    orig_name: fileName,
    mime_type: mimeType,
    meta: { _type: "gradio.FileData" },
  };
}

/**
 * Read an SSE stream using XMLHttpRequest which supports incremental
 * reading in React Native, unlike fetch().
 */
function readSSEStream(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.setRequestHeader("Accept", "text/event-stream");

    let resultData: string | null = null;
    let lastProcessedIndex = 0;

    xhr.onprogress = () => {
      const newText = xhr.responseText.substring(lastProcessedIndex);
      lastProcessedIndex = xhr.responseText.length;

      // Parse SSE events from new chunk
      const blocks = newText.split("\n\n");
      for (const block of blocks) {
        const trimmed = block.trim();
        if (!trimmed) continue;

        let event = "";
        let data = "";

        for (const line of trimmed.split("\n")) {
          if (line.startsWith("event:")) {
            event = line.substring(6).trim();
          } else if (line.startsWith("data:")) {
            data = line.substring(5).trim();
          }
        }

        if (event === "complete" || event === "process_completed") {
          try {
            const parsed = JSON.parse(data);
            if (parsed.output?.data && Array.isArray(parsed.output.data)) {
              resultData = parsed.output.data[0] as string;
            } else if (Array.isArray(parsed) && parsed.length > 0) {
              resultData = parsed[0] as string;
            }
          } catch (e) {
            console.warn("Failed to parse SSE data:", data);
          }
        }

        if (event === "error") {
          try {
            const parsed = JSON.parse(data);
            reject(new Error(parsed.message || "AI processing error"));
            return;
          } catch {
            reject(new Error("AI processing error"));
            return;
          }
        }
      }
    };

    xhr.onload = () => {
      // Also try parsing the full response if onprogress didn't catch it
      if (!resultData) {
        const fullText = xhr.responseText;
        const blocks = fullText.split("\n\n");
        for (const block of blocks) {
          const trimmed = block.trim();
          if (!trimmed) continue;

          let event = "";
          let data = "";

          for (const line of trimmed.split("\n")) {
            if (line.startsWith("event:")) {
              event = line.substring(6).trim();
            } else if (line.startsWith("data:")) {
              data = line.substring(5).trim();
            }
          }

          if (event === "complete" || event === "process_completed") {
            try {
              const parsed = JSON.parse(data);
              if (parsed.output?.data && Array.isArray(parsed.output.data)) {
                resultData = parsed.output.data[0] as string;
              } else if (Array.isArray(parsed) && parsed.length > 0) {
                resultData = parsed[0] as string;
              }
            } catch (e) {
              // skip
            }
          }
        }
      }

      if (resultData !== null) {
        resolve(resultData);
      } else {
        console.warn("Full SSE response:", xhr.responseText.substring(0, 2000));
        reject(new Error("No result found in AI response. The model may still be loading."));
      }
    };

    xhr.onerror = () => {
      reject(new Error("Network error connecting to AI service"));
    };

    xhr.ontimeout = () => {
      reject(new Error("AI request timed out"));
    };

    xhr.timeout = 120000; // 2 minute timeout
    xhr.send();
  });
}

/**
 * Call the run_pipeline endpoint on the Gradio space.
 * Uses the /call/ two-step pattern:
 *   1. POST /call/run_pipeline → get event_id
 *   2. GET  /call/run_pipeline/{event_id} → SSE stream with result
 */
export async function askTeacher(
  fileUri: string | null,
  fileName: string | null,
  mimeType: string | null,
  question: string,
  language: string = "english"
): Promise<string> {
  let filePayload: any = null;

  // If we have a file, upload it first
  if (fileUri && fileName && mimeType) {
    try {
      filePayload = await uploadFile(fileUri, fileName, mimeType);
    } catch (e) {
      console.warn("File upload failed, proceeding without file:", e);
    }
  }

  // Step 1: POST to /call/run_pipeline to get an event_id
  const callResponse = await fetch(`${SPACE_URL}${API_PREFIX}/call/run_pipeline`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: [filePayload, question, language],
    }),
  });

  if (!callResponse.ok) {
    const errorText = await callResponse.text();
    console.error("Gradio /call/ error:", errorText);
    throw new Error(`AI request failed (${callResponse.status}): ${errorText}`);
  }

  const callResult = await callResponse.json();
  const eventId = callResult.event_id;

  if (!eventId) {
    throw new Error("No event_id returned from AI service");
  }

  // Step 2: GET the SSE stream using XMLHttpRequest
  const answer = await readSSEStream(
    `${SPACE_URL}${API_PREFIX}/call/run_pipeline/${eventId}`
  );

  return answer;
}
