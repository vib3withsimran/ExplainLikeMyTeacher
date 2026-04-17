/**
 * Gradio API client for React Native.
 *
 * Uses the /queue/join + /queue/data SSE pattern which is the reliable
 * protocol for this Gradio space. The /call/ two-step pattern was returning
 * 404 errors on the SSE stream even though upload and event creation succeeded.
 *
 * Verified working via direct Python testing against the live server.
 *
 * Flow:
 *   1. POST /gradio_api/upload?session_hash=X   → upload file, get path
 *   2. POST /gradio_api/queue/join               → submit job with file + question
 *   3. GET  /gradio_api/queue/data?session_hash=X → SSE stream with result
 */

const SPACE_URL = "https://ayushi18270-explain-like-my-teacher.hf.space";
const MINDMAP_SPACE_URL = "https://ayushi18270-teach-like-my-teacher.hf.space";
const API_PREFIX = "/gradio_api";

/**
 * Upload a file to the Gradio space and get back the server file path.
 */
async function uploadFile(
  fileUri: string,
  fileName: string,
  mimeType: string,
  sessionHash: string,
  baseUrl: string = SPACE_URL
): Promise<string> {
  const formData = new FormData();

  formData.append("files", {
    uri: fileUri,
    name: fileName,
    type: mimeType,
  } as any);

  const response = await fetch(
    `${baseUrl}${API_PREFIX}/upload?session_hash=${sessionHash}`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`File upload failed (${response.status}): ${text}`);
  }

  const result = await response.json();
  if (!Array.isArray(result) || result.length === 0) {
    throw new Error("Invalid response from upload server.");
  }

  // Server returns a list of path strings, e.g. ["/tmp/gradio/.../file.mp3"]
  const uploadedPath = result[0];
  console.log("File uploaded to server path:", uploadedPath);
  return uploadedPath;
}

/**
 * Read the /queue/data SSE stream using XMLHttpRequest.
 *
 * The queue/data stream sends JSON-only lines (no event: prefix).
 * Each line is: data: {msg: "...", ...}
 *
 * Message sequence:
 *   estimation → process_starts → process_completed
 */
function readQueueStream(
  url: string,
  targetEventId: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.setRequestHeader("Accept", "text/event-stream");

    let resultData: string | null = null;
    let lastProcessedIndex = 0;

    const parseChunk = (text: string) => {
      const lines = text.split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data:")) continue;

        const jsonStr = trimmed.substring(5).trim();
        if (!jsonStr) continue;

        try {
          const msg = JSON.parse(jsonStr);

          // Only process messages for our specific event
          if (msg.event_id && msg.event_id !== targetEventId) continue;

          if (msg.msg === "process_completed") {
            if (msg.success === false) {
              const errorMsg =
                msg.output?.error ||
                "Processing failed on the server. The file may be too large or in an unsupported format.";
              reject(new Error(errorMsg));
              xhr.abort();
              return;
            }

            // Successful result: output.data is [teacher_answer, audio_path]
            if (
              msg.output?.data &&
              Array.isArray(msg.output.data) &&
              msg.output.data.length > 0
            ) {
              resultData = msg.output.data[0] as string;
              resolve(resultData);
              xhr.abort();
              return;
            }
          }

          if (msg.msg === "process_starts") {
            console.log("AI processing started...");
          }

          if (msg.msg === "estimation") {
            console.log(
              `Queue position: ${msg.rank}, queue size: ${msg.queue_size}`
            );
          }
        } catch (e) {
          // Not valid JSON, skip
        }
      }
    };

    xhr.onprogress = () => {
      const newText = xhr.responseText.substring(lastProcessedIndex);
      lastProcessedIndex = xhr.responseText.length;
      parseChunk(newText);
    };

    xhr.onload = () => {
      // Final parse of any remaining data
      if (resultData === null) {
        const remaining = xhr.responseText.substring(lastProcessedIndex);
        if (remaining) parseChunk(remaining);
      }

      if (resultData === null) {
        console.warn(
          "Full queue/data response:",
          xhr.responseText.substring(0, 2000)
        );
        reject(
          new Error(
            "No result found in AI response. The model may still be loading — please try again."
          )
        );
      }
    };

    xhr.onerror = () => {
      reject(new Error("Network error connecting to AI service"));
    };

    xhr.ontimeout = () => {
      reject(new Error("AI request timed out (2 min limit)"));
    };

    xhr.timeout = 120000; // 2 minute timeout
    xhr.send();
  });
}

/**
 * Call the run_pipeline endpoint on the Gradio space.
 *
 * Uses the /queue/join + /queue/data pattern:
 *   1. POST /gradio_api/upload             → upload file
 *   2. POST /gradio_api/queue/join         → submit job, get event_id
 *   3. GET  /gradio_api/queue/data         → SSE stream with result
 */
