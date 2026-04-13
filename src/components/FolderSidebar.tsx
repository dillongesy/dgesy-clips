"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Folder, FolderOpen, Plus, Pencil, Trash2, ChevronRight, ChevronDown } from "lucide-react";

interface FolderItem {
  id: number;
  name: string;
  parentId: number | null;
  childCount: number;
}

interface FolderNodeProps {
  folder: FolderItem;
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  onRefresh: () => void;
  onDrop: (folderId: number, shortId: string) => void;
  depth: number;
}

function FolderNode({ folder, selectedId, onSelect, onRefresh, onDrop, depth }: FolderNodeProps) {
  const [expanded, setExpanded] = useState(false);
  const [children, setChildren] = useState<FolderItem[]>([]);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(folder.name);
  const [dragOver, setDragOver] = useState(false);
  const isSelected = selectedId === folder.id;

  const loadChildren = async () => {
    if (!expanded) {
      const res = await api.get(`/api/folders/${folder.id}`);
      setChildren(res.data.subfolders);
      setExpanded(true);
    } else {
      setExpanded(false);
    }
  };

  const handleRename = async () => {
    if (!renameValue.trim()) return;
    await api.patch(`/api/folders/${folder.id}/rename`, { name: renameValue });
    setRenaming(false);
    onRefresh();
  };

  const handleDelete = async () => {
    if (!confirm(`Delete folder "${folder.name}"? Clips inside won't be deleted.`)) return;
    await api.delete(`/api/folders/${folder.id}`);
    onRefresh();
    if (isSelected) onSelect(null);
  };

  return (
    <div>
      <div
        className={`flex items-center gap-1 px-2 py-1.5 rounded-lg cursor-pointer group transition-all ${
          dragOver
            ? "bg-indigo-500/20 border border-indigo-500/40"
            : isSelected
            ? "bg-indigo-500/15 text-indigo-300"
            : "dark:hover:bg-white/[0.04] hover:bg-slate-100 dark:text-slate-400 text-slate-600"
        }`}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const shortId = e.dataTransfer.getData("shortId");
          if (shortId) onDrop(folder.id, shortId);
        }}
      >
        <button
          onClick={loadChildren}
          className="flex-shrink-0 w-4 h-4 flex items-center justify-center"
        >
          {folder.childCount > 0 ? (
            expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />
          ) : (
            <span className="w-3" />
          )}
        </button>

        <button
          onClick={() => onSelect(isSelected ? null : folder.id)}
          className="flex items-center gap-1.5 flex-1 min-w-0 text-left"
        >
          {isSelected || expanded ? (
            <FolderOpen size={14} className="text-indigo-400 flex-shrink-0" />
          ) : (
            <Folder size={14} className="flex-shrink-0" />
          )}
          {renaming ? (
            <input
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
                if (e.key === "Escape") setRenaming(false);
              }}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 bg-transparent border-b border-indigo-500 outline-none text-sm"
            />
          ) : (
            <span className="text-sm truncate">{folder.name}</span>
          )}
        </button>

        <div className="hidden group-hover:flex items-center gap-1 flex-shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); setRenaming(true); }}
            className="p-1 rounded hover:text-indigo-400 transition-colors"
          >
            <Pencil size={11} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(); }}
            className="p-1 rounded hover:text-red-400 transition-colors"
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>

      {expanded && children.map((child) => (
        <FolderNode
          key={child.id}
          folder={child}
          selectedId={selectedId}
          onSelect={onSelect}
          onRefresh={() => { loadChildren(); onRefresh(); }}
          onDrop={onDrop}
          depth={depth + 1}
        />
      ))}
    </div>
  );
}

interface FolderSidebarProps {
  selectedFolderId: number | null;
  onSelectFolder: (id: number | null) => void;
  onDropClip: (folderId: number, shortId: string) => void;
}

export default function FolderSidebar({ selectedFolderId, onSelectFolder, onDropClip }: FolderSidebarProps) {
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const fetchFolders = async () => {
    const res = await api.get("/api/folders");
    setFolders(res.data);
  };

  useEffect(() => {
    fetchFolders();
  }, []);

  const handleCreate = async () => {
    if (!newFolderName.trim()) return;
    await api.post("/api/folders", {
      name: newFolderName,
      parentId: selectedFolderId,
    });
    setNewFolderName("");
    setCreatingFolder(false);
    fetchFolders();
  };

  return (
    <div className="w-56 flex-shrink-0">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-mono tracking-widest dark:text-slate-500 text-slate-400 uppercase">
          Folders
        </span>
        <button
          onClick={() => setCreatingFolder(true)}
          className="p-1 rounded dark:text-slate-500 text-slate-400 hover:text-indigo-400 transition-colors"
          title="New folder"
        >
          <Plus size={14} />
        </button>
      </div>

      {creatingFolder && (
        <div className="mb-2 flex gap-1">
          <input
            autoFocus
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
              if (e.key === "Escape") setCreatingFolder(false);
            }}
            placeholder="Folder name..."
            className="flex-1 px-2 py-1 text-sm rounded-lg dark:bg-white/[0.05] bg-slate-100 border dark:border-white/[0.08] border-slate-200 outline-none focus:border-indigo-500/40 dark:text-slate-100 text-slate-900"
          />
          <button
            onClick={handleCreate}
            className="px-2 py-1 text-xs rounded-lg text-white"
            style={{ background: "linear-gradient(135deg, #6366f1, #06b6d4)" }}
          >
            Add
          </button>
        </div>
      )}

      {/* All clips drop zone */}
      <button
        onClick={() => onSelectFolder(null)}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
        }}
        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-all mb-1 ${
          dragOver
            ? "bg-indigo-500/20 border border-indigo-500/40"
            : selectedFolderId === null
            ? "bg-indigo-500/15 text-indigo-300"
            : "dark:text-slate-400 text-slate-600 dark:hover:bg-white/[0.04] hover:bg-slate-100"
        }`}
      >
        <Folder size={14} />
        All clips
      </button>

      {folders.map((folder) => (
        <FolderNode
          key={folder.id}
          folder={folder}
          selectedId={selectedFolderId}
          onSelect={onSelectFolder}
          onRefresh={fetchFolders}
          onDrop={onDropClip}
          depth={0}
        />
      ))}
    </div>
  );
}