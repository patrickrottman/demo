// LocalStorage utility functions for managing application data

const STORAGE_KEYS = {
  APPLICATIONS: 'teacher_applications',
  AUTH_TOKEN: 'auth_token',
  CURRENT_USER: 'current_user',
};

// Applications CRUD operations
export const getApplications = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.APPLICATIONS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading applications from storage:', error);
    return [];
  }
};

export const saveApplication = (application) => {
  try {
    const applications = getApplications();
    const newApplication = {
      ...application,
      id: Date.now().toString(),
      submittedAt: new Date().toISOString(),
      status: 'pending',
      comments: [],
    };
    applications.push(newApplication);
    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(applications));
    return newApplication;
  } catch (error) {
    console.error('Error saving application:', error);
    throw error;
  }
};

export const updateApplication = (id, updates) => {
  try {
    const applications = getApplications();
    const index = applications.findIndex(app => app.id === id);

    if (index === -1) {
      throw new Error('Application not found');
    }

    applications[index] = {
      ...applications[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(applications));
    return applications[index];
  } catch (error) {
    console.error('Error updating application:', error);
    throw error;
  }
};

export const getApplicationById = (id) => {
  const applications = getApplications();
  return applications.find(app => app.id === id);
};

export const addComment = (applicationId, comment) => {
  try {
    const applications = getApplications();
    const index = applications.findIndex(app => app.id === applicationId);

    if (index === -1) {
      throw new Error('Application not found');
    }

    const newComment = {
      id: Date.now().toString(),
      text: comment,
      createdAt: new Date().toISOString(),
      author: getCurrentUser()?.username || 'Admin',
    };

    applications[index].comments = [...(applications[index].comments || []), newComment];
    applications[index].updatedAt = new Date().toISOString();

    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(applications));
    return applications[index];
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
};

// Authentication
export const setAuthToken = (token) => {
  localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
};

export const getAuthToken = () => {
  return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
};

export const removeAuthToken = () => {
  localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
};

export const setCurrentUser = (user) => {
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
};

export const getCurrentUser = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error reading current user:', error);
    return null;
  }
};

// Initialize with mock data if empty
export const initializeStorage = () => {
  const applications = getApplications();
  if (applications.length === 0) {
    // Will be populated by mockData.js
    return true;
  }
  return false;
};

// Clear all data (for testing)
export const clearAllData = () => {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
};
