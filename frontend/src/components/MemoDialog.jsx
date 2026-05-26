import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Box, Dialog, DialogContent, IconButton,
  Typography, Chip, Fade, CircularProgress, Divider, Tooltip,
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircleOutlined as CheckCircleOutlineIcon,
  StickyNote2Outlined as StickyNote2OutlinedIcon,
  FormatBold, FormatItalic, FormatUnderlined, FormatStrikethrough,
  FormatListBulleted, FormatListNumbered, FormatQuote,
  FormatClear, Undo, Redo,
} from '@mui/icons-material';
import { getMemo, updateMemo } from '../api/memo';
import { useAuth } from '../contexts/AuthContext';

const AUTOSAVE_DELAY = 800;
const LS_KEY = (userId) => `memo_draft_${userId}`;

/* ── Toolbar ────────────────────────────────────────────────── */
function ToolbarBtn({ title, onClick, active, children }) {
  return (
    <Tooltip title={title} placement="top">
      <IconButton
        size="small"
        onMouseDown={(e) => { e.preventDefault(); onClick(); }}
        sx={{
          borderRadius: 1,
          p: '4px',
          color: active ? 'primary.main' : 'text.secondary',
          bgcolor: active ? 'action.selected' : 'transparent',
          '&:hover': { bgcolor: 'action.hover' },
        }}
      >
        {children}
      </IconButton>
    </Tooltip>
  );
}

function EditorToolbar({ editor }) {
  if (!editor) return null;
  const iconSx = { fontSize: 18 };

  return (
    <Box sx={{
      display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.25,
      px: 1.5, py: 0.75,
      borderBottom: '1px solid', borderColor: 'divider',
      bgcolor: 'background.default',
      flexShrink: 0,
    }}>
      {/* History */}
      <ToolbarBtn title="Undo" onClick={() => editor.chain().focus().undo().run()}>
        <Undo sx={iconSx} />
      </ToolbarBtn>
      <ToolbarBtn title="Redo" onClick={() => editor.chain().focus().redo().run()}>
        <Redo sx={iconSx} />
      </ToolbarBtn>

      <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.5 }} />

      {/* Headings */}
      {[1, 2, 3].map(level => (
        <ToolbarBtn
          key={level}
          title={`Heading ${level}`}
          active={editor.isActive('heading', { level })}
          onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
        >
          <Typography sx={{ fontSize: 12, fontWeight: 700, lineHeight: 1, px: 0.25 }}>H{level}</Typography>
        </ToolbarBtn>
      ))}
      <ToolbarBtn
        title="Paragraph"
        active={editor.isActive('paragraph')}
        onClick={() => editor.chain().focus().setParagraph().run()}
      >
        <Typography sx={{ fontSize: 12, fontWeight: 700, lineHeight: 1, px: 0.25 }}>P</Typography>
      </ToolbarBtn>

      <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.5 }} />

      {/* Inline */}
      <ToolbarBtn title="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
        <FormatBold sx={iconSx} />
      </ToolbarBtn>
      <ToolbarBtn title="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <FormatItalic sx={iconSx} />
      </ToolbarBtn>
      <ToolbarBtn title="Underline" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
        <FormatUnderlined sx={iconSx} />
      </ToolbarBtn>
      <ToolbarBtn title="Strikethrough" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
        <FormatStrikethrough sx={iconSx} />
      </ToolbarBtn>

      <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.5 }} />

      {/* Lists */}
      <ToolbarBtn title="Bullet List" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <FormatListBulleted sx={iconSx} />
      </ToolbarBtn>
      <ToolbarBtn title="Numbered List" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        <FormatListNumbered sx={iconSx} />
      </ToolbarBtn>
      <ToolbarBtn title="Blockquote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        <FormatQuote sx={iconSx} />
      </ToolbarBtn>

      <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.5 }} />

      {/* Clear */}
      <ToolbarBtn title="Clear Formatting" onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}>
        <FormatClear sx={iconSx} />
      </ToolbarBtn>
    </Box>
  );
}

