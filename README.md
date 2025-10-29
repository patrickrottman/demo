# Teacher Credential Management POC

A React-based proof-of-concept application for managing teacher credential submissions for advanced accreditation approval.

## Features

### Public Interface
- Multi-step application form for teachers to submit credentials
- Personal information collection (name, email, phone)
- Professional details (experience, certifications, education)
- Document upload support (PDF, DOC, DOCX, JPG, PNG)
- Teaching philosophy submission
- Success confirmation with application ID

### Admin Interface
- Secure login (mock authentication)
- Dashboard with statistics and analytics
- Applications list with search and filtering
- Detailed application review pages
- Approve/reject workflow
- Comment and feedback system
- Status tracking (pending, approved, rejected)

### UI Features
- Dark mode / Light mode toggle
- Theme preference saved to localStorage
- Fully responsive design
- Material-UI components throughout

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Material-UI (MUI)** - Component library
- **React Router v6** - Navigation
- **LocalStorage** - Data persistence (POC only)

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser to the URL shown (typically http://localhost:5173)

**Note:** Vite automatically watches for file changes and updates your browser instantly. Just save any file and see the changes immediately!

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## Usage

### For Teachers (Public Access)

1. Navigate to the home page
2. Fill out the multi-step application form:
   - Step 1: Personal Information
   - Step 2: Professional Details
   - Step 3: Documents & Teaching Philosophy
3. Submit the application
4. Save your application ID for reference

### For Administrators

1. Click "Login" in the navigation bar
2. Use the demo credentials:
   - **Username:** admin
   - **Password:** admin
3. Access the admin dashboard to:
   - View application statistics
   - Browse and search applications
   - Review individual applications
   - Approve or reject applications
   - Add comments and feedback

## Application Structure

```
src/
├── components/
│   ├── admin/               # Admin interface components
│   │   ├── Dashboard.jsx
│   │   ├── ApplicationsList.jsx
│   │   ├── ApplicationDetail.jsx
│   │   ├── ReviewActions.jsx
│   │   └── CommentSection.jsx
│   ├── auth/                # Authentication components
│   │   └── Login.jsx
│   ├── public/              # Public-facing components
│   │   ├── SubmissionForm.jsx
│   │   ├── FileUpload.jsx
│   │   └── SuccessMessage.jsx
│   └── shared/              # Shared components
│       ├── Layout.jsx
│       └── ProtectedRoute.jsx
├── contexts/
│   └── AuthContext.jsx      # Authentication state management
├── utils/
│   ├── storage.js           # LocalStorage utilities
│   ├── mockAuth.js          # Mock authentication
│   └── mockData.js          # Sample data for testing
├── App.jsx                  # Main app component with routing
└── main.jsx                 # Entry point
```

## Routes

### Public Routes
- `/` - Application submission form
- `/success/:id` - Success confirmation page
- `/login` - Admin login page

### Protected Admin Routes
- `/admin/dashboard` - Analytics dashboard
- `/admin/applications` - Applications list
- `/admin/applications/:id` - Detailed application view

## Sample Data

The application comes pre-populated with 7 sample applications in various states (pending, approved, rejected) to demonstrate all features. This data is stored in localStorage and persists across sessions.

To reset the data, clear your browser's localStorage for the site.

## Key Features Demonstrated

### Multi-Step Form
The public submission form uses a stepper component with validation at each step, providing a smooth user experience.

### File Upload
Supports multiple file formats with size validation (5MB limit). Files are stored as base64 in localStorage (POC only - not recommended for production).

### Search & Filter
The applications list includes:
- Real-time text search across name, email, school, and accreditation
- Status filtering (all, pending, approved, rejected)
- Pagination
- Sorting by submission date

### Review Workflow
Administrators can:
- View complete application details
- Approve or reject with confirmation dialog
- Add timestamped comments
- Track status changes

### Dark Mode / Light Mode
- Toggle button in the navigation bar (sun/moon icon)
- Smooth theme transitions
- Preference saved to localStorage
- Works across all pages and components
- Optimized color schemes for both modes

### Responsive Design
The application is fully responsive and works on desktop, tablet, and mobile devices using Material-UI's Grid system.

## Limitations (POC)

- Mock authentication (no real security)
- LocalStorage for data persistence (limited capacity, no server)
- Base64 file storage (not scalable)
- No email notifications
- No real-time updates
- No multi-user support
- No audit trail beyond basic comments

## Future Enhancements

For a production version, consider:
- Real backend API with database
- Proper authentication (JWT, OAuth)
- File upload to cloud storage (S3, etc.)
- Email notifications for status changes
- User roles and permissions
- Advanced analytics and reporting
- Export functionality
- Real-time collaboration
- Audit logging
- Document preview/download

## Development Notes

This is a proof-of-concept application designed for testing UI ideas and workflows. It uses mock data and localStorage to simulate a full-stack application without requiring a backend server.

## License

This is a demo/POC project.
