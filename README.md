# EduManage Pro - School Management System

A modern, responsive school management system built with React, Tailwind CSS, and Ag-Grid.

## 🚀 Features

- **Professional UI**: Clean, modern interface with consistent styling
- **Dark/Light/System Theme**: Multiple theme options with smooth transitions
- **Responsive Design**: Works perfectly on all device sizes
- **Interactive Tables**: Ag-Grid with custom actions (View, Edit, Delete)
- **Multi-language Support**: English/Hindi language toggle
- **Professional Modals**: Consistent popup design across all modules

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite
- **Styling**: Tailwind CSS, Inter Font
- **Tables**: Ag-Grid Community
- **Icons**: Heroicons, Custom SVGs

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd school-mgmt-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:5173
   ```

## 🔧 VS Code Setup (Important)

To resolve CSS/Tailwind warnings in VS Code:

### Step 1: Install Required Extensions
The project recommends these extensions (defined in `.vscode/extensions.json`):
- **Tailwind CSS IntelliSense** (`bradlc.vscode-tailwindcss`)
- **Prettier** (`esbenp.prettier-vscode`)

### Step 2: Reload VS Code
After installing extensions, reload VS Code:
- `Ctrl/Cmd + Shift + P` → `Developer: Reload Window`

### Step 3: IDE Configuration Applied
The project includes optimized VS Code settings (`.vscode/settings.json`) that:
- ✅ Disable CSS validation (prevents false positive errors)
- ✅ Add Tailwind CSS directive recognition
- ✅ Enable proper IntelliSense for Tailwind classes

## 🎨 Design System

### Colors
- **Primary**: Professional blue tones
- **Secondary**: Sky blue for secondary actions
- **Accent**: Warm amber for highlights
- **Success**: Green for positive actions
- **Warning**: Amber for cautions
- **Danger**: Red for destructive actions
- **Neutral**: Gray scale for backgrounds and text

### Components
- **Buttons**: `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-warning`
- **Inputs**: `.input-primary` for consistent form styling
- **Modals**: `.modal-backdrop` and `.modal-content` for consistent popups

### Typography
- **Font**: Inter (400, 500, 600, 700, 800 weights)
- **Sizes**: Consistent responsive text scaling
- **Line Heights**: Optimized for readability

## 📱 Responsive Design

- **Mobile-first approach**
- **Breakpoint-based layouts**
- **Touch-friendly interactions**
- **Adaptive navigation**

## 🏗️ Project Structure

```
src/
├── components/
│   ├── layout/          # Layout components (TopBar, Sidebar)
│   ├── modules/         # Feature modules (Students, Classes, etc.)
│   ├── shared/          # Reusable components (AgGridBox)
│   └── Auth/           # Authentication components
├── data/               # Mock data files
├── App.jsx             # Main application component
├── index.css           # Global styles and utilities
└── main.jsx           # Application entry point
```

## 🔄 Theme System

- **Light Theme**: Default professional appearance
- **Dark Theme**: Eye-friendly dark mode
- **System Theme**: Auto-detects OS preference
- **Persistent Settings**: Remembers user preferences

## 🌍 Internationalization

- **English**: Default language
- **Hindi**: Alternative language option
- **Persistent Language**: Saves user's language preference

## 📊 Data Tables

- **Ag-Grid Integration**: Feature-rich data tables
- **Action Columns**: View, Edit, Delete icons with hover effects
- **Filtering & Sorting**: Built-in table functionality
- **Pagination**: Configurable page sizes
- **Responsive**: Adapts to container width

## 🎯 Development Guidelines

### CSS Classes
- Use Tailwind utility classes in components
- Custom component styles in `@layer components`
- Responsive classes: `sm:`, `md:`, `lg:`, `xl:`

### Component Structure
- Consistent modal structure for all forms
- Reuse `AgGridBox` for data tables
- Follow established color and spacing patterns

### State Management
- Local component state for form data
- Props for configuration and callbacks
- Clean state updates and validation

## 🚀 Production Build

```bash
npm run build
```

## 🤝 Contributing

1. **Install Extensions**: Make sure you have the recommended VS Code extensions
2. **Follow Patterns**: Use established component structures and styling
3. **Test Responsiveness**: Ensure mobile and desktop compatibility
4. **Maintain Consistency**: Keep the professional appearance consistent

## 📄 License

This project is for educational and demonstration purposes.

---

**Note**: If you encounter any CSS validation errors in VS Code, make sure the Tailwind CSS IntelliSense extension is installed and VS Code has been reloaded after installation.
