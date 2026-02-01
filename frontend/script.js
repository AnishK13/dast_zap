async function startScan() {
  const urlInput = document.getElementById("urlInput");
  const scanBtn = document.getElementById("scanBtn");
  const output = document.getElementById("output");
  const url = urlInput.value.trim();

  if (!url) {
    output.textContent = "Please enter a URL.";
    return;
  }

  scanBtn.disabled = true;
  output.textContent = "Scanning...";

  try {
    const res = await fetch("http://localhost:3000/api/scan/dast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, quickScan: true })
    });

    const data = await res.json();
    output.textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    output.textContent = "Error: " + err.message;
  } finally {
    scanBtn.disabled = false;
  }
}
