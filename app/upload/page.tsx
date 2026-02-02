'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { callAirportProcedure, callAirportQuery } from '../lib/airportApi';

interface DataRow {
  [key: string]: string | number;
}

interface TemplateInfo {
  TemplateId: number;
  TemplateName: string;
  HtmlContent: string;
}

interface TemplateTag {
  TagName: string;
  ColumnName: string;
}

export default function FileUpload() {
  const searchParams = useSearchParams();
  const templateId = searchParams.get('templateId');

  const [fileName, setFileName] = useState('');
  const [data, setData] = useState<DataRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [previewData, setPreviewData] = useState<DataRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [firstRowIsHeader] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendProgress, setSendProgress] = useState({ current: 0, total: 0 });
  const [sendResult, setSendResult] = useState<{ 
    success: number; 
    fail: number; 
    items: { row: number; username: string; status: 'success' | 'error'; message?: string }[] 
  } | null>(null);
  const [template, setTemplate] = useState<TemplateInfo | null>(null);
  const [templateTags, setTemplateTags] = useState<TemplateTag[]>([]);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [usernameColumn, setUsernameColumn] = useState<string>('');

  const PROCEDURE_SAVE_UPLOAD =
    process.env.NEXT_PUBLIC_PROC_SAVE_UPLOAD || 'sp_SaveUpload';
  const PROCEDURE_SAVE_UPLOAD_ROW =
    process.env.NEXT_PUBLIC_PROC_SAVE_UPLOAD_ROW || 'sp_SaveUploadRow';

  const TEMPLATE_BY_ID_SQL =
    'SELECT TemplateId, TemplateName, HtmlContent FROM dbo.Templates WHERE TemplateId = @TemplateId';
  const TEMPLATE_TAGS_SQL =
    'SELECT TagName, ColumnName FROM TemplateTags WHERE TemplateId = @TemplateId';

  useEffect(() => {
    if (templateId) {
      loadTemplate(Number(templateId));
    }
  }, [templateId]);

  const loadTemplate = async (id: number) => {
    try {
      setLoadingTemplate(true);
      const result = await callAirportQuery<any>(TEMPLATE_BY_ID_SQL, { TemplateId: id });
      const rows = Array.isArray(result?.data) ? result.data : [];
      if (rows.length > 0) {
        setTemplate(rows[0]);
        await loadTemplateTags(id);
      }
    } catch (error) {
      console.error('Error loading template:', error);
    } finally {
      setLoadingTemplate(false);
    }
  };

  const loadTemplateTags = async (id: number) => {
    const result = await callAirportQuery<any>(TEMPLATE_TAGS_SQL, { TemplateId: id });
    const rows = Array.isArray(result?.data) ? result.data : [];
    setTemplateTags(rows);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Clear previous data before loading new file
    setData([]);
    setColumns([]);
    setPreviewData([]);
    
    setLoading(true);
    setFileName(file.name);

    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    try {
      if (fileExtension === 'csv') {
        // Parse CSV
        Papa.parse(file, {
          header: firstRowIsHeader,
          skipEmptyLines: true,
          complete: (results) => {
            if (firstRowIsHeader) {
              const parsedData = results.data as DataRow[];
              const headerCols = (results.meta?.fields ?? []) as string[];
              const cols = headerCols.length > 0
                ? headerCols
                : (parsedData.length > 0 ? Object.keys(parsedData[0]) : []);
              processData(parsedData, cols);
            } else {
              const rows = results.data as (string | number)[][];
              const maxCols = rows.reduce((max, row) => Math.max(max, row.length), 0);
              const cols = buildColumns(maxCols);
              const mapped = rows.map((row) => mapRowToData(row, cols));
              processData(mapped, cols);
            }
            setLoading(false);
          },
          error: (error) => {
            console.error('Error parsing CSV:', error);
            alert('เกิดข้อผิดพลาดในการอ่านไฟล์ CSV');
            setLoading(false);
          }
        });
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        // Parse Excel
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as (string | number)[][];

        if (rows.length > 0) {
          if (firstRowIsHeader) {
            const headerRow = rows[0].map((cell) => String(cell ?? '').trim()).filter(Boolean);
            const cols = headerRow.length > 0 ? headerRow : buildColumns(rows[0].length);
            const dataRows = rows.slice(1).map((row) => mapRowToData(row, cols));
            processData(dataRows, cols);
          } else {
            const maxCols = rows.reduce((max, row) => Math.max(max, row.length), 0);
            const cols = buildColumns(maxCols);
            const dataRows = rows.map((row) => mapRowToData(row, cols));
            processData(dataRows, cols);
          }
        } else {
          processData([], []);
        }
        setLoading(false);
      } else {
        alert('กรุณาเลือกไฟล์ CSV หรือ Excel (.xlsx, .xls)');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error processing file:', error);
      alert('เกิดข้อผิดพลาดในการอ่านไฟล์');
      setLoading(false);
    }
  };

  const buildColumns = (count: number) =>
    Array.from({ length: count }, (_, index) => `column${index + 1}`);

  const mapRowToData = (row: (string | number)[], cols: string[]) => {
    const obj: DataRow = {};
    cols.forEach((col, index) => {
      obj[col] = row[index] ?? '';
    });
    return obj;
  };

  const processData = (parsedData: DataRow[], cols: string[]) => {
    // Check if columns exceed 10
    if (cols.length > 10) {
      alert(`ไฟล์มี ${cols.length} columns ซึ่งเกินกว่าที่รองรับ (สูงสุด 10 columns)`);
      setLoading(false);
      setFileName('');
      setData([]);
      setColumns([]);
      setPreviewData([]);
      return;
    }

    setColumns(cols);
    setData(parsedData);
    const preview = parsedData.slice(0, 10);
    setPreviewData(preview);
  };

  const extractId = (payload: unknown, key: string): number | null => {
    if (!payload || typeof payload !== 'object') return null;

    const direct = (payload as Record<string, unknown>)[key];
    if (typeof direct === 'number') return direct;
    if (typeof direct === 'string' && direct.trim() !== '' && !Number.isNaN(Number(direct))) {
      return Number(direct);
    }

    const candidates = ['data', 'recordset', 'records', 'result', 'results'];
    for (const field of candidates) {
      const value = (payload as Record<string, unknown>)[field];
      if (Array.isArray(value) && value.length > 0) {
        const inner = value[0] as Record<string, unknown>;
        const innerValue = inner?.[key];
        if (typeof innerValue === 'number') return innerValue;
        if (typeof innerValue === 'string' && innerValue.trim() !== '' && !Number.isNaN(Number(innerValue))) {
          return Number(innerValue);
        }
      } else if (value && typeof value === 'object') {
        const nested = extractId(value, key);
        if (nested !== null) return nested;
      }
    }

    return null;
  };

  const mapRowToDb = (row: DataRow, cols: string[]) => {
    const payload: Record<string, string | number> = {};
    for (let i = 0; i < 10; i += 1) {
      const key = cols[i];
      payload[`Column${i + 1}`] = key ? (row[key] ?? '') : '';
    }
    return payload;
  };

  const saveToDatabase = async () => {
    if (data.length === 0) {
      alert('ไม่มีข้อมูลสำหรับบันทึก');
      return;
    }

    try {
      setSaving(true);

      const uploadResult = await callAirportProcedure(PROCEDURE_SAVE_UPLOAD, {
        FileName: fileName,
        FirstRowIsHeader: firstRowIsHeader ? 1 : 0,
        TotalRows: data.length,
        TotalColumns: columns.length,
      });

      const uploadId = extractId(uploadResult, 'UploadId');

      if (!uploadId) {
        throw new Error('ไม่พบ UploadId จากระบบ');
      }

      for (let i = 0; i < data.length; i += 1) {
        const rowPayload = mapRowToDb(data[i], columns);
        await callAirportProcedure(PROCEDURE_SAVE_UPLOAD_ROW, {
          UploadId: uploadId,
          RowNumber: i + 1,
          ...rowPayload,
        });
      }

      alert('บันทึกข้อมูลเรียบร้อยแล้ว');
    } catch (error) {
      console.error(error);
      alert('บันทึกข้อมูลไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  const clearData = () => {
    setFileName('');
    setData([]);
    setColumns([]);
    setPreviewData([]);
  };

  // Replace template tags with actual data from first row
  const getPreviewHtml = () => {
    if (!template || !previewData.length || !templateTags.length) {
      return template?.HtmlContent || '';
    }

    let html = template.HtmlContent;
    const firstRow = previewData[0];

    templateTags.forEach((tag) => {
      const tagPattern = new RegExp(`\\{\\{${tag.TagName}\\}\\}`, 'g');
      const value = firstRow[tag.ColumnName] ?? '';
      html = html.replace(tagPattern, String(value));
    });

    return html;
  };

  const downloadTemplate = () => {
    // Create sample data
    const sampleData = [
      { name: 'John Doe', email: 'john@example.com', phone: '081-234-5678' },
      { name: 'Jane Smith', email: 'jane@example.com', phone: '082-345-6789' },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
    XLSX.writeFile(workbook, 'template.xlsx');
  };

  // Generate message HTML for a specific row
  const getMessageForRow = (row: DataRow): string => {
    if (!template) return '';

    let html = template.HtmlContent;

    templateTags.forEach((tag) => {
      const tagPattern = new RegExp(`\\{\\{${tag.TagName}\\}\\}`, 'g');
      const value = row[tag.ColumnName] ?? '';
      html = html.replace(tagPattern, String(value));
    });

    // Strip HTML tags for text message
    const textMessage = html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();

    return textMessage;
  };

  // Send notifications to all recipients
  const sendNotifications = async () => {
    if (!usernameColumn) {
      alert('กรุณาเลือก Column ที่เป็น Username');
      return;
    }

    if (data.length === 0) {
      alert('ไม่มีข้อมูลสำหรับส่ง');
      return;
    }

    if (!template) {
      alert('ไม่พบ Template');
      return;
    }

    const confirmSend = window.confirm(
      `ต้องการส่ง Notification ไปยังผู้รับ ${data.length} คน?`
    );
    if (!confirmSend) return;

    try {
      setSending(true);
      setSendProgress({ current: 0, total: data.length });
      setSendResult(null);

      let successCount = 0;
      let failCount = 0;
      const items: { row: number; username: string; status: 'success' | 'error'; message?: string }[] = [];

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const username = String(row[usernameColumn] || '').trim();

        if (!username) {
          items.push({ row: i + 1, username: '-', status: 'error', message: 'ไม่พบ Username' });
          failCount++;
          setSendProgress({ current: i + 1, total: data.length });
          continue;
        }

        const message = getMessageForRow(row);

        try {
          const response = await fetch('/api/aotstaff/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: [username],
              title: template.TemplateName || 'แจ้งเตือน',
              message,
            }),
          });

          const result = await response.json();

          if (result.success) {
            items.push({ row: i + 1, username, status: 'success' });
            successCount++;
          } else {
            items.push({ row: i + 1, username, status: 'error', message: result.error });
            failCount++;
          }
        } catch (err) {
          items.push({ row: i + 1, username, status: 'error', message: 'Network error' });
          failCount++;
        }

        setSendProgress({ current: i + 1, total: data.length });
      }

      // Set result to display in UI
      setSendResult({ success: successCount, fail: failCount, items });
    } catch (error) {
      console.error('Error sending notifications:', error);
      setSendResult({ success: 0, fail: data.length, items: [{ row: 0, username: '-', status: 'error', message: 'เกิดข้อผิดพลาดในการส่ง Notification' }] });
    } finally {
      setSending(false);
      setSendProgress({ current: 0, total: 0 });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/template-creator"
            className="inline-flex items-center justify-center gap-2 bg-gray-600 text-white py-3 px-6 rounded-lg hover:bg-gray-700 font-medium transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            ย้อนกลับ
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Upload ไฟล์ข้อมูล</h1>
        </div>

        {/* Template Info Section */}
        {loadingTemplate && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="animate-pulse flex items-center gap-3">
              <div className="h-4 w-4 bg-gray-300 rounded-full"></div>
              <div className="h-4 bg-gray-300 rounded w-1/3"></div>
            </div>
          </div>
        )}

        {!loadingTemplate && template && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Template ที่เลือก</h2>
            <div className="mb-4">
              <span className="text-sm text-gray-600">ชื่อ Template:</span>
              <span className="ml-2 font-medium text-gray-900">{template.TemplateName}</span>
            </div>

            {templateTags.length > 0 && (
              <div className="mb-4">
                <span className="text-sm text-gray-600 block mb-2">Tags ที่ใช้:</span>
                <div className="flex flex-wrap gap-2">
                  {templateTags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm"
                    >
                      <code className="font-mono">{`{{${tag.TagName}}}`}</code>
                      <span className="text-blue-500">→</span>
                      <span className="text-blue-600">{tag.ColumnName}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">เลือกไฟล์</h2>
            <button
              onClick={downloadTemplate}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              📥 ดาวน์โหลด Template ตัวอย่าง
            </button>
          </div>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer"
            >
              <div className="space-y-2">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="text-gray-600">
                  <span className="font-medium text-blue-600 hover:text-blue-700">
                    คลิกเพื่อเลือกไฟล์
                  </span>
                  <span> หรือลากไฟล์มาวาง</span>
                </div>
                <p className="text-sm text-gray-500">
                  รองรับไฟล์ CSV, XLSX, XLS
                </p>
              </div>
            </label>
          </div>


          {fileName && (
            <div className="mt-4 flex items-center justify-between bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center">
                <svg className="h-6 w-6 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm font-medium text-gray-900">{fileName}</span>
              </div>
              <button
                onClick={clearData}
                className="text-red-600 hover:text-red-800 text-sm font-medium"
              >
                ลบ
              </button>
            </div>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">กำลังประมวลผล...</p>
          </div>
        )}

        {/* Data Summary */}
        {!loading && data.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">สรุปข้อมูล</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">จำนวนแถว</p>
                <p className="text-2xl font-bold text-blue-600">{data.length}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">จำนวน Column</p>
                <p className="text-2xl font-bold text-green-600">{columns.length}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">แสดง Preview</p>
                <p className="text-2xl font-bold text-purple-600">{previewData.length} แถว</p>
              </div>
            </div>
          </div>
        )}

        {/* Send Notification Section */}
        {!loading && data.length > 0 && template && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">ส่ง AOTStaff Notification</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                เลือก Column ที่เป็น Username (ผู้รับ)
              </label>
              <select
                value={usernameColumn}
                onChange={(e) => setUsernameColumn(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
              >
                <option value="">-- เลือก Column --</option>
                {columns.map((col, index) => (
                  <option key={col} value={col}>
                    Column {index + 1} {previewData[0] ? `(ตัวอย่าง: ${previewData[0][col]})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {sending && (
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>กำลังส่ง...</span>
                  <span>{sendProgress.current} / {sendProgress.total}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-green-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${(sendProgress.current / sendProgress.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={sendNotifications}
              disabled={sending || !usernameColumn}
              className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-colors flex items-center justify-center gap-2"
            >
              {sending ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  กำลังส่ง...
                </>
              ) : (
                <>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  ส่ง AOTStaff Notification ({data.length} รายการ)
                </>
              )}
            </button>

            {/* Send Result Summary */}
            {sendResult && (
              <div className={`mt-4 p-4 rounded-lg border ${sendResult.fail === 0 ? 'bg-green-50 border-green-200' : sendResult.success === 0 ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}>
                <h3 className={`font-semibold mb-3 ${sendResult.fail === 0 ? 'text-green-800' : sendResult.success === 0 ? 'text-red-800' : 'text-yellow-800'}`}>
                  ผลการส่ง Notification
                </h3>
                <div className="flex gap-6 mb-4">
                  <div className="flex items-center gap-2">
                    <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-green-700 font-medium">สำเร็จ: {sendResult.success} รายการ</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="text-red-700 font-medium">ล้มเหลว: {sendResult.fail} รายการ</span>
                  </div>
                </div>
                
                {/* Result Table */}
                <div className="overflow-x-auto max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">แถว</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">สถานะ</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">รายละเอียด</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sendResult.items.map((item, idx) => (
                        <tr key={idx} className={item.status === 'success' ? 'bg-green-50' : 'bg-red-50'}>
                          <td className="px-4 py-2 text-sm text-gray-900">{item.row}</td>
                          <td className="px-4 py-2 text-sm text-gray-900 font-mono">{item.username}</td>
                          <td className="px-4 py-2 text-sm">
                            {item.status === 'success' ? (
                              <span className="inline-flex items-center gap-1 text-green-700">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                สำเร็จ
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-red-700">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                ล้มเหลว
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-600">{item.message || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Columns List */}
        {!loading && columns.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Columns ในไฟล์</h2>
            <div className="flex flex-wrap gap-2">
              {columns.map((col, index) => (
                <span
                  key={index}
                  className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium"
                >
                  {firstRowIsHeader ? col : index + 1}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Preview Template */}
        {!loading && columns.length > 0 && template && previewData.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <details>
              <summary className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-800">
                แสดง Preview Template (ข้อมูลจากแถวที่ 1)
              </summary>
              <div
                className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200 prose prose-sm max-w-none text-black"
                style={{ color: 'black' }}
                dangerouslySetInnerHTML={{ __html: getPreviewHtml() }}
              />
            </details>
          </div>
        )}

        {/* Preview Data Table */}
        {!loading && previewData.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Preview ข้อมูล (10 แถวแรก)
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      #
                    </th>
                    {columns.map((_, index) => (
                      <th
                        key={index}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {index + 1}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {previewData.map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {rowIndex + 1}
                      </td>
                      {columns.map((col, colIndex) => (
                        <td
                          key={colIndex}
                          className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                        >
                          {row[col]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data.length > 10 && (
              <p className="mt-4 text-sm text-gray-600 text-center">
                แสดง 10 จาก {data.length} แถว
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
