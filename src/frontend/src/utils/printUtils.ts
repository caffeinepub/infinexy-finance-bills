/**
 * Trigger print for a specific element by ID using an iframe to isolate print content
 */
export function printElement(elementId: string): void {
  const el = document.getElementById(elementId);
  if (!el) {
    console.warn(`Element #${elementId} not found`);
    return;
  }

  // Get the inner HTML of the element
  const content = el.innerHTML;

  // Create an iframe for isolated printing
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "none";
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentWindow?.document;
  if (!iframeDoc) {
    document.body.removeChild(iframe);
    return;
  }

  // Write print-ready HTML into the iframe
  iframeDoc.open();
  iframeDoc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Print</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: Arial, sans-serif;
            background: white;
            color: #1a1a2e;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          @page {
            size: A4;
            margin: 12mm 14mm;
          }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #d0d8f0; padding: 7px 10px; font-size: 12px; }
          th { background: #1a2456 !important; color: white !important; font-weight: 600; }
          img { max-width: 100%; }
        </style>
      </head>
      <body>
        ${content}
      </body>
    </html>
  `);
  iframeDoc.close();

  // Wait for content to load then print
  iframe.onload = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e) {
      console.error("Print failed", e);
    }
    // Remove iframe after a delay to allow print dialog to open
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  };
}

/**
 * Download element content as PDF via print dialog
 */
export function downloadAsPDF(elementId: string, filename: string): void {
  const el = document.getElementById(elementId);
  if (!el) return;

  const content = el.innerHTML;

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "none";
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentWindow?.document;
  if (!iframeDoc) {
    document.body.removeChild(iframe);
    return;
  }

  iframeDoc.open();
  iframeDoc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${filename}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: Arial, sans-serif;
            background: white;
            color: #1a1a2e;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          @page {
            size: A4;
            margin: 12mm 14mm;
          }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #d0d8f0; padding: 7px 10px; font-size: 12px; }
          th { background: #1a2456 !important; color: white !important; font-weight: 600; }
          img { max-width: 100%; }
        </style>
      </head>
      <body>
        ${content}
      </body>
    </html>
  `);
  iframeDoc.close();

  iframe.onload = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e) {
      console.error("Download/print failed", e);
    }
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  };
}
