import { CATEGORIES } from '../../pages/types';

interface ShortcutEditFormProps {
  editTitle: string;
  editDescription: string;
  editCategory: string;
  editError: string;
  editLoading: boolean;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export default function ShortcutEditForm({
  editTitle,
  editDescription,
  editCategory,
  editError,
  editLoading,
  onTitleChange,
  onDescriptionChange,
  onCategoryChange,
  onSave,
  onCancel,
}: ShortcutEditFormProps) {
  return (
    <div className="space-y-3">
      {editError && (
        <div className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-xs">{editError}</div>
      )}
      <div>
        <label className="block text-xs text-gray-500 mb-1">名称</label>
        <input
          type="text"
          value={editTitle}
          onChange={e => onTitleChange(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">分类</label>
        <select
          value={editCategory}
          onChange={e => onCategoryChange(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500 max-w-xs"
        >
          {CATEGORIES.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">描述</label>
        <textarea
          value={editDescription}
          onChange={e => onDescriptionChange(e.target.value)}
          placeholder="描述这个快捷指令的功能..."
          className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows={3}
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={onSave}
          disabled={editLoading}
          className="bg-blue-600 text-white px-5 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {editLoading ? '保存中...' : '保存'}
        </button>
        <button
          onClick={onCancel}
          className="text-gray-500 px-4 py-1.5 rounded-lg text-sm hover:bg-gray-100"
        >
          取消
        </button>
      </div>
    </div>
  );
}
