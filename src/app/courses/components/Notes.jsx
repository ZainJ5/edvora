'use client';

import { useState, useEffect, useRef } from 'react';
import { FaSave, FaClock, FaInfoCircle, FaRegTrashAlt } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const Notes = ({ courseId, lectureId, lectureTitle }) => {
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [wordCount, setWordCount] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const autoSaveTimerRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    loadNote();
  }, [lectureId, courseId]);

  useEffect(() => {
    const words = note.trim() ? note.trim().split(/\s+/).length : 0;
    setWordCount(words);
  }, [note]);

  useEffect(() => {
    if (autoSaveEnabled && note.trim()) {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      
      autoSaveTimerRef.current = setTimeout(() => {
        saveNote(true);
      }, 3000); 
    }
    
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [note, autoSaveEnabled]);

  const loadNote = () => {
    try {
      const notesJson = localStorage.getItem(`course_${courseId}_notes`);
      if (notesJson) {
        const notesData = JSON.parse(notesJson);
        if (notesData[lectureId]) {
          setNote(notesData[lectureId]);
        } else {
          setNote('');
        }
      }
    } catch (error) {
      console.error('Error loading notes:', error);
      toast.error('Failed to load your notes');
    }
  };

  const saveNote = async (isAutoSave = false) => {
    if (!note.trim() && isAutoSave) return;
    
    try {
      setIsSaving(true);
      
      const existingNotesJson = localStorage.getItem(`course_${courseId}_notes`);
      const existingNotes = existingNotesJson ? JSON.parse(existingNotesJson) : {};
      
      const updatedNotes = {
        ...existingNotes,
        [lectureId]: note.trim()
      };
      
      localStorage.setItem(`course_${courseId}_notes`, JSON.stringify(updatedNotes));
      
      const currentTime = new Date();
      setLastSaved(currentTime);
      
      if (!isAutoSave) {
        toast.success('Note saved successfully');
      }
    } catch (error) {
      console.error('Error saving note:', error);
      toast.error('Failed to save your note');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteNote = () => {
    try {
      const notesJson = localStorage.getItem(`course_${courseId}_notes`);
      if (notesJson) {
        const notesData = JSON.parse(notesJson);
        if (notesData[lectureId]) {
          delete notesData[lectureId];
          localStorage.setItem(`course_${courseId}_notes`, JSON.stringify(notesData));
          setNote('');
          toast.success('Note deleted successfully');
        }
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Failed to delete note');
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  const formatLastSavedTime = () => {
    if (!lastSaved) return '';
    
    const now = new Date();
    const diffInMinutes = Math.floor((now - lastSaved) / 60000);
    
    if (diffInMinutes < 1) return 'Saved just now';
    if (diffInMinutes === 1) return 'Saved 1 minute ago';
    if (diffInMinutes < 60) return `Saved ${diffInMinutes} minutes ago`;
    
    const hours = Math.floor(diffInMinutes / 60);
    if (hours === 1) return 'Saved 1 hour ago';
    return `Saved ${hours} hours ago`;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="p-4 border-b border-gray-200 flex flex-wrap justify-between items-center">
        <h3 className="text-lg font-medium text-gray-800">
          Notes: {lectureTitle}
        </h3>
        
        <div className="flex items-center space-x-3 mt-2 sm:mt-0">
          <div className="flex items-center text-sm text-gray-500">
            <input
              type="checkbox"
              id="auto-save"
              checked={autoSaveEnabled}
              onChange={() => setAutoSaveEnabled(!autoSaveEnabled)}
              className="mr-2 h-4 w-4 text-[#2c3180] focus:ring-[#2c3180] border-gray-300 rounded"
            />
            <label htmlFor="auto-save">Auto-save</label>
          </div>
          
          {lastSaved && (
            <span className="text-xs text-gray-500 flex items-center">
              <FaClock className="mr-1" />
              {formatLastSavedTime()}
            </span>
          )}
        </div>
      </div>
      
      <div className="p-4">
        {/* <div className="mb-2 text-xs text-gray-500 flex items-center">
          <FaInfoCircle className="mr-1" />
          Your notes are stored locally in this browser
        </div> */}
        
        <textarea
          ref={textareaRef}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full h-64 p-3 border border-gray-300 rounded-md focus:ring-[#2c3180] focus:border-[#2c3180] resize-none"
          placeholder="Take notes for this lecture..."
        ></textarea>
        
        <div className="mt-3 flex flex-wrap justify-between items-center">
          <div className="text-sm text-gray-500 flex-shrink-0 mb-2 sm:mb-0">
            {wordCount === 1 ? '1 word' : `${wordCount} words`}
          </div>
          
          <div className="flex space-x-3">
            {note.trim() && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3 py-2 border border-red-300 text-red-600 rounded-md hover:bg-red-50 flex items-center"
              >
                <FaRegTrashAlt className="mr-2" />
                Delete
              </button>
            )}
            
            <button
              onClick={() => saveNote(false)}
              disabled={isSaving || !note.trim()}
              className={`px-4 py-2 rounded-md flex items-center ${
                isSaving || !note.trim() 
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                  : 'bg-[#2c3180] text-white hover:bg-opacity-90'
              }`}
            >
              {isSaving ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <FaSave className="mr-2" />
                  Save Note
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium mb-3">Delete Note</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete this note? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteNote}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notes;