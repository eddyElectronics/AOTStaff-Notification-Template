'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { Image } from '@tiptap/extension-image';
import { signOut } from 'next-auth/react';
import './tiptap.css';

interface Tag {
  name: string;
  column: string;
}

export default function TemplateCreator() {
  const router = useRouter();
  const [tags, setTags] = useState<Tag[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColumn, setNewTagColumn] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      Image,
    ],
    content: `<p>ขอส่ง User name และ Password เข้าระบบ SAP ให้ผู้ประเมิน Competency Appraisal ประจำปีงบประมาณ 2569</p>
<p>ท่านสามารถเข้าประเมินได้วันที่ 2-20 ก.พ.69</p>
<p><br></p>
<p><strong>ชื่อผู้ใช้ของท่าน</strong> : {{username}}</p>
<p><strong>รหัสผ่าน</strong> : {{password}}</p>
<p><br></p>
<p><strong>หมายเหตุ</strong> ท่านต้องเข้าไปเปลี่ยน Password ก่อนวันที่ 16 ก.พ.69 ไม่เช่นนั้น Password ของท่านจะหมดอายุ</p>`,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[350px] p-4',
      },
    },
    immediatelyRender: false,
  });

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

  const goToUpload = () => {
    if (!editor) return;
    
    // Save template content and tags to localStorage
    const templateData = {
      htmlContent: editor.getHTML(),
      tags: tags,
    };
    localStorage.setItem('templateData', JSON.stringify(templateData));
    router.push('/upload');
  };

  return (
    <div className="min-h-screen minimal-bg p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center justify-center gap-2 minimal-btn-outline py-2 px-4 rounded-lg font-medium transition-all"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
              </svg>
              ย้อนกลับ
            </button>
            <h1 className="text-2xl font-semibold text-zinc-900">สร้าง Template</h1>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
          >
            ออกจากระบบ
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Editor Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* HTML Editor */}
            <div className="minimal-card rounded-xl p-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Content
              </label>
              <p className="text-xs text-zinc-500 mb-2">
                กำหนด tag ให้อยู่ภายใต้เครื่องหมาย {`{{ชื่อ tag}}`} (ตามตัวอย่าง)
              </p>
              
              {/* Toolbar */}
              <div className="border border-gray-300 rounded-t-lg p-2 bg-gray-50 flex flex-wrap gap-1">
                <button
                  onClick={() => editor?.chain().focus().toggleBold().run()}
                  className={`px-3 py-1 rounded text-black ${editor?.isActive('bold') ? 'bg-blue-200' : 'bg-white'} border border-gray-300 hover:bg-gray-100`}
                  type="button"
                >
                  <strong>B</strong>
                </button>
                <button
                  onClick={() => editor?.chain().focus().toggleItalic().run()}
                  className={`px-3 py-1 rounded text-black ${editor?.isActive('italic') ? 'bg-blue-200' : 'bg-white'} border border-gray-300 hover:bg-gray-100`}
                  type="button"
                >
                  <em>I</em>
                </button>
                <button
                  onClick={() => editor?.chain().focus().toggleStrike().run()}
                  className={`px-3 py-1 rounded text-black ${editor?.isActive('strike') ? 'bg-blue-200' : 'bg-white'} border border-gray-300 hover:bg-gray-100`}
                  type="button"
                >
                  <s>S</s>
                </button>
                <div className="w-px bg-gray-300 mx-1"></div>
                <button
                  onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                  className={`px-3 py-1 rounded text-black ${editor?.isActive('heading', { level: 1 }) ? 'bg-blue-200' : 'bg-white'} border border-gray-300 hover:bg-gray-100`}
                  type="button"
                >
                  H1
                </button>
                <button
                  onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                  className={`px-3 py-1 rounded text-black ${editor?.isActive('heading', { level: 2 }) ? 'bg-blue-200' : 'bg-white'} border border-gray-300 hover:bg-gray-100`}
                  type="button"
                >
                  H2
                </button>
                <button
                  onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
                  className={`px-3 py-1 rounded text-black ${editor?.isActive('heading', { level: 3 }) ? 'bg-blue-200' : 'bg-white'} border border-gray-300 hover:bg-gray-100`}
                  type="button"
                >
                  H3
                </button>
                <div className="w-px bg-gray-300 mx-1"></div>
                <button
                  onClick={() => editor?.chain().focus().toggleBulletList().run()}
                  className={`px-3 py-1 rounded text-black ${editor?.isActive('bulletList') ? 'bg-blue-200' : 'bg-white'} border border-gray-300 hover:bg-gray-100`}
                  type="button"
                >
                  • List
                </button>
                <button
                  onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                  className={`px-3 py-1 rounded text-black ${editor?.isActive('orderedList') ? 'bg-blue-200' : 'bg-white'} border border-gray-300 hover:bg-gray-100`}
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
                  className={`px-3 py-1 rounded text-black ${editor?.isActive('link') ? 'bg-blue-200' : 'bg-white'} border border-gray-300 hover:bg-gray-100`}
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

            {/* Next Button */}
            <button
              onClick={goToUpload}
              disabled={!editor?.getText() || tags.length < 1}
              className="w-full minimal-btn py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all"
            >
              ถัดไป
            </button>
          </div>

          {/* Tags Management Section */}
          <div className="lg:col-span-1 space-y-6">
            {/* Add New Tag */}
            <div className="minimal-card rounded-xl p-6">
              <h3 className="text-lg font-medium text-zinc-900 mb-4">เพิ่ม Custom Tag</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-600 mb-2">
                    Tag Name (ไม่ต้องมีเครื่องหมายปีกกา)
                  </label>
                  <input
                    type="text"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    className="w-full minimal-input text-zinc-900 placeholder:text-zinc-400"
                    placeholder="เช่น: username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-600 mb-2">
                    Column (1-10)
                  </label>
                  <select
                    value={newTagColumn}
                    onChange={(e) => setNewTagColumn(e.target.value)}
                    className="w-full minimal-input text-zinc-900"
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
                  className="w-full minimal-btn py-3 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  เพิ่ม Tag
                </button>
              </div>
            </div>

            {/* Tags List */}
            <div className="minimal-card rounded-xl p-6">
              <h3 className="text-lg font-medium text-zinc-900 mb-4">Tags ที่สร้างไว้</h3>
              {tags.length === 0 ? (
                <p className="text-zinc-500 text-sm">ยังไม่มี tags</p>
              ) : (
                <div className="space-y-2">
                  {tags.map((tag) => (
                    <div
                      key={tag.name}
                      className="border border-zinc-200 rounded-lg p-3 hover:bg-zinc-50 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <code className="text-sm font-mono bg-zinc-100 text-zinc-700 px-2 py-1 rounded">
                            {`{{${tag.name}}}`}
                          </code>
                          <p className="text-xs text-zinc-500 mt-1">
                            Column: <span className="font-medium">{tag.column}</span>
                          </p>
                        </div>
                        <button
                          onClick={() => removeTag(tag.name)}
                          className="text-zinc-400 hover:text-zinc-600 text-sm font-medium"
                        >
                          ลบ
                        </button>
                      </div>
                      <button
                        onClick={() => insertTag(tag.name)}
                        className="w-full bg-zinc-100 text-zinc-700 py-2 px-3 rounded-lg text-sm hover:bg-zinc-200 transition-all font-medium"
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