/* ── Main Component ─────────────────────────────────────────── */
export default function MemoDialog({ open, onClose }) {
  const { user } = useAuth();
  const [saveStatus, setSaveStatus] = useState('idle');
  const [isLoading, setIsLoading]   = useState(false);

  const timerRef       = useRef(null);
  const isDirtyRef     = useRef(false);
  const initialisedRef = useRef(false);
  const latestContent  = useRef('');

  const lsKey = user ? LS_KEY(user.id) : null;

  /* ── Save to API ── */
  const save = useCallback((html) => {
    setSaveStatus('saving');
    updateMemo(html)
      .then(() => {
        isDirtyRef.current = false;
        setSaveStatus('saved');
        if (lsKey) localStorage.setItem(lsKey, html);
        setTimeout(() => setSaveStatus('idle'), 2000);
      })
      .catch(() => setSaveStatus('idle'));
  }, [lsKey]);

  /* ── TipTap editor ── */
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: 'Write your notes here…' }),
    ],
    content: '',
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      latestContent.current = html;
      isDirtyRef.current = true;
      setSaveStatus('idle');
      if (lsKey) localStorage.setItem(lsKey, html);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => save(html), AUTOSAVE_DELAY);
    },
  });

  /* ── On open: load draft from localStorage, then fetch API ── */
  useEffect(() => {
    if (!open || !editor) return;

    isDirtyRef.current = false;
    setSaveStatus('idle');
    initialisedRef.current = false;

    // 1) Instant draft from localStorage
    if (lsKey) {
      const draft = localStorage.getItem(lsKey);
      if (draft !== null) {
        editor.commands.setContent(draft, false);
        latestContent.current = draft;
        initialisedRef.current = true;
      }
    }

    // 2) Fetch from API — override only if no unsaved edits
    setIsLoading(true);
    getMemo()
      .then((r) => {
        const serverContent = r.data?.data?.content ?? '';
        if (!isDirtyRef.current) {
          editor.commands.setContent(serverContent, false);
          latestContent.current = serverContent;
          if (lsKey) localStorage.setItem(lsKey, serverContent);
        }
        initialisedRef.current = true;
      })
      .finally(() => setIsLoading(false));

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [open, editor]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── On close: flush unsaved changes ── */
  const handleClose = useCallback(() => {
    if (isDirtyRef.current) {
      if (timerRef.current) clearTimeout(timerRef.current);
      save(latestContent.current);
    }
    onClose();
  }, [save, onClose]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: 'hidden',
          height: '72vh',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {/* ── Header ── */}
      <Box sx={{
        display: 'flex', alignItems: 'center',
        px: 2.5, py: 1.5, flexShrink: 0,
        background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
        color: '#fff',
      }}>
        <StickyNote2OutlinedIcon sx={{ mr: 1, fontSize: 20 }} />
        <Typography fontWeight={700} fontSize={16} sx={{ flex: 1 }}>My Memo</Typography>

        <Fade in={saveStatus !== 'idle'}>
          <Chip
            size="small"
            icon={
              saveStatus === 'saving'
                ? <CircularProgress size={12} sx={{ color: 'inherit !important' }} />
                : <CheckCircleOutlineIcon sx={{ fontSize: '14px !important' }} />
            }
            label={saveStatus === 'saving' ? 'Saving...' : 'Saved'}
            sx={{
              mr: 1.5, bgcolor: 'rgba(255,255,255,0.2)', color: '#fff',
              fontWeight: 600, fontSize: 11, height: 26,
              '& .MuiChip-icon': { color: '#fff' },
            }}
          />
        </Fade>

        <IconButton size="small" onClick={handleClose} sx={{ color: '#fff' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* ── Toolbar ── */}
      <EditorToolbar editor={editor} />

      {/* ── Editor area ── */}
      <DialogContent sx={{ p: 0, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {isLoading && !initialisedRef.current ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <Box
            sx={{
              flex: 1, overflow: 'auto', p: 2.5,
              '& .tiptap': {
                outline: 'none',
                minHeight: '100%',
                fontSize: 14,
                lineHeight: 1.75,
                fontFamily: 'inherit',
                color: 'text.primary',
              },
              '& .tiptap p.is-editor-empty:first-child::before': {
                content: 'attr(data-placeholder)',
                color: 'text.disabled',
                pointerEvents: 'none',
                float: 'left',
                height: 0,
              },
              '& .tiptap h1': { fontSize: '1.6rem', fontWeight: 700, mt: 1.5, mb: 0.5 },
              '& .tiptap h2': { fontSize: '1.3rem', fontWeight: 700, mt: 1.5, mb: 0.5 },
              '& .tiptap h3': { fontSize: '1.1rem', fontWeight: 700, mt: 1.5, mb: 0.5 },
              '& .tiptap ul': { pl: 3, mb: 1 },
              '& .tiptap ol': { pl: 3, mb: 1 },
              '& .tiptap li': { mb: 0.25 },
              '& .tiptap blockquote': {
                borderLeft: '3px solid', borderColor: 'divider',
                pl: 2, ml: 0, color: 'text.secondary', fontStyle: 'italic',
              },
              '& .tiptap strong': { fontWeight: 700 },
              '& .tiptap code': {
                bgcolor: 'action.hover', px: 0.5, borderRadius: 0.5,
                fontFamily: 'monospace', fontSize: 13,
              },
              '& .tiptap hr': { border: 'none', borderTop: '1px solid', borderColor: 'divider', my: 2 },
            }}
          >
            <EditorContent editor={editor} />
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