export async function askTeacher(
  fileUri: string | null,
  fileName: string | null,
  mimeType: string | null,
  question: string,
  language: string = "english"
): Promise<string> {
  const sessionHash = Math.random().toString(36).substring(2);

  // --- Step 1: Upload the file ---
  if (!fileUri || !fileName || !mimeType) {
    throw new Error("Please upload a lecture file first.");
  }

  let uploadedPath: string;
  try {
    uploadedPath = await uploadFile(fileUri, fileName, mimeType, sessionHash);
  } catch (e: any) {
    console.warn("File upload failed:", e);
    throw new Error(
      `Upload failed: ${e.message || "Please check your internet connection."}`
    );
  }

  // Build the FileData object expected by Gradio
  const filePayload = {
    path: uploadedPath,
    orig_name: fileName,
    meta: { _type: "gradio.FileData" },
  };

  console.log("Starting Gradio request with session:", sessionHash);

  // --- Step 2: Submit job via /queue/join ---
  const joinResponse = await fetch(
    `${SPACE_URL}${API_PREFIX}/queue/join`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: [filePayload, question, language],
        fn_index: 2,
        session_hash: sessionHash,
      }),
    }
  );

  if (!joinResponse.ok) {
    const errorText = await joinResponse.text();
    console.error("Gradio /queue/join error:", errorText);
    throw new Error(`AI request failed (${joinResponse.status})`);
  }

  const joinResult = await joinResponse.json();
  const eventId = joinResult.event_id;

  if (!eventId) {
    throw new Error("No event_id returned from AI service");
  }

  console.log("Gradio job queued, event_id:", eventId);

  // --- Step 3: Listen for result via /queue/data SSE ---
  const answer = await readQueueStream(
    `${SPACE_URL}${API_PREFIX}/queue/data?session_hash=${sessionHash}`,
    eventId
  );

  return answer;
}

/**
 * Call the /process endpoint to generate a mindmap JSON tree from an image or PDF.
 *
 * Uses the classic Gradio /call/ two-step SSE pattern:
 *   1. POST /gradio_api/call/process  → { event_id: "xxx" }
 *   2. GET  /gradio_api/call/process/{event_id}  → SSE stream
 *      event: complete
 *      data: [<mindmap json tree>]
 */
export async function generateMindmap(
  fileUri: string,
  fileName: string,
  mimeType: string
): Promise<any> {
  const sessionHash = Math.random().toString(36).substring(2);

  // --- Step 1: Upload the file to the MINDMAP space ---
  let uploadedPath: string;
  try {
    uploadedPath = await uploadFile(fileUri, fileName, mimeType, sessionHash, MINDMAP_SPACE_URL);
  } catch (e: any) {
    throw new Error(
      `Upload failed: ${e.message || "Please check your internet connection."}`
    );
  }

  const filePayload = {
    path: uploadedPath,
    orig_name: fileName,
    meta: { _type: "gradio.FileData" },
  };

  console.log("Starting mindmap generation for:", fileName);

  // --- Step 2: POST /gradio_api/call/process to the MINDMAP space ---
  const callResponse = await fetch(`${MINDMAP_SPACE_URL}${API_PREFIX}/call/process`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: [filePayload] }),
  });

  if (!callResponse.ok) {
    const errText = await callResponse.text();
    throw new Error(
      `Mindmap request failed (${callResponse.status}): ${errText}`
    );
  }

  const callResult = await callResponse.json();
  const eventId = callResult.event_id;

  if (!eventId) {
    throw new Error("No event_id returned from mindmap service");
  }

  console.log("Mindmap job queued, event_id:", eventId);

  // --- Step 3: Stream from /gradio_api/call/process/{event_id} ---
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(
      "GET",
      `${MINDMAP_SPACE_URL}${API_PREFIX}/call/process/${eventId}`,
      true
    );
    xhr.setRequestHeader("Accept", "text/event-stream");

    let lastIndex = 0;
    let resolved = false;

    const parseChunk = (text: string) => {
      // SSE format:
      //   event: generating\ndata: null\n\n
      //   event: complete\ndata: [result]\n\n
      //   event: error\ndata: "error message"\n\n
      const lines = text.split("\n");
      let currentEvent = "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("event:")) {
          currentEvent = trimmed.substring(6).trim();
        } else if (trimmed.startsWith("data:")) {
          const jsonStr = trimmed.substring(5).trim();
          if (!jsonStr) continue;

          if (currentEvent === "error") {
            resolved = true;
            reject(new Error("Mindmap generation failed on the server. Please try a clearer image."));
            xhr.abort();
            return;
          }

          if (currentEvent === "complete") {
            try {
              const parsed = JSON.parse(jsonStr);
              if (Array.isArray(parsed) && parsed.length > 0) {
                resolved = true;
                resolve(parsed[0]);
                xhr.abort();
                return;
              }
            } catch (e) {
              console.warn("Failed to parse mindmap result JSON:", e);
            }
          }
        }
      }
    };

    xhr.onprogress = () => {
      const newText = xhr.responseText.substring(lastIndex);
      lastIndex = xhr.responseText.length;
      parseChunk(newText);
    };

    xhr.onload = () => {
      if (resolved) return;
      // Final parse pass
      const remaining = xhr.responseText.substring(lastIndex);
      if (remaining) parseChunk(remaining);
      if (!resolved) {
        console.warn(
          "Full mindmap response:",
          xhr.responseText.substring(0, 2000)
        );
        reject(
          new Error(
            "No mindmap data in response. The model may still be loading — please try again."
          )
        );
      }
    };

    xhr.onerror = () =>
      reject(new Error("Network error connecting to mindmap service"));
    xhr.ontimeout = () =>
      reject(new Error("Mindmap request timed out (2 min limit)"));

    xhr.timeout = 120000;
    xhr.send();
  });
}
