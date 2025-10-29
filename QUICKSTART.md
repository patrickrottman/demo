# Quick Start Guide

## Installation & Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser** to the URL shown in the terminal (typically http://localhost:5173)

## Testing the Application

### Test the Public Interface

1. Navigate to the home page
2. Fill out the application form:
   - Enter your name, email, and phone
   - Provide professional details
   - Upload documents (optional)
   - Write a teaching philosophy
3. Submit and note your application ID

### Test the Admin Interface

1. Click **Login** in the navigation bar (or go to `/login`)
2. Use these credentials:
   ```
   Username: admin
   Password: admin
   ```
3. You'll be redirected to the Dashboard

### Explore Admin Features

**Dashboard:**
- View statistics for total, pending, approved, and rejected applications
- See recent applications
- Click cards or applications to drill down

**Applications List:**
- Search by name, email, school, or accreditation
- Filter by status (all, pending, approved, rejected)
- Click any row to view details

**Application Detail:**
- Review all submitted information
- Approve or reject the application
- Add comments and feedback
- See all previous comments with timestamps

### Try Dark Mode

Click the sun/moon icon in the top navigation bar to toggle between light and dark themes. Your preference is automatically saved!

## Pre-loaded Sample Data

The app comes with 7 sample applications:
- 3 pending applications
- 2 approved applications
- 2 rejected applications

This allows you to immediately test all features without creating test data.

## Data Persistence

All data is stored in browser localStorage and persists across sessions. To reset:
- Open browser DevTools (F12)
- Go to Application/Storage tab
- Clear localStorage for this site
- Refresh the page

## Testing Different UI Ideas

Since this is a POC for testing UI concepts, you can easily:

1. **Modify the form steps** - Edit `src/components/public/SubmissionForm.jsx`
2. **Change the dashboard layout** - Edit `src/components/admin/Dashboard.jsx`
3. **Customize colors/theme** - Edit the theme in `src/App.jsx`
4. **Add new fields** - Update form components and storage utilities
5. **Modify workflows** - Adjust ReviewActions component

## Common Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Troubleshooting

**Port already in use:**
- Vite will automatically try the next available port
- Or specify a port: `npm run dev -- --port 3000`

**Changes not reflecting:**
- Vite has Hot Module Replacement (HMR) - saves are instant
- If stuck, refresh the browser

**Data not saving:**
- Check browser console for errors
- Ensure localStorage is enabled
- Try clearing localStorage and refreshing

## Next Steps

1. Customize the form fields for your specific needs
2. Adjust the approval workflow
3. Modify the dashboard statistics
4. Test different color schemes and layouts
5. Add any additional features you want to explore

For more details, see the full README.md file.
