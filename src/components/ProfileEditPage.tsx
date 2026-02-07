import React, { useState } from 'react';
import { User, Mail, Languages, Loader2, AlertCircle, CheckCircle, Camera, ArrowLeft } from 'lucide-react';
import { UserProfile, Language } from '../types';
import { updateUserProfile } from '../services/supabaseService';

interface ProfileEditPageProps {
  user: UserProfile;
  onSave: (user: UserProfile) => void;
  onCancel: () => void;
}

export const ProfileEditPage: React.FC<ProfileEditPageProps> = ({ user, onSave, onCancel }) => {
  const [name, setName] = useState(user.name);
  const [language, setLanguage] = useState(user.language);
  const [avatar, setAvatar] = useState(user.avatar);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleGenerateAvatar = () => {
    const newAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${name.replace(/\s+/g, '')}${Date.now()}`;
    setAvatar(newAvatar);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      const updatedUser = await updateUserProfile(user.id, {
        ...user,
        name,
        language,
        avatar,
      });

      if (updatedUser) {
        setSuccess(true);
        setTimeout(() => {
          onSave(updatedUser);
        }, 1500);
      } else {
        setError('Failed to update profile');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 max-h-screen overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Edit Profile</h2>
          <button
            onClick={onCancel}
            disabled={loading}
            className="text-slate-400 hover:text-slate-600 transition"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Section */}
          <div className="text-center">
            <div className="inline-block relative mb-4">
              <img
                src={avatar}
                alt={name}
                className="w-24 h-24 rounded-full border-4 border-indigo-200"
              />
              <button
                type="button"
                onClick={handleGenerateAvatar}
                disabled={loading}
                className="absolute bottom-0 right-0 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white p-2 rounded-full shadow-lg transition"
                title="Generate new avatar"
              >
                <Camera size={16} />
              </button>
            </div>
            <p className="text-xs text-slate-500">Click camera to generate new avatar</p>
          </div>

          {/* Name Field */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-slate-400" size={20} />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your Name"
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                disabled={loading}
                required
              />
            </div>
          </div>

          {/* Language Field */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Preferred Language
            </label>
            <div className="relative">
              <Languages className="absolute left-3 top-3 text-slate-400" size={20} />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition appearance-none bg-white"
                disabled={loading}
              >
                <option value={Language.EN}>English</option>
                <option value={Language.NP}>नेपाली (Nepali)</option>
              </select>
            </div>
          </div>

          {/* Email (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-slate-400" size={20} />
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-600"
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={18} />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
              <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={18} />
              <p className="text-sm text-green-700">Profile updated successfully! ✨</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-100 text-slate-700 font-semibold rounded-lg transition flex items-center justify-center gap-2"
            >
              <ArrowLeft size={18} />
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
