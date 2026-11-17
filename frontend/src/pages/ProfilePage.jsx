import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../auth/AuthContext.jsx';

const SAMPLE_PET_PHOTOS = [
  { label: 'Golden Retriever', url: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=500&q=80' },
  { label: 'Tabby Cat', url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=500&q=80' },
  { label: 'Cute Puppy', url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=500&q=80' },
  { label: 'Fluffy Rabbit', url: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?auto=format&fit=crop&w=500&q=80' },
  { label: 'Colorful Parrot', url: 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?auto=format&fit=crop&w=500&q=80' },
];

export default function ProfilePage() {
  const { user, updateUser } = useAuth();

  const [activeTab, setActiveTab] = useState('pets'); // 'pets' | 'owner'
  const [profile, setProfile] = useState(null);
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modals state
  const [isEditOwnerOpen, setIsEditOwnerOpen] = useState(false);
  const [isPetModalOpen, setIsPetModalOpen] = useState(false);
  const [editingPet, setEditingPet] = useState(null); // null => add mode, object => edit mode

  // Owner form state
  const [ownerForm, setOwnerForm] = useState({
    name: '',
    phone: '',
    address: '',
    bio: '',
    avatarUrl: '',
    emergencyContact: '',
  });

  // Pet form state
  const [petForm, setPetForm] = useState({
    name: '',
    species: 'Dog',
    breed: '',
    age: '',
    gender: 'Male',
    weight: '',
    photoUrl: '',
    careNotes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const [profileData, petsData] = await Promise.all([
        api('/api/owner/profile'),
        api('/api/pets'),
      ]);
      setProfile(profileData);
      setPets(petsData);
      setOwnerForm({
        name: profileData.name || '',
        phone: profileData.phone || '',
        address: profileData.address || '',
        bio: profileData.bio || '',
        avatarUrl: profileData.avatarUrl || '',
        emergencyContact: profileData.emergencyContact || '',
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function showSuccess(msg) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  }

  // --- Owner Profile Handlers ---
  async function handleSaveOwner(e) {
    e.preventDefault();
    setError('');
    try {
      const updated = await api('/api/owner/profile', {
        method: 'PUT',
        body: ownerForm,
      });
      setProfile(updated);
      updateUser({ name: updated.name });
      setIsEditOwnerOpen(false);
      showSuccess('Owner profile updated successfully!');
    } catch (err) {
      setError(err.message);
    }
  }

  // --- Pet Handlers ---
  function openAddPetModal() {
    setEditingPet(null);
    setPetForm({
      name: '',
      species: 'Dog',
      breed: '',
      age: '',
      gender: 'Male',
      weight: '',
      photoUrl: SAMPLE_PET_PHOTOS[0].url,
      careNotes: '',
    });
    setIsPetModalOpen(true);
  }

  function openEditPetModal(pet) {
    setEditingPet(pet);
    setPetForm({
      name: pet.name || '',
      species: pet.species || 'Dog',
      breed: pet.breed || '',
      age: pet.age || '',
      gender: pet.gender || 'Male',
      weight: pet.weight || '',
      photoUrl: pet.photoUrl || '',
      careNotes: pet.careNotes || '',
    });
    setIsPetModalOpen(true);
  }

  function autofillDemoPet() {
    const demoPets = [
      {
        name: 'Milo',
        species: 'Dog',
        breed: 'Golden Retriever',
        age: '2 years',
        gender: 'Male',
        weight: '28 kg',
        photoUrl: SAMPLE_PET_PHOTOS[0].url,
        careNotes: 'Daily 30 min morning walk. Sensitive stomach: salmon kibble only. Vaccinated on Nov 2026.',
      },
      {
        name: 'Luna',
        species: 'Cat',
        breed: 'British Shorthair',
        age: '1.5 years',
        gender: 'Female',
        weight: '4.2 kg',
        photoUrl: SAMPLE_PET_PHOTOS[1].url,
        careNotes: 'Very calm and indoor-only. Requires monthly grooming. Loves chicken pate treats.',
      },
      {
        name: 'Barnaby',
        species: 'Rabbit',
        breed: 'Holland Lop',
        age: '9 months',
        gender: 'Male',
        weight: '1.8 kg',
        photoUrl: SAMPLE_PET_PHOTOS[3].url,
        careNotes: 'Unlimited timothy hay and fresh greens twice daily. Needs clean water bowl checked daily.',
      },
    ];
    const picked = demoPets[Math.floor(Math.random() * demoPets.length)];
    setPetForm(picked);
  }

  async function handleSavePet(e) {
    e.preventDefault();
    setError('');
    try {
      if (editingPet) {
        const updated = await api(`/api/pets/${editingPet.id}`, {
          method: 'PUT',
          body: petForm,
        });
        setPets(pets.map((p) => (p.id === updated.id ? updated : p)));
        showSuccess(`Pet profile "${updated.name}" updated!`);
      } else {
        const created = await api('/api/pets', {
          method: 'POST',
          body: petForm,
        });
        setPets([created, ...pets]);
        if (profile) {
          setProfile({ ...profile, totalPets: profile.totalPets + 1 });
        }
        showSuccess(`Pet profile "${created.name}" created!`);
      }
      setIsPetModalOpen(false);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeletePet(pet) {
    if (!window.confirm(`Are you sure you want to remove ${pet.name}'s profile?`)) {
      return;
    }
    setError('');
    try {
      await api(`/api/pets/${pet.id}`, { method: 'DELETE' });
      setPets(pets.filter((p) => p.id !== pet.id));
      if (profile && profile.totalPets > 0) {
        setProfile({ ...profile, totalPets: profile.totalPets - 1 });
      }
      showSuccess(`Pet profile "${pet.name}" removed.`);
    } catch (err) {
      setError(err.message);
    }
  }

  const getSpeciesEmoji = (species = '') => {
    const s = species.toLowerCase();
    if (s.includes('dog')) return '🐶';
    if (s.includes('cat')) return '🐱';
    if (s.includes('bird') || s.includes('parrot')) return '🦜';
    if (s.includes('rabbit') || s.includes('bunny')) return '🐰';
    if (s.includes('hamster')) return '🐹';
    if (s.includes('fish')) return '🐠';
    return '🐾';
  };

  if (loading) {
    return (
      <div className="profile-container text-center">
        <p className="loading-spinner">🐾 Loading your Pet & Owner profiles…</p>
      </div>
    );
  }

  return (
    <div className="profile-container">
      {/* Page Header */}
      <header className="profile-hero">
        <div className="hero-content">
          <div className="avatar-wrapper">
            <img
              src={
                profile?.avatarUrl ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
              }
              alt={profile?.name || 'Owner Avatar'}
              className="owner-avatar-img"
              onError={(e) => {
                e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(profile?.name || 'Owner');
              }}
            />
          </div>
          <div className="hero-text">
            <div className="hero-badge">Verified Pet Parent 🛡️</div>
            <h1>{profile?.name || user?.name}</h1>
            <p className="hero-meta">
              📧 {profile?.email} • 📍 {profile?.address || 'Location not set'}
            </p>
            {profile?.bio && <p className="hero-bio">“{profile.bio}”</p>}
          </div>
          <div className="hero-stats">
            <div className="stat-box">
              <span className="stat-number">{pets.length}</span>
              <span className="stat-label">Registered Pets</span>
            </div>
            <button
              className="btn btn-outline"
              onClick={() => setIsEditOwnerOpen(true)}
            >
              ✏️ Edit Profile
            </button>
          </div>
        </div>
      </header>

      {/* Notifications */}
      {error && <div className="alert alert-error">⚠️ {error}</div>}
      {successMsg && <div className="alert alert-success">✅ {successMsg}</div>}

      {/* Navigation Tabs */}
      <div className="profile-tabs">
        <button
          className={`tab-btn ${activeTab === 'pets' ? 'active' : ''}`}
          onClick={() => setActiveTab('pets')}
        >
          🐾 My Pets ({pets.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'owner' ? 'active' : ''}`}
          onClick={() => setActiveTab('owner')}
        >
          👤 Owner Information
        </button>
      </div>

      {/* TAB 1: PETS */}
      {activeTab === 'pets' && (
        <section className="tab-pane">
          <div className="section-header">
            <div>
              <h2>Manage Pet Profiles</h2>
              <p className="muted">
                Keep comprehensive health details, care instructions, and notes for all your companions.
              </p>
            </div>
            <button className="btn btn-primary" onClick={openAddPetModal}>
              ➕ Add New Pet
            </button>
          </div>

          {pets.length === 0 ? (
            <div className="empty-state-card card">
              <div className="empty-emoji">🐾</div>
              <h3>No pets registered yet</h3>
              <p className="muted">
                Create a profile for your dog, cat, or any furry companion to manage their health records, age, and care notes.
              </p>
              <button className="btn btn-primary" onClick={openAddPetModal}>
                ➕ Register Your First Pet
              </button>
            </div>
          ) : (
            <div className="pets-grid">
              {pets.map((pet) => (
                <div key={pet.id} className="pet-card card">
                  <div className="pet-card-image-wrapper">
                    <img
                      src={
                        pet.photoUrl ||
                        'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=500&q=80'
                      }
                      alt={pet.name}
                      className="pet-card-image"
                      onError={(e) => {
                        e.target.src = 'https://placehold.co/400x300?text=' + encodeURIComponent(pet.name);
                      }}
                    />
                    <span className="species-badge">
                      {getSpeciesEmoji(pet.species)} {pet.species}
                    </span>
                  </div>

                  <div className="pet-card-body">
                    <div className="pet-card-header">
                      <h3 className="pet-name">{pet.name}</h3>
                      <span className="breed-pill">{pet.breed || 'Mixed / Unknown'}</span>
                    </div>

                    <div className="pet-meta-row">
                      <span className="meta-item">
                        <strong>🎂 Age:</strong> {pet.age || 'Not specified'}
                      </span>
                      <span className="meta-item">
                        <strong>⚧ Gender:</strong> {pet.gender || 'Not specified'}
                      </span>
                      <span className="meta-item">
                        <strong>⚖️ Weight:</strong> {pet.weight || 'Not specified'}
                      </span>
                    </div>

                    {pet.careNotes ? (
                      <div className="care-notes-box">
                        <div className="care-notes-title">📋 Care & Health Notes</div>
                        <p className="care-notes-text">{pet.careNotes}</p>
                      </div>
                    ) : (
                      <div className="care-notes-box muted">
                        <em>No care notes entered yet.</em>
                      </div>
                    )}

                    <div className="pet-actions">
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => openEditPetModal(pet)}
                      >
                        ✏️ Edit Pet
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDeletePet(pet)}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* TAB 2: OWNER INFORMATION */}
      {activeTab === 'owner' && (
        <section className="tab-pane">
          <div className="section-header">
            <div>
              <h2>Owner Profile Details</h2>
              <p className="muted">Your personal information and emergency contact data.</p>
            </div>
            <button
              className="btn btn-outline"
              onClick={() => setIsEditOwnerOpen(true)}
            >
              ✏️ Edit Information
            </button>
          </div>

          <div className="owner-details-grid">
            <div className="card detail-card">
              <h3>👤 Personal Information</h3>
              <div className="detail-item">
                <span className="detail-label">Full Name:</span>
                <span className="detail-value">{profile?.name}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Email Address:</span>
                <span className="detail-value">{profile?.email}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Phone Number:</span>
                <span className="detail-value">{profile?.phone || 'Not provided'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Home Address:</span>
                <span className="detail-value">{profile?.address || 'Not provided'}</span>
              </div>
            </div>

            <div className="card detail-card">
              <h3>🚨 Emergency & Care Support</h3>
              <div className="detail-item">
                <span className="detail-label">Emergency Contact:</span>
                <span className="detail-value highlight-value">
                  {profile?.emergencyContact || 'Not specified (Recommended for pet safety)'}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Total Registered Pets:</span>
                <span className="detail-value">{pets.length} companion(s)</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Bio / About:</span>
                <p className="detail-bio">{profile?.bio || 'No bio written yet.'}</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* MODAL: EDIT OWNER PROFILE */}
      {isEditOwnerOpen && (
        <div className="modal-overlay" onClick={() => setIsEditOwnerOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>✏️ Update Owner Profile</h3>
              <button
                className="close-btn"
                onClick={() => setIsEditOwnerOpen(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveOwner}>
              <label>
                Full Name *
                <input
                  type="text"
                  required
                  value={ownerForm.name}
                  onChange={(e) =>
                    setOwnerForm({ ...ownerForm, name: e.target.value })
                  }
                />
              </label>

              <label>
                Phone Number
                <input
                  type="text"
                  placeholder="e.g. +880 1700-000000"
                  value={ownerForm.phone}
                  onChange={(e) =>
                    setOwnerForm({ ...ownerForm, phone: e.target.value })
                  }
                />
              </label>

              <label>
                Address / City
                <input
                  type="text"
                  placeholder="e.g. Dhaka, Bangladesh"
                  value={ownerForm.address}
                  onChange={(e) =>
                    setOwnerForm({ ...ownerForm, address: e.target.value })
                  }
                />
              </label>

              <label>
                Emergency Contact Number / Vet
                <input
                  type="text"
                  placeholder="e.g. +880 1800-000000 (Central Vet Hospital)"
                  value={ownerForm.emergencyContact}
                  onChange={(e) =>
                    setOwnerForm({
                      ...ownerForm,
                      emergencyContact: e.target.value,
                    })
                  }
                />
              </label>

              <label>
                Avatar Photo URL
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={ownerForm.avatarUrl}
                  onChange={(e) =>
                    setOwnerForm({ ...ownerForm, avatarUrl: e.target.value })
                  }
                />
              </label>

              <label>
                About You / Pet Parent Bio
                <textarea
                  rows={3}
                  placeholder="Tell us a little bit about yourself and your pets..."
                  value={ownerForm.bio}
                  onChange={(e) =>
                    setOwnerForm({ ...ownerForm, bio: e.target.value })
                  }
                />
              </label>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setIsEditOwnerOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT PET */}
      {isPetModalOpen && (
        <div className="modal-overlay" onClick={() => setIsPetModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingPet ? '✏️ Edit Pet Profile' : '➕ Register New Pet'}</h3>
              <button
                className="close-btn"
                onClick={() => setIsPetModalOpen(false)}
              >
                ✕
              </button>
            </div>

            {!editingPet && (
              <div className="demo-helper-bar">
                <span>Quick demo autofill:</span>
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  onClick={autofillDemoPet}
                >
                  ✨ Fill Sample Pet Data
                </button>
              </div>
            )}

            <form onSubmit={handleSavePet}>
              <div className="form-row">
                <label className="flex-1">
                  Pet Name *
                  <input
                    type="text"
                    required
                    placeholder="e.g. Milo, Bella, Charlie"
                    value={petForm.name}
                    onChange={(e) =>
                      setPetForm({ ...petForm, name: e.target.value })
                    }
                  />
                </label>

                <label className="flex-1">
                  Species *
                  <select
                    value={petForm.species}
                    onChange={(e) =>
                      setPetForm({ ...petForm, species: e.target.value })
                    }
                    className="select-input"
                  >
                    <option value="Dog">🐶 Dog</option>
                    <option value="Cat">🐱 Cat</option>
                    <option value="Bird">🦜 Bird</option>
                    <option value="Rabbit">🐰 Rabbit</option>
                    <option value="Hamster">🐹 Hamster</option>
                    <option value="Fish">🐠 Fish</option>
                    <option value="Other">🐾 Other</option>
                  </select>
                </label>
              </div>

              <div className="form-row">
                <label className="flex-1">
                  Breed
                  <input
                    type="text"
                    placeholder="e.g. Golden Retriever, Persian"
                    value={petForm.breed}
                    onChange={(e) =>
                      setPetForm({ ...petForm, breed: e.target.value })
                    }
                  />
                </label>

                <label className="flex-1">
                  Age
                  <input
                    type="text"
                    placeholder="e.g. 2 years, 6 months"
                    value={petForm.age}
                    onChange={(e) =>
                      setPetForm({ ...petForm, age: e.target.value })
                    }
                  />
                </label>
              </div>

              <div className="form-row">
                <label className="flex-1">
                  Gender
                  <select
                    value={petForm.gender}
                    onChange={(e) =>
                      setPetForm({ ...petForm, gender: e.target.value })
                    }
                    className="select-input"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Unknown">Unknown</option>
                  </select>
                </label>

                <label className="flex-1">
                  Weight
                  <input
                    type="text"
                    placeholder="e.g. 15 kg, 4.5 lbs"
                    value={petForm.weight}
                    onChange={(e) =>
                      setPetForm({ ...petForm, weight: e.target.value })
                    }
                  />
                </label>
              </div>

              <label>
                Photo URL
                <input
                  type="url"
                  placeholder="https://..."
                  value={petForm.photoUrl}
                  onChange={(e) =>
                    setPetForm({ ...petForm, photoUrl: e.target.value })
                  }
                />
              </label>

              {/* Sample Photo Quick Select */}
              <div className="preset-photos-container">
                <span className="preset-label">Or choose an avatar photo:</span>
                <div className="preset-photos">
                  {SAMPLE_PET_PHOTOS.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`preset-photo-thumb ${
                        petForm.photoUrl === sample.url ? 'selected' : ''
                      }`}
                      onClick={() =>
                        setPetForm({ ...petForm, photoUrl: sample.url })
                      }
                      title={sample.label}
                    >
                      <img src={sample.url} alt={sample.label} />
                    </button>
                  ))}
                </div>
              </div>

              <label>
                Care-Related Notes & Medical Info
                <textarea
                  rows={4}
                  placeholder="Feeding habits, allergies, medication routines, temperament, special preferences..."
                  value={petForm.careNotes}
                  onChange={(e) =>
                    setPetForm({ ...petForm, careNotes: e.target.value })
                  }
                />
              </label>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setIsPetModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingPet ? 'Update Pet' : 'Register Pet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
