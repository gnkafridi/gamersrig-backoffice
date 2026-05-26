import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  LooksOne, LooksTwo, Looks3,
} from '@mui/icons-material';
import { getMemo, updateMemo } from '../api/memo';
import { useAuth } from '../contexts/AuthContext';

const AUTOSAVE_DELAY = 800;
const LS_KEY = (userId) => `memo_draft_${userId}`;

/* ── Toolbar button ─────────────────────────────────────────── */
function TB({ title, onClick, active, children }) {
  return (
    <Tooltip title={title} placement="top">
      <IconButton
        size="small"
        onMouseDown={(e) => { e.preventDefault(); onClick(); }}
        sx={{
          borderRadius: 1, p: '4px',
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

/* ── Toolbar ────────────────────────────────────────────────── */
function Toolbar({ editorRef, onFormat }) {
  const [activeFormats, setActiveFormats] = useState({});

  // Update active states when selection changes
  const updateActive = useCallback(() => {
    setActiveFormats({
      bold:        document.queryCommandState('bold'),
      italic:      document.queryCommandState('italic'),
      underline:   document.queryCommandState('underline'),
      strikeThrough: document.queryCommandState('strikeThrough'),
      insertUnorderedList: document.queryCommandState('insertUnorderedList'),
      insertOrderedList:   document.queryCommandState('insertOrderedList'),
    });
  }, []);

  useEffect(() => {
    document.addEventListener('selectionchange', updateActive);
    return () => document.removeEventListener('selectionchange', updateActive);
  }, [updateActive]);

  const exec = (cmd, value) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, value ?? null);
    onFormat();
    updateActive();
  };

  const sz = { fontSize: 18 };

  return (
    <Box sx={{
      display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.25,
      px: 1.5, py: 0.75, flexShrink: 0,
      borderBottom: '1px solid', borderColor: 'divider',
      bgcolor: 'background.default',
    }}>
      <TB title="Undo" onClick={() => exec('undo')}><Undo sx={sz} /></TB>
      <TB title="Redo" onClick={() => exec('redo')}><Redo sx={sz} /></TB>

      <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.5 }} />

      <TB title="Heading 1" onClick={() => exec('formatBlock', '<h1>')}><LooksOne sx={sz} /></TB>
      <TB title="Heading 2" onClick={() => exec('formatBlock', '<h2>')}><LooksTwo sx={sz} /></TB>
      <TB title="Heading 3" onClick={() => exec('formatBlock', '<h3>')}><Looks3 sx={sz} /></TB>
      <TB title="Paragraph" onClick={() => exec('formatBlock', '<p>')}>
        <Typography sx={{ fontSize: 12, fontWeight: 700, px: 0.25, lineHeight: 1 }}>P</Typography>
      </TB>

      <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.5 }} />

      <TB title="Bold"          active={activeFormats.bold}          onClick={() => exec('bold')}><FormatBold sx={sz} /></TB>
      <TB title="Italic"        active={activeFormats.italic}        onClick={() => exec('italic')}><FormatItalic sx={sz} /></TB>
      <TB title="Underline"     active={activeFormats.underline}     onClick={() => exec('underline')}><FormatUnderlined sx={sz} /></TB>
      <TB title="Strikethrough" active={activeFormats.strikeThrough} onClick={() => exec('strikeThrough')}><FormatStrikethrough sx={sz} /></TB>

      <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.5 }} />

      <TB title="Bullet List"   active={activeFormats.insertUnorderedList} onClick={() => exec('insertUnorderedList')}><FormatListBulleted sx={sz} /></TB>
      <TB title="Numbered List" active={activeFormats.insertOrderedList}   onClick={() => exec('insertOrderedList')}><FormatListNumbered sx={sz} /></TB>
      <TB title="Blockquote"    onClick={() => exec('formatBlock', '<blockquote>')}><FormatQuote sx={sz} /></TB>

      <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.5 }} />

      <TB title="Clear Formatting" onClick={() => { exec('removeFormat'); exec('formatBlock', '<p>'); }}>
        <FormatClear sx={sz} />
      </TB>
    </Box>
  );
}

/* ── Main Component ─────────────────────────────────────────── */
export default function MemoDialog({ open, onClose }) {
  const { user } = useAuth();
  const [saveStatus, setSaveStatus] = useState('idle');
  const [isLoading, setIsLoading]   = useState(false);
  const [ready, setReady]           = useState(false);

  const editorRef  = useRef(null);
  const timerRef   = useRef(null);
  const isDirtyRef = useRef(false);
  const lsKey      = user ? LS_KEY(user.id) : null;

  const getHTML = () => editorRef.current?.innerHTML ?? '';
  const setHTML = (html) => {
    if (editorRef.current) editorRef.current.innerHTML = html || '';
  };

  /* ── Save ── */
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

  /* ── Load on open ── */
  useEffect(() => {
    if (!open) { setReady(false); return; }

    isDirtyRef.current = false;
    setSaveStatus('idle');

    // Instant: localStorage
    const draft = lsKey ? localStorage.getItem(lsKey) : null;
    if (draft !== null) {
      setHTML(draft);
      setReady(true);
    }

    // API fetch
    setIsLoading(true);
    getMemo()
      .then((r) => {
        const server = r.data?.data?.content ?? '';
        if (!isDirtyRef.current) {
          setHTML(server);
          if (lsKey) localStorage.setItem(lsKey, server);
        }
        setReady(true);
      })
      .finally(() => setIsLoading(false));

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Handle input ── */
  const handleInput = useCallback(() => {
    const html = getHTML();
    isDirtyRef.current = true;
    setSaveStatus('idle');
    if (lsKey) localStorage.setItem(lsKey, html);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => save(html), AUTOSAVE_DELAY);
  }, [save, lsKey]);

  /* ── Close ── */
  const handleClose = useCallback(() => {
    if (isDirtyRef.current) {
      if (timerRef.current) clearTimeout(timerRef.current);
      save(getHTML());
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
        sx: { borderRadius: 3, overflow: 'hidden', height: '72vh', display: 'flex', flexDirection: 'column' },
      }}
    >
      {/* Header */}
      <Box sx={{
        display: 'flex', alignItems: 'center', px: 2.5, py: 1.5, flexShrink: 0,
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

      {/* Toolbar */}
      <Toolbar editorRef={editorRef} onFormat={handleInput} />

      {/* Editor */}
      <DialogContent sx={{ p: 0, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {isLoading && !ready ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <Box
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={handleInput}
            sx={{
              flex: 1, overflow: 'auto', p: 2.5, outline: 'none',
              fontSize: 14, lineHeight: 1.75, fontFamily: 'inherit',
              color: 'text.primary',
              '&:empty:before': {
                content: '"Write your notes here…"',
                color: 'text.disabled',
                pointerEvents: 'none',
              },
              '& h1': { fontSize: '1.5rem', fontWeight: 700, mt: 1.5, mb: 0.5 },
              '& h2': { fontSize: '1.25rem', fontWeight: 700, mt: 1.5, mb: 0.5 },
              '& h3': { fontSize: '1.1rem', fontWeight: 700, mt: 1.5, mb: 0.5 },
              '& ul': { pl: '1.5rem', mb: 1 },
              '& ol': { pl: '1.5rem', mb: 1 },
              '& li': { mb: '2px' },
              '& blockquote': {
                borderLeft: '3px solid #4ade80', pl: '12px', ml: 0,
                color: 'text.secondary', fontStyle: 'italic', my: 1,
              },
              '& b, & strong': { fontWeight: 700 },
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
