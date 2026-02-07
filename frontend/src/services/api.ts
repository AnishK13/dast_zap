const BASE_URL = "http://localhost:3000/api/scan";

export const scanAPI = {
  runDast: (url: string) => 
    fetch(`${BASE_URL}/dast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, quickScan: true })
    }).then(res => res.json()),

  runSast: (data: any) => 
    fetch(`${BASE_URL}/sast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => res.json()),
    
  // Add Container and App scan methods similarly...
};