'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { Image } from '@tiptap/extension-image';
import { callAirportProcedure, callAirportQuery } from '../lib/airportApi';
import './tiptap.css';

interface Tag {
  name: string;
  column: string;
}

interface TemplateOption {
  TemplateId: number;
  TemplateName: string;
  HtmlContent: string;
}

export default function TemplateCreator() {
  const [templateName, setTemplateName] = useState('');
  const [tags, setTags] = useState<Tag[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColumn, setNewTagColumn] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | 'new'>('new');
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [templateLoadError, setTemplateLoadError] = useState('');

  const PROCEDURE_SAVE_TEMPLATE =
    process.env.NEXT_PUBLIC_PROC_SAVE_TEMPLATE || 'sp_SaveTemplate';
  const PROCEDURE_SAVE_TEMPLATE_TAG =
    process.env.NEXT_PUBLIC_PROC_SAVE_TEMPLATE_TAG || 'sp_SaveTemplateTag';
  const PROCEDURE_DELETE_TEMPLATE =
    process.env.NEXT_PUBLIC_PROC_DELETE_TEMPLATE || 'sp_DeleteTemplate';
  const TEMPLATE_SELECT_SQL =
    'SELECT TemplateId, TemplateName, HtmlContent FROM dbo.Templates ORDER BY CreatedAt DESC';
  const TEMPLATE_TAGS_SQL =
    'SELECT TagName, ColumnName FROM TemplateTags WHERE TemplateId = @TemplateId';

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      Image,
    ],
    content: '<p>เริ่มสร้าง template ของคุณที่นี่...</p>',
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[350px] p-4',
      },
    },
    immediatelyRender: false,
  });

  const loadTemplates = async () => {
    try {
      setLoadingTemplates(true);
      setTemplateLoadError('');
      const result = await callAirportQuery<any>(
        TEMPLATE_SELECT_SQL
      );

      if ((result as any)?.success === false) {
        setTemplates([]);
        setTemplateLoadError((result as any)?.error || 'โหลด template ไม่สำเร็จ');
        return;
      }

      // API returns: { success: true, data: [...], recordsets: [[...]] }
      // data is directly an array, not data.recordset
      const rows =
        (Array.isArray((result as any)?.data) ? (result as any).data : null) ??
        (result as any)?.data?.recordset ??
        (result as any)?.data?.records ??
        (result as any)?.recordset ??
        (result as any)?.records ??
        (result as any)?.result ??
        (result as any)?.results ??
        [];

      setTemplates(Array.isArray(rows) ? rows : []);
      if (!Array.isArray(rows) || rows.length === 0) {
        setTemplateLoadError('ยังไม่มี template ในระบบ');
      }
    } catch (error) {
      console.error(error);
      setTemplates([]);
      setTemplateLoadError('โหลด template ไม่สำเร็จ');
    } finally {
      setLoadingTemplates(false);
    }
  };

  const loadTemplateTags = async (templateId: number) => {
    const result = await callAirportQuery<any>(
      TEMPLATE_TAGS_SQL,
      { TemplateId: templateId }
    );

    // API returns: { success: true, data: [...] }
    // data is directly an array
    const rows =
      (Array.isArray((result as any)?.data) ? (result as any).data : null) ??
      (result as any)?.data?.recordset ??
      (result as any)?.data?.records ??
      (result as any)?.recordset ??
      (result as any)?.records ??
      (result as any)?.result ??
      (result as any)?.results ??
      [];

    if (Array.isArray(rows)) {
      setTags(
        rows.map((row: any) => ({
          name: row.TagName,
          column: row.ColumnName,
        }))
      );
    } else {
      setTags([]);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const addTag = () => {
    if (newTagName && newTagColumn) {
      const tagExists = tags.some(tag => tag.name === newTagName);
      if (!tagExists) {
        setTags([...tags, { name: newTagName, column: newTagColumn }]);
        setNewTagName('');
        setNewTagColumn('');
      } else {
        alert('Tag name already exists!');
      }
    }
  };

  const removeTag = (tagName: string) => {
    setTags(tags.filter(tag => tag.name !== tagName));
  };

  const insertTag = (tagName: string) => {
    if (editor) {
      editor.chain().focus().insertContent(`{{${tagName}}}`).run();
    }
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

  const saveTemplate = async () => {
    if (!editor) return;

    try {
      setSaving(true);

      const templateResult = await callAirportProcedure(PROCEDURE_SAVE_TEMPLATE, {
        TemplateName: templateName,
        HtmlContent: editor.getHTML(),
      });

      const templateId = extractId(templateResult, 'TemplateId');

      if (!templateId) {
        throw new Error('ไม่พบ TemplateId จากระบบ');
      }

      for (const tag of tags) {
        await callAirportProcedure(PROCEDURE_SAVE_TEMPLATE_TAG, {
          TemplateId: templateId,
          TagName: tag.name,
          ColumnName: tag.column,
        });
      }

      alert('Template saved successfully!');

      // Reset form
      setTemplateName('');
      editor.commands.setContent('<p>เริ่มสร้าง template ของคุณที่นี่...</p>');
      setTags([]);
      setSelectedTemplateId('new');
      await loadTemplates();
    } catch (error) {
      console.error(error);
      alert('บันทึก template ไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  const handleTemplateSelect = async (value: string) => {
    if (value === 'new') {
      setSelectedTemplateId('new');
      setTemplateName('');
      editor?.commands.setContent('<p>เริ่มสร้าง template ของคุณที่นี่...</p>');
      setTags([]);
      return;
    }

    const templateId = Number(value);
    const selected = templates.find((t) => t.TemplateId === templateId);
    if (!selected) return;

    setSelectedTemplateId(templateId);
    setTemplateName(selected.TemplateName);
    editor?.commands.setContent(selected.HtmlContent || '<p></p>');
    await loadTemplateTags(templateId);
  };

  const deleteTemplate = async () => {
    if (selectedTemplateId === 'new') return;

    const confirmed = window.confirm('ต้องการลบ template นี้หรือไม่?');
    if (!confirmed) return;

    try {
      setDeleting(true);
      await callAirportProcedure(PROCEDURE_DELETE_TEMPLATE, {
        TemplateId: selectedTemplateId,
      });

      setSelectedTemplateId('new');
      setTemplateName('');
      editor?.commands.setContent('<p>เริ่มสร้าง template ของคุณที่นี่...</p>');
      setTags([]);
      await loadTemplates();
    } catch (error) {
      console.error(error);
      alert('ลบ template ไม่สำเร็จ');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">สร้าง Template</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Editor Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Template Selection */}
            <div className="bg-white rounded-lg shadow p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เลือก Template เดิม หรือสร้างใหม่
                </label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => handleTemplateSelect(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="new">สร้างใหม่</option>
                  {templates.map((t) => (
                    <option key={t.TemplateId} value={t.TemplateId}>
                      {t.TemplateName}
                    </option>
                  ))}
                </select>
                {loadingTemplates && (
                  <p className="text-xs text-gray-500 mt-2">กำลังโหลด template...</p>
                )}
                {!loadingTemplates && templateLoadError && (
                  <p className="text-xs text-red-600 mt-2">{templateLoadError}</p>
                )}
              </div>

              {selectedTemplateId !== 'new' && (
                <button
                  type="button"
                  onClick={deleteTemplate}
                  disabled={deleting}
                  className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {deleting ? 'กำลังลบ...' : 'ลบ Template'}
                </button>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ชื่อ Template
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="ระบุชื่อ template"
                />
              </div>
            </div>

            {/* HTML Editor */}
            <div className="bg-white rounded-lg shadow p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                HTML Content
              </label>
              
              {/* Toolbar */}
              <div className="border border-gray-300 rounded-t-lg p-2 bg-gray-50 flex flex-wrap gap-1">
                <button
                  onClick={() => editor?.chain().focus().toggleBold().run()}
                  className={`px-3 py-1 rounded ${editor?.isActive('bold') ? 'bg-blue-200' : 'bg-white'} border border-gray-300 hover:bg-gray-100`}
                  type="button"
                >
                  <strong>B</strong>
                </button>
                <button
                  onClick={() => editor?.chain().focus().toggleItalic().run()}
                  className={`px-3 py-1 rounded ${editor?.isActive('italic') ? 'bg-blue-200' : 'bg-white'} border border-gray-300 hover:bg-gray-100`}
                  type="button"
                >
                  <em>I</em>
                </button>
                <button
                  onClick={() => editor?.chain().focus().toggleStrike().run()}
                  className={`px-3 py-1 rounded ${editor?.isActive('strike') ? 'bg-blue-200' : 'bg-white'} border border-gray-300 hover:bg-gray-100`}
                  type="button"
                >
                  <s>S</s>
                </button>
                <div className="w-px bg-gray-300 mx-1"></div>
                <button
                  onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                  className={`px-3 py-1 rounded ${editor?.isActive('heading', { level: 1 }) ? 'bg-blue-200' : 'bg-white'} border border-gray-300 hover:bg-gray-100`}
                  type="button"
                >
                  H1
                </button>
                <button
                  onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                  className={`px-3 py-1 rounded ${editor?.isActive('heading', { level: 2 }) ? 'bg-blue-200' : 'bg-white'} border border-gray-300 hover:bg-gray-100`}
                  type="button"
                >
                  H2
                </button>
                <button
                  onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
                  className={`px-3 py-1 rounded ${editor?.isActive('heading', { level: 3 }) ? 'bg-blue-200' : 'bg-white'} border border-gray-300 hover:bg-gray-100`}
                  type="button"
                >
                  H3
                </button>
                <div className="w-px bg-gray-300 mx-1"></div>
                <button
                  onClick={() => editor?.chain().focus().toggleBulletList().run()}
                  className={`px-3 py-1 rounded ${editor?.isActive('bulletList') ? 'bg-blue-200' : 'bg-white'} border border-gray-300 hover:bg-gray-100`}
                  type="button"
                >
                  • List
                </button>
                <button
                  onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                  className={`px-3 py-1 rounded ${editor?.isActive('orderedList') ? 'bg-blue-200' : 'bg-white'} border border-gray-300 hover:bg-gray-100`}
                  type="button"
                >
                  1. List
                </button>
                <div className="w-px bg-gray-300 mx-1"></div>
                <button
                  onClick={() => {
                    const url = window.prompt('URL:');
                    if (url) {
                      editor?.chain().focus().setLink({ href: url }).run();
                    }
                  }}
                  className={`px-3 py-1 rounded ${editor?.isActive('link') ? 'bg-blue-200' : 'bg-white'} border border-gray-300 hover:bg-gray-100`}
                  type="button"
                >
                  🔗 Link
                </button>
              </div>

              {/* Editor */}
              <div className="border border-gray-300 border-t-0 rounded-b-lg bg-white min-h-[400px]">
                <EditorContent editor={editor} />
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={saveTemplate}
              disabled={!templateName || !editor?.getText() || saving}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {saving ? 'กำลังบันทึก...' : 'บันทึก Template'}
            </button>

            {selectedTemplateId !== 'new' ? (
              <Link
                href={`/upload?templateId=${selectedTemplateId}`}
                className="w-full inline-flex items-center justify-center bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 font-medium transition-colors"
              >
                ถัดไป
              </Link>
            ) : (
              <button
                type="button"
                disabled
                className="w-full bg-gray-300 text-gray-500 py-3 px-6 rounded-lg cursor-not-allowed font-medium"
              >
                ถัดไป
              </button>
            )}
          </div>

          {/* Tags Management Section */}
          <div className="lg:col-span-1 space-y-6">
            {/* Add New Tag */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">เพิ่ม Custom Tag</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tag Name
                  </label>
                  <input
                    type="text"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="เช่น: customer_name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Column (1-10)
                  </label>
                  <select
                    value={newTagColumn}
                    onChange={(e) => setNewTagColumn(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">เลือก column</option>
                    <option value="column1">column1</option>
                    <option value="column2">column2</option>
                    <option value="column3">column3</option>
                    <option value="column4">column4</option>
                    <option value="column5">column5</option>
                    <option value="column6">column6</option>
                    <option value="column7">column7</option>
                    <option value="column8">column8</option>
                    <option value="column9">column9</option>
                    <option value="column10">column10</option>
                  </select>
                </div>
                <button
                  onClick={addTag}
                  disabled={!newTagName || !newTagColumn}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  เพิ่ม Tag
                </button>
              </div>
            </div>

            {/* Tags List */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tags ที่สร้างไว้</h3>
              {tags.length === 0 ? (
                <p className="text-gray-500 text-sm">ยังไม่มี tags</p>
              ) : (
                <div className="space-y-2">
                  {tags.map((tag) => (
                    <div
                      key={tag.name}
                      className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <code className="text-sm font-mono bg-blue-50 text-blue-700 px-2 py-1 rounded">
                            {`{{${tag.name}}}`}
                          </code>
                          <p className="text-xs text-gray-600 mt-1">
                            Column: <span className="font-medium">{tag.column}</span>
                          </p>
                        </div>
                        <button
                          onClick={() => removeTag(tag.name)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          ลบ
                        </button>
                      </div>
                      <button
                        onClick={() => insertTag(tag.name)}
                        className="w-full bg-blue-50 text-blue-700 py-1 px-3 rounded text-sm hover:bg-blue-100 transition-colors"
                      >
                        แทรกใน Editor
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
