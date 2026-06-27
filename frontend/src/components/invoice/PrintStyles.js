export default function PrintStyles() {
  return (
    <style>{`
      @page {
        size: A4;
        margin: 12mm 15mm;
      }
      @media print {
        .no-print { display: none !important; }
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .print-page { page-break-after: always; }
        .print-page:last-child { page-break-after: avoid; }
        .print-table tr { page-break-inside: avoid; }
      }
      .print-body {
        font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
        color: #111;
        line-height: 1.5;
      }
      .print-header-banner {
        background-color: #004B23;
        color: #fff;
        padding: 20px 24px;
        border-radius: 8px 8px 0 0;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .print-logo {
        width: 72px;
        height: 72px;
        border-radius: 50%;
        object-fit: cover;
        border: 2px solid rgba(255,255,255,0.3);
        flex-shrink: 0;
      }
      .print-company-name {
        font-size: 22px;
        font-weight: 900;
        letter-spacing: -0.3px;
      }
      .print-company-sub {
        font-size: 10px;
        opacity: 0.85;
        margin-top: 2px;
      }
      .print-company-contacts {
        font-size: 9px;
        opacity: 0.75;
        margin-top: 2px;
      }
      .print-company-right {
        text-align: right;
      }
      .print-section-title {
        font-size: 10px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: #004B23;
        border-bottom: 2px solid #004B23;
        padding-bottom: 4px;
        margin-bottom: 8px;
      }
      .print-meta-box {
        border: 1px solid #d1d5db;
        border-radius: 6px;
        padding: 10px 12px;
        font-size: 11px;
      }
      .print-meta-box .label {
        font-weight: 600;
        color: #6b7280;
        font-size: 9px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .print-meta-box .value {
        font-weight: 700;
        color: #111;
      }
      .print-table-wrap { overflow-x: auto; }
      .print-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 11px;
      }
      .print-table th {
        background-color: #004B23;
        color: #fff;
        padding: 8px 10px;
        text-align: left;
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .print-table th.right { text-align: right; }
      .print-table th.center { text-align: center; }
      .print-table td {
        padding: 7px 10px;
        border-bottom: 1px solid #e5e7eb;
      }
      .print-table td.right { text-align: right; }
      .print-table td.center { text-align: center; }
      .print-table tbody tr:last-child td { border-bottom: none; }
      .print-total-block {
        background-color: #004B23;
        color: #fff;
        padding: 8px 14px;
        border-radius: 6px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-weight: 900;
        font-size: 14px;
      }
      .print-footer-box {
        border: 1px solid #d1d5db;
        border-radius: 6px;
        padding: 10px 12px;
        font-size: 10px;
      }
      .print-footer-box .title {
        font-weight: 800;
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: #004B23;
        margin-bottom: 4px;
      }
      .print-checkbox-row {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 11px;
      }
      .print-checkbox {
        width: 14px;
        height: 14px;
        border: 1.5px solid #9ca3af;
        border-radius: 3px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .print-checkbox.checked {
        background-color: #004B23;
        border-color: #004B23;
      }
      .print-checkbox.checked::after {
        content: '✓';
        color: #fff;
        font-size: 10px;
        font-weight: 700;
      }
      .print-signature-line {
        border-top: 1.5px solid #111;
        width: 200px;
        margin-top: 6px;
        padding-top: 3px;
        font-size: 10px;
        font-weight: 600;
      }
    `}</style>
  );
}
