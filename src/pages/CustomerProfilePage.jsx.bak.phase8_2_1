/**
 * File: /src/pages/CustomerProfilePage.jsx
 * Purpose: Detailed customer profile with editing, notes, and images (Phase 8.0)
 * Connects To: CustomerStore.js, CustomerImageStore.js, CustomerNoteStore.js
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getCustomerById,
  upsertCustomer,
  deleteCustomer
} from '../services/CustomerStore.js';
import {
  listCustomerImages,
  storeCustomerImage
} from '../services/CustomerImageStore.js';
import {
  listNotes,
  addNote,
  deleteNote
} from '../services/CustomerNoteStore.js';
import CustomerImageGallery from '../components/CustomerImageGallery.jsx';

const CustomerProfilePage = () => {
  const { customerId } = useParams();
  const navigate = useNavigate();

  // State
  const [customer, setCustomer] = useState(null);
  const [images, setImages] = useState([]);
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [newNote, setNewNote] = useState('');

  // Load all customer data in parallel
  const loadCustomerData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load customer, images, and notes in parallel
      const [customerData, imagesData, notesData] = await Promise.all([
        getCustomerById(customerId),
        listCustomerImages(customerId),
        listNotes(customerId)
      ]);

      if (!customerData) {
        setError('Customer not found');
        return;
      }

      setCustomer(customerData);
      setImages(imagesData);
      setNotes(notesData);
      setEditForm({
        name: customerData.name || '',
        handle: customerData.handle || '',
        email: customerData.email || '',
        phone: customerData.phone || ''
      });

    } catch (err) {
      console.error('Failed to load customer data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on mount and customerId change
  useEffect(() => {
    if (customerId) {
      loadCustomerData();
    }
  }, [customerId]);

  // Handle form updates
  const handleEditFormChange = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  // Save customer updates
  const handleSaveCustomer = async () => {
    try {
      await upsertCustomer({
        customerId,
        ...editForm
      });
      setIsEditing(false);
      await loadCustomerData(); // Refresh data
    } catch (err) {
      setError(err.message);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditForm({
      name: customer?.name || '',
      handle: customer?.handle || '',
      email: customer?.email || '',
      phone: customer?.phone || ''
    });
    setIsEditing(false);
  };

  // Add a note
  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    try {
      await addNote(customerId, newNote.trim(), 'Staff');
      setNewNote('');
      await loadCustomerData(); // Refresh notes
    } catch (err) {
      setError(err.message);
    }
  };

  // Delete a note
  const handleDeleteNote = async (noteId) => {
    if (!confirm('Delete this note?')) return;

    try {
      await deleteNote(noteId);
      await loadCustomerData(); // Refresh notes
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle image upload
  const handleImageUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    try {
      for (const file of files) {
        await storeCustomerImage(customerId, file, file.name);
      }
      await loadCustomerData(); // Refresh images
    } catch (err) {
      setError(err.message);
    }

    // Clear the input
    event.target.value = '';
  };

  // Delete customer
  const handleDeleteCustomer = async () => {
    if (!confirm(`Permanently delete customer ${customer?.name || customer?.handle}? This will also delete all notes and images.`)) {
      return;
    }

    try {
      await deleteCustomer(customerId);
      navigate('/crm'); // Go back to CRM list
    } catch (err) {
      setError(err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading customer profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="text-red-500 text-xl mr-3">⚠️</div>
            <div>
              <h3 className="text-red-800 font-medium">Error loading customer</h3>
              <p className="text-red-600 mt-1">{error}</p>
              <div className="mt-4 space-x-2">
                <button
                  onClick={() => loadCustomerData()}
                  className="bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700"
                >
                  Retry
                </button>
                <button
                  onClick={() => navigate('/crm')}
                  className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm hover:bg-gray-700"
                >
                  Back to CRM
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!customer) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Profile Image Section - Phase 8.1 */}
      <div className="flex flex-col items-center mb-6">
        <img
          src={customer.profileImageUrl || '/default-avatar.png'}
          alt="Profile"
          className="w-32 h-32 rounded-full object-cover border-2 border-gray-300"
        />
        <button
          onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
          className="text-sm text-blue-500 mt-2 hover:text-blue-700"
        >
          Change Photo
        </button>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/crm')}
            className="text-gray-500 hover:text-gray-700"
          >
            ← Back to CRM
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {customer.name || customer.handle || `Customer ${customerId}`}
            </h1>
            <p className="text-gray-600">
              Customer ID: {customerId}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {!isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                ✏️ Edit
              </button>
              <button
                onClick={handleDeleteCustomer}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                🗑️ Delete
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleSaveCustomer}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                ✅ Save
              </button>
              <button
                onClick={handleCancelEdit}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
              >
                ❌ Cancel
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Contact Information */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4">Contact Information</h2>

            {isEditing ? (
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => handleEditFormChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Handle</label>
                  <input
                    type="text"
                    value={editForm.handle}
                    onChange={(e) => handleEditFormChange('handle', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => handleEditFormChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => handleEditFormChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </form>
            ) : (
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-500">Name:</span>
                  <p className="font-medium">{customer.name || 'Not set'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Handle:</span>
                  <p className="font-medium">{customer.handle || 'Not set'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Email:</span>
                  <p className="font-medium">{customer.email || 'Not set'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Phone:</span>
                  <p className="font-medium">{customer.phone || 'Not set'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Tags:</span>
                  <p className="font-medium">{customer.tagCount || 0}</p>
                </div>
              </div>
            )}
          </div>

          {/* Notes Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4">Notes & Comments</h2>

            {/* Add new note */}
            <div className="mb-4">
              <div className="flex gap-2">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a note..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                />
                <button
                  onClick={handleAddNote}
                  disabled={!newNote.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ➕ Add
                </button>
              </div>
            </div>

            {/* Notes list */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {notes.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No notes yet</p>
              ) : (
                notes.map((note) => (
                  <div key={note.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-sm text-gray-500">
                        {note.author} • {new Date(note.createdAt).toLocaleString()}
                      </div>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        🗑️
                      </button>
                    </div>
                    <p className="text-gray-900 whitespace-pre-wrap">{note.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Images Sidebar */}
        <div className="space-y-6">
          {/* Upload Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h2 className="text-lg font-semibold mb-3">Upload Images</h2>
            <label className="block">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <span className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded-lg cursor-pointer hover:bg-blue-700">
                📷 Add Images
              </span>
            </label>
            <p className="text-xs text-gray-500 mt-1">Upload new images for this customer</p>
          </div>

          {/* Customer Image Gallery - Phase 8.1 */}
          <CustomerImageGallery customerId={customerId} />

          {/* Stats */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">Quick Stats</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Images:</span>
                <span className="font-medium">{images.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Notes:</span>
                <span className="font-medium">{notes.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last delivery:</span>
                <span className="font-medium">
                  {customer.lastDeliveryAt
                    ? new Date(customer.lastDeliveryAt).toLocaleDateString()
                    : 'Never'
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Customer since:</span>
                <span className="font-medium">
                  {new Date(customer.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerProfilePage;
