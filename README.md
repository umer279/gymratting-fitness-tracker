# 🤖 Workout Plan to JSON Converter

To convert your workout plans (images or text) into the correct format for this project, share the following prompt with an AI like Gemini, ChatGPT, or Claude.

---

### 📝 The Prompt

**Copy and paste the text below into your AI assistant:**

> Act as a fitness data specialist. Your task is to convert the provided workout plan into a structured JSON format.
>
> ### 1. Available Enums
> You must strictly use these values for categories and types:
> - **ExerciseCategory:** `Chest`, `Back`, `Biceps`, `Triceps`, `Legs`, `Shoulders`, `Cardio`, `Core`
> - **ExerciseType:** `Strength`, `Cardio`
>
> ### 2. Extraction Rules
> 1. **Sets Calculation:** The `numberOfSets` must be the **total sum** of "Set di riscaldamento" (warmup) and the work "Set".
> 2. **Notes:** If warmup sets are present, add the note "{N} riscaldamento" (e.g., "2 riscaldamento").
> 3. **Category Mapping:** Map the exercise to the most appropriate enum (e.g., Hack Squat -> `Legs`).
> 4. **Names:** Keep the original exercise name as written in the source.
>
> ### 3. Output Format
> Provide only the raw JSON following this structure:
> ```json
> {
>   "name": "Workout Name",
>   "exercises": [
>     {
>       "exercise": {
>         "name": "String",
>         "category": "ExerciseCategory",
>         "exerciseType": "ExerciseType"
>       },
>       "planDetails": {
>         "numberOfSets": Number,
>         "repRange": "String (e.g. 8-12)",
>         "notes": "String (optional)"
>       }
>     }
>   ]
> }
> ```
>
> **Now, please process the attached plan/image.**


## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Set `VITE_MOCK_USER_ENABLED="true"` in [.env](.env)
3. Run the app:
   `npm run dev`
