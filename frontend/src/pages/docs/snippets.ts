export const docSnippets = {
  curl: `curl https://api.ethiobridge.example/v1/extract \\
  -H "Authorization: Bearer $ETHIOBRIDGE_API_KEY" \\
  -F "file=@invoices.csv"`,
  node: `const form = new FormData();
form.append("file", fs.createReadStream("invoices.csv"));

const response = await fetch(
  "https://api.ethiobridge.example/v1/extract",
  {
    method: "POST",
    headers: { Authorization: \`Bearer \${process.env.ETHIOBRIDGE_API_KEY}\` },
    body: form
  }
);

const result = await response.json();`,
  python: `import os
import requests

with open("invoices.csv", "rb") as document:
    response = requests.post(
        "https://api.ethiobridge.example/v1/extract",
        headers={"Authorization": f"Bearer {os.environ['ETHIOBRIDGE_API_KEY']}"},
        files={"file": document},
    )

result = response.json()`,
};

export const responseJson = `{
  "status": "success",
  "data": {
    "fileType": "csv",
    "recordCount": 120,
    "records": [{ "invoiceId": "INV-042", "amount": 12800 }]
  },
  "metadata": { "processingTimeMs": 182 }
}`;
