# Workspace Coding Rules - CDR Platform

## No Mock or Simulated Data Policy

To ensure the accuracy and forensic integrity of the investigation workspace:
- **Strictly No Simulation:** Do not use, generate, or display simulated/mock data (such as fake subscriber names, random CNIC/NID numbers, generated addresses, or scaled indicators).
- **Direct Data Extraction:** All statistics, metrics, maps, routes, and logs must be derived exclusively and dynamically from the uploaded CDR dataset files.
- **Empty State Fallbacks:** If a particular attribute (like subscriber profile details, coordinates, cell transitions, or IMEI switches) is not present or cannot be computed from the file, display it as `"N/A"`, `"0"`, or `"Not available in CDR file"`. Do not create dummy fallback records.
