import React, { useMemo, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import Report from './components/Report.jsx';
import { ingestFiles } from './lib/ingest.js';
import { buildMetrics } from './lib/metrics.js';
import { buildReportData } from './lib/reportContent.js';
import { monthLabelLong } from './lib/format.js';

function currentMonthKey(offset = 0) {
  const d = new Date();
  d.setMonth(d.getMonth() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function addMonths(monthKey, delta) {
  const [year, month] = monthKey.split('-').map(Number);
  const d = new Date(year, month - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthCountInclusive(startKey, endKey) {
  if (!startKey || !endKey) return 0;
  const [sy, sm] = startKey.split('-').map(Number);
  const [ey, em] = endKey.split('-').map(Number);
  return (ey - sy) * 12 + (em - sm) + 1;
}

async function requestAiAnalysis(metrics, transcriptText) {
  const body = {
    metrics: {
      dealerName: metrics.dealerName,
      periodLabel: metrics.periodLabel,
      revenue: metrics.revenue,
      grossProfit: metrics.grossProfit,
      grossMargin: metrics.grossMargin,
      operatingExpenses: metrics.operatingExpenses,
      netOperatingProfit: metrics.netOperatingProfit,
      nopMargin: metrics.nopMargin,
      unitSales: metrics.unitSales,
      newUnits: metrics.newUnits,
      usedUnits: metrics.usedUnits,
      frontEndGpMargin: metrics.frontEndGpMargin,
      fAndIPvr: metrics.fAndIPvr,
      financePenetration: metrics.financePenetration,
      service: metrics.service,
      parts: metrics.parts,
      capital: metrics.capital,
      monthly: metrics.monthly,
      departments: metrics.departments,
      oems: metrics.oems,
      sourceCounts: metrics.sourceCounts
    },
    transcriptText: (transcriptText || '').slice(0, 2000)
  };

  const response = await fetch('/.netlify/functions/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text ? `AI analysis failed (${response.status}): ${text}` : `AI analysis failed (${response.status})`);
  }
  return response.json();
}

async function exportReportPdf(fileName = 'HerohubOS-Executive-Report.pdf') {
  const pages = Array.from(document.querySelectorAll('.report-page'));
  if (!pages.length) throw new Error('No report pages found.');

  document.body.classList.add('exporting-pdf');
  await new Promise((resolve) => requestAnimationFrame(resolve));
  try {
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'in', format: [16, 9], compress: true });
    for (let i = 0; i < pages.length; i += 1) {
      const page = pages[i];
      const canvas = await html2canvas(page, {
        scale: 2,
        backgroundColor: null,
        useCORS: true,
        logging: false,
        windowWidth: 1600,
        windowHeight: 900
      });
      const img = canvas.toDataURL('image/jpeg', 0.95);
      if (i > 0) pdf.addPage([16, 9], 'landscape');
      pdf.addImage(img, 'JPEG', 0, 0, 16, 9);
    }
    pdf.save(fileName);
  } finally {
    document.body.classList.remove('exporting-pdf');
  }
}

function FileList({ files }) {
  if (!files?.length) return <span className="empty-file">No files selected</span>;
  return (
    <ul className="file-list">
      {Array.from(files).map((f) => <li key={`${f.name}-${f.size}`}>{f.name}</li>)}
    </ul>
  );
}

export default function App() {
  const [dataFiles, setDataFiles] = useState([]);
  const [transcriptFiles, setTranscriptFiles] = useState([]);
  const [dealerName, setDealerName] = useState('');
  // Default to the last fully closed month, not the current partial month.
  // Example: if today is June 2026, the default standard TTM window is June 2025 – May 2026.
  const defaultEndMonth = currentMonthKey(-1);
  const [reportStart, setReportStart] = useState(addMonths(defaultEndMonth, -11));
  const [reportEnd, setReportEnd] = useState(defaultEndMonth);
  const [dataStart, setDataStart] = useState(addMonths(defaultEndMonth, -11));
  const [dataEnd, setDataEnd] = useState(defaultEndMonth);
  const [useSeparateDataWindow, setUseSeparateDataWindow] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const reportRef = useRef(null);

  const periodPreview = useMemo(() => {
    if (!reportStart || !reportEnd) return 'Choose a period';
    return reportStart === reportEnd ? monthLabelLong(reportStart) : `${monthLabelLong(reportStart)} – ${monthLabelLong(reportEnd)}`;
  }, [reportStart, reportEnd]);

  const reportMonthCount = useMemo(() => monthCountInclusive(reportStart, reportEnd), [reportStart, reportEnd]);

  function setRolling12Ending(endKey = reportEnd) {
    if (!endKey) return;
    const startKey = addMonths(endKey, -11);
    setReportStart(startKey);
    setReportEnd(endKey);
    if (!useSeparateDataWindow) {
      setDataStart(startKey);
      setDataEnd(endKey);
    }
  }

  async function handleGenerate() {
    setError('');
    setStatus('Reading uploads…');
    setIsGenerating(true);
    try {
      if (!dataFiles.length) throw new Error('Upload at least one data file or ZIP.');
      if (reportStart > reportEnd) throw new Error('Report start month must be before report end month.');
      const activeDataStart = useSeparateDataWindow ? dataStart : reportStart;
      const activeDataEnd = useSeparateDataWindow ? dataEnd : reportEnd;
      if (activeDataStart > activeDataEnd) throw new Error('Data start month must be before data end month.');

      const ingested = await ingestFiles({ dataFiles, transcriptFiles });
      setStatus('Calculating financial and operating metrics…');
      const metrics = buildMetrics(ingested, {
        dealerName,
        reportStart,
        reportEnd,
        dataStart: activeDataStart,
        dataEnd: activeDataEnd
      });

      setStatus('Generating AI executive insights…');
      let ai = null;
      try {
        ai = await requestAiAnalysis(metrics, ingested.transcriptText);
      } catch (aiError) {
        console.warn(aiError);
        ai = { _warning: aiError.message };
      }

      const nextReport = buildReportData(metrics, ai);
      setReportData(nextReport);
      setStatus(ai?._warning ? `Report created. AI fallback used: ${ai._warning}` : `Report created with AI${ai?._model ? ` (${ai._model})` : ''}. Review the preview, then export the PDF.`);
      setTimeout(() => reportRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (err) {
      setError(err.message || String(err));
      setStatus('');
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleExport() {
    setError('');
    setStatus('Rendering PDF pages…');
    try {
      const name = reportData?.metrics?.dealerName ? `${reportData.metrics.dealerName.replace(/[^a-z0-9]+/gi, '-')}-Executive-Report.pdf` : 'HerohubOS-Executive-Report.pdf';
      await exportReportPdf(name);
      setStatus('PDF exported.');
    } catch (err) {
      setError(err.message || String(err));
      setStatus('');
    }
  }

  return (
    <div className="app-shell">
      <header className="app-hero">
        <div>
          <img className="app-logo-img" src="/herohub-os-logo.svg" alt="HerohubOS" />
          <h1>Executive Report Builder</h1>
          <p>Upload dealer data and onboarding transcripts, select the reporting period, run AI-assisted analysis, and export a HerohubOS-style landscape PDF.</p>
        </div>
        <div className="period-card">
          <span>Report Period</span>
          <strong>{periodPreview}</strong>
        </div>
      </header>

      <main className="builder-grid">
        <section className="builder-card">
          <h2>1. Upload source files</h2>
          <label className="upload-box">
            <span>Dealer data files</span>
            <input
              type="file"
              multiple
              accept=".zip,.csv,.xlsx,.xls"
              onChange={(e) => setDataFiles(Array.from(e.target.files || []))}
            />
            <small>Use ZIPs or individual CSV/XLSX files. Designed for GEN01, ACT01, ACT02, RPT11, RPT12, SVC01, PRT01.</small>
          </label>
          <FileList files={dataFiles} />
          <label className="upload-box">
            <span>Transcript files</span>
            <input
              type="file"
              multiple
              accept=".docx,.txt,.md"
              onChange={(e) => setTranscriptFiles(Array.from(e.target.files || []))}
            />
            <small>Upload one or more onboarding/operating-profile transcripts.</small>
          </label>
          <FileList files={transcriptFiles} />
        </section>

        <section className="builder-card">
          <h2>2. Set report scope</h2>
          <label>
            Dealer name override
            <input value={dealerName} placeholder="Optional; otherwise read from data" onChange={(e) => setDealerName(e.target.value)} />
          </label>
          <div className="date-grid">
            <label>
              Report start
              <input type="month" value={reportStart} onChange={(e) => setReportStart(e.target.value)} />
            </label>
            <label>
              Report end
              <input type="month" value={reportEnd} onChange={(e) => setReportEnd(e.target.value)} />
            </label>
          </div>
          <button className="secondary-button" type="button" onClick={() => setRolling12Ending(reportEnd)}>
            Use standard TTM: 12 months ending {reportEnd ? monthLabelLong(reportEnd) : 'selected month'}
          </button>
          {reportMonthCount && reportMonthCount !== 12 ? (
            <p className="scope-warning">
              This is a {reportMonthCount}-month period. Standard HerohubOS executive reports use exactly 12 months, e.g. June 2025 – May 2026.
            </p>
          ) : null}
          <label className="check-row">
            <input type="checkbox" checked={useSeparateDataWindow} onChange={(e) => setUseSeparateDataWindow(e.target.checked)} />
            Use a separate data analysis window
          </label>
          {useSeparateDataWindow ? (
            <div className="date-grid">
              <label>
                Data start
                <input type="month" value={dataStart} onChange={(e) => setDataStart(e.target.value)} />
              </label>
              <label>
                Data end
                <input type="month" value={dataEnd} onChange={(e) => setDataEnd(e.target.value)} />
              </label>
            </div>
          ) : null}
          <button className="primary" onClick={handleGenerate} disabled={isGenerating}>{isGenerating ? 'Building report…' : 'Generate report'}</button>
          {reportData ? <button className="secondary" onClick={handleExport}>Export PDF</button> : null}
          {status ? <div className="status-message">{status}</div> : null}
          {error ? <div className="error-message">{error}</div> : null}
        </section>
      </main>

      <section ref={reportRef} className="preview-section">
        {reportData ? (
          <>
            <div className="preview-toolbar">
              <div>
                <h2>Report preview</h2>
                <p>Pages below export one-for-one into the final landscape PDF.</p>
              </div>
              <button className="primary" onClick={handleExport}>Export PDF</button>
            </div>
            <Report data={reportData} />
          </>
        ) : (
          <div className="empty-preview">Upload files and generate a report to see the preview.</div>
        )}
      </section>
    </div>
  );
}
