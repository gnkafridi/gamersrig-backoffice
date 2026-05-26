import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import {
  Box, Dialog, DialogContent, IconButton,
  Typography, Chip, Fade, CircularProgress,
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  StickyNote2Outlined as StickyNote2OutlinedIcon,
} from '@mui/icons-material';
import { getMemo, updateMemo } from '../api/memo';
import { useAuth } from '../contexts/AuthContext';

const AUTOSAVE_DELAY = 800;
const LS_KEY = (userId) => `memo_draft_${userId}`;

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ color: [] }, { background: [] }],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ indent: '-1' }, { indent: '+1' }],
    ['blockquote'],
    ['link'],
    ['clean'],
  ],
};

const quillFormats = [
  'header', 'bold', 'italic', 'underline', 'strike',
  'color', 'background', 'list', 'indent', 'blockquote', 'link',
];

export default function MemoDialog({ open, onClose }) {
  const { user } = useAuth();
  const [content, setContent]       = useState('');
  const [saveStatus, setSaveStatus]  = useState('idle'); // 'idle' | 'saving' | 'saved'
  const [isLoading, setIsLoading]    = useState(false);

  const timerRef       = useRef(null);
  const isDirtyRef     = useRef(false);
  const initialisedRef = useRef(false);

  const lsKey = user ? LS_KEY(user.id) : null;

  // On open: show localStorage draft immediately, then fetch from API
  useEffect(() => {
    if (!open) {
      initialisedRef.current = false;
      return;
    }

    // 1) Show cached draft instantly
    if (lsKey) {
      const draft = localStorage.getItem(lsKey);
      if (draft !== null) {
        setContent(draft);
        initialisedRef.current = true;
      }
    }

    // 2) Fetch from API (replace only if no unsaved local edits)
    setIsLoading(true);
    getMemo()
      .then((r) => {
        const serverContent = r.data?.data?.content ?? '';
        if (!isDirtyRef.current) {
          setContent(serverContent);
          if (lsKey) localStorage.setItem(lsKey, serverContent);
        }
        initialisedRef.current = true;
      })
      .finally(() => setIsLoading(false));

    isDirtyRef.current = false;
    setSaveStatus('idle');
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Save to API
  const save = useCallback((value) => {
    setSaveStatus('saving');
    updateMemo(value)
      .then(() => {
        isDirtyRef.current = false;
        setSaveStatus('saved');
        if (lsKey) localStorage.setItem(lsKey, value);
        setTimeout(() => setSaveStatus('idle'), 2000);
      })
      .catch(() => setSaveStatus('idle'));
  }, [lsKey]);

  // On every keystroke: update localStorage + debounce API save
  const handleChange = useCallback((value) => {
    setContent(value);
    isDirtyRef.current = true;
    setSaveStatus('idle');
    if (lsKey) localStorage.setItem(lsKey, value);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => save(value), AUTOSAVE_DELAY);
  }, [save, lsKey]);

  // On close: flush any pending save immediately
  const handleClose = useCallback(() => {
    if (isDirtyRef.current) {
      if (timerRef.current) clearTimeout(timerRef.current);
      save(content);
    }
    onClose();
  }, [content, save, onClose]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

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
          height: '70vh',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {/* Header */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        px: 2.5,
        py: 1.5,
        background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
        color: '#fff',
        flexShrink: 0,
      }}>
        <StickyNote2OutlinedIcon sx={{ mr: 1, fontSize: 20 }} />
        <Typography fontWeight={700} fontSize={16} sx={{ flex: 1 }}>
          My Memo
        </Typography>

        {/* Save status chip */}
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
              mr: 1.5,
              bgcolor: 'rgba(255,255,255,0.2)',
              color: '#fff',
              fontWeight: 600,
              fontSize: 11,
              height: 26,
              '& .MuiChip-icon': { color: '#fff' },
            }}
          />
        </Fade>

        <IconButton size="small" onClick={handleClose} sx={{ color: '#fff' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Editor */}
      <DialogContent
        sx={{
          p: 0,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          '& .quill': {
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          },
          '& .ql-toolbar': {
            borderTop: 0,
            borderLeft: 0,
            borderRight: 0,
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.default',
            flexShrink: 0,
          },
          '& .ql-container': {
            flex: 1,
            border: 0,
            fontSize: 14,
            fontFamily: 'inherit',
            overflow: 'auto',
          },
          '& .ql-editor': {
            minHeight: '100%',
            p: 2.5,
            lineHeight: 1.7,
          },
          '& .ql-editor.ql-blank::before': {
            fontStyle: 'normal',
            color: 'text.disabled',
          },
        }}
      >
        {isLoading && !initialisedRef.current ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <ReactQuill
            theme="snow"
            value={content}
            onChange={handleChange}
            modules={quillModules}
            formats={quillFormats}
            placeholder="Write your notes here..."
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
