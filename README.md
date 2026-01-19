# 🤖 Workout Plan to JSON Converter

To convert your workout plans (images or text) into the correct format for this project, share the following prompt with an AI like Gemini, ChatGPT, or Claude.

---

### 📝 The Prompt

**Copy and paste the text below into your AI assistant:**

> Act as a fitness data specialist. Your task is to convert the provided workout plan into a structured JSON format.
># System Prompt: Fitness Data Specialist
>
>Act as a fitness data specialist. Your task is to convert the provided workout plan into a structured JSON format.
>
>## 1. Available Enums
>You must strictly use these values for categories and types:
>* **ExerciseCategory:** `Chest`, `Back`, `Biceps`, `Triceps`, `Legs`, `Shoulders`, `Cardio`, `Core`
>* **ExerciseType:** `Strength`, `Cardio`
>
>## 2. Extraction Rules
>
>1.  **Sets separation:**
>    * `numberOfSets`: Extract the count of **working sets** only.
>    * `numberOfWarmupSets`: Extract the count of **warmup sets**. If no warmup sets are listed, omit this field.
>2.  **Notes Formatting:**
>    * If warmup sets are present, extract the specific instructions for each warmup set.
>    * Format them as a single string containing bracketed items numbered sequentially.
>    * *Example:* `"[1. 40-50% load x 12-15 rep], [2. 65% load x 5-6 rep]"`
>    * If there are no specific warmup instructions, omit the `notes` field unless there are other specific execution notes.
>3.  **Timestamps:**
>    * Generate a current ISO 8601 timestamp for the `created_at` field (e.g., `2026-01-18T13:27:02.234401+00:00`).
>4.  **Category Mapping:**
>    * Map the exercise to the most appropriate enum (e.g., Hack Squat -> `Legs`).
>5.  **Names:**
>    * Keep the original exercise name exactly as written in the source.
>
>## 3. Output Format
>
>Provide **only** the raw JSON following this structure:
>
>```json
>{
>  "name": "Workout Name",
>  "exercises": [
>    {
>      "exercise": {
>        "name": "String",
>        "category": "ExerciseCategory",
>        "exerciseType": "ExerciseType",
>        "created_at": "ISO8601 Timestamp String"
>      },
>      "planDetails": {
>        "notes": "String (optional, format: [1. ...], [2. ...])",
>        "repRange": "String (e.g. 8-12)",
>        "numberOfSets": Number,
>        "numberOfWarmupSets": Number
>      }
>    }
>  ]
>}
>```
> **Now, please process the attached plan/image.**


## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Set `VITE_MOCK_USER_ENABLED="true"` in [.env](.env)
3. Run the app:
   `npm run dev`
