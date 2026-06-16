# Antigravity CLI Reference & Tutorial Guide

This document lists practical task prompts and workflows that can be executed using **Antigravity CLI**. It serves as an interactive reference for testing LLM agent capabilities such as summarization, extraction, RAG, and content generation.

---

## 🧠 1. Summarizing Articles (Web + Local Files)

### A. Summarize a single web article
**Prompt:**
```text
Read this article:
https://medium.com/google-cloud/antigravity-cli-tutorial-series-12b46cfe3bf2

Summarize the top 3 key takeaways in simple bullet points. Keep it concise and practical.
```

### B. Summarize multiple web articles
**Prompt:**
```text
Search the web for the latest articles about "Antigravity CLI".
Take the top 5 relevant results.
For each article:
- Give a 2–3 sentence summary
- Include the URL
```
*Tip: If it struggles, force search:* `Use Google Search to find recent news about Antigravity CLI and then summarize top 5 results.`

### C. Summarize a local file (TXT)
**File:** `Documents/my_research_paper.txt`
**Prompt:**
```text
Open and read the file "Documents/my_research_paper.txt".
Summarize the main points with focus on:
- methodology
- conclusions
Keep it structured in bullet points.
```

### D. Summarize a PDF
**File:** `Documents/financial_report_Q2_2025.pdf`
**Prompt:**
```text
Read the file "Documents/financial_report_Q2_2025.pdf".
Provide a clear summary of:
- financial performance
- revenue trends
- key challenges
Use simple bullet points.
```

---

## 🔍 2. Extracting Specific Information

### A. Extract entities from text file
**File:** `Documents/biography.txt`
**Prompt:**
```text
Read "Documents/biography.txt".
Extract:
- all named people
- important dates mentioned
Return as a table with two columns: Entity | Detail
```

### B. Extract table from PDF
**File:** `Documents/quarterly_sales.pdf`
**Prompt:**
```text
Open "Documents/quarterly_sales.pdf".
Extract the table on page 3 titled "Product Sales by Region".
Convert it into a clean Markdown table.
```

### C. Extract headlines from news site
**Prompt:**
```text
Go to https://news.google.com/
Extract:
- main headlines on the front page
- source of each headline
Format as bullet points:
- Headline → Source
```

### D. Extract product info from web page
**Prompt:**
```text
Open this page:
https://www.amazon.in/Google-Cloud-Certified-Associate-Engineer/dp/1119871441

Extract:
- book title
- author
- price (if available)
- rating (if available)
Return as JSON.
```

### E. Extract duration from video
**File:** `Videos/sample_video.mp4`
**Prompt:**
```text
From the given video "Videos/sample_video.mp4", extract its total duration.
Return format like: 2h37m42s
```

---

## 🧩 3. Q&A (RAG-style tasks)

### A. Local document Q&A
**File:** `Documents/user_manual.pdf`
**Prompt:**
```text
Read "Documents/user_manual.pdf".
Answer:
What are the steps to troubleshoot network connectivity issues?
Be precise and only use information from the document.
```

### B. Web page Q&A
**Prompt:**
```text
Using this page:
https://www.who.int/news-room/fact-sheets/detail/climate-change-and-health

Answer:
What are the primary health risks caused by climate change?
Summarize clearly in bullet points.
```

### C. Compare two documents
**Files:** `Documents/article1.txt` and `Documents/article2.txt`
**Prompt:**
```text
Compare the following two files:
Documents/article1.txt
Documents/article2.txt

Focus on:
- differences in opinions
- impact on small businesses
Return a comparison table.
```

---

## ✍ 4. Content Generation

### A. News brief from file
**File:** `Documents/tech_innovation_article.txt`
**Prompt:**
```text
Read "Documents/tech_innovation_article.txt".
Write a 150-word news brief suitable for a company newsletter.
Make it engaging and simple.
```

### B. Email from meeting notes
**File:** `Documents/meeting_transcript.txt`
**Prompt:**
```text
Read "Documents/meeting_transcript.txt".
Write an email to the team summarizing:
- key decisions
- action items
- responsible persons
Keep tone professional.
```

---

## 🖼 5. Multimodal (Invoices / Images)

### Extract invoice details
**Folder:** `Images/` (Go through all images in this folder)
**Prompt:**
```text
Go through all image files in this folder.
Extract invoice details:
- Invoice No
- Invoice Date
- Invoice Sent By
- Due Date
- Due Amount
Return as a table.
```
**Advanced Condition Add-on:**
`Also add a column: "Overdue Status" → show ❌ if due date is in the past, otherwise ✔`

---

## 🧪 6. Data Generation Tasks

### JSON reviews
**Prompt:**
```text
Generate 3 customer reviews for a smartphone.
Each review must include:
- reviewId (UUID-like)
- productId ("SMARTPHONE_X")
- rating (1–5)
- reviewText (20–50 words)
- reviewDate (YYYY-MM-DD)
```

### Mock API sales data
**Prompt:**
```text
Generate JSON array of 7 daily sales records.
Fields:
- date (chronological)
- revenue (5000–20000)
- unitsSold (100–500)
- region (North/South/East/West)
```

### SQL inserts
**Prompt:**
```text
Generate 5 SQL INSERT statements for table "users":
Columns: id, username, email, password_hash, created_at
```

### CSV data
**Prompt:**
```text
Generate 10 rows CSV with header:
TransactionID, CustomerID, ItemPurchased, Quantity, UnitPrice, TransactionDate
```

### YAML config
**Prompt:**
```text
Generate YAML config for user_service including:
- database settings
- API keys (payment_gateway, email_service)
```
