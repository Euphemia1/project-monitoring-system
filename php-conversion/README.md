# Project Monitoring System - PHP Version

A complete conversion of the Project Monitoring System from Next.js/Supabase to PHP/MySQL stack. This system is designed for construction companies in Zambia to manage projects, track progress, and handle documentation.

## Features

### User Management
- Role-based access control (Director, Project Engineer, Project Manager, Viewer)
- User registration and authentication
- Profile management
- Password security

### Project Management
- Create, view, edit, and delete projects
- Project approval workflows
- District-based access control
- Project sections and trades management

### Progress Tracking
- Create progress reports for projects
- Track trade-by-trade progress
- Financial progress tracking
- Report generation and viewing

### Document Management
- Upload and manage project documents
- Document categorization by type
- File preview and download
- Association with projects and reports

### Reporting
- Generate various reports (summary, progress, financial, district)
- Export reports in PDF format
- Comprehensive project analytics

## Technology Stack

- **Backend**: PHP 7.4+
- **Database**: MySQL 5.7+
- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Framework**: Bootstrap 5 for responsive UI
- **Authentication**: Session-based with password hashing
- **File Storage**: Local file system

## Installation

### Prerequisites
- PHP 7.4 or higher
- MySQL 5.7 or higher
- Apache or Nginx web server
- Composer (optional, for dependency management)

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd project-monitoring-system-main/php-conversion
   ```

2. **Database Setup**
   - Create a MySQL database named `project_monitoring`
   - Execute the SQL schema file:
     ```sql
     mysql -u username -p project_monitoring < database/schema.sql
     ```

3. **Configure Database Connection**
   - Edit `config/database.php` with your database credentials:
     ```php
     define('DB_HOST', 'localhost');
     define('DB_USER', 'your_username');
     define('DB_PASS', 'your_password');
     define('DB_NAME', 'project_monitoring');
     ```

4. **Web Server Configuration**
   - Point your web server document root to the `php-conversion` directory
   - Ensure URL rewriting is enabled for clean URLs

5. **Directory Permissions**
   - Make sure the `uploads` directory is writable:
     ```bash
     chmod 755 uploads/
     ```

## Project Structure

```
php-conversion/
├── assets/
│   ├── css/           # Stylesheets
│   ├── js/            # JavaScript files
│   └── images/        # Image assets
├── config/
│   └── database.php   # Database configuration
├── controllers/
│   └── auth/          # Authentication controllers
├── database/
│   └── schema.sql     # Database schema
├── includes/
│   ├── header.php     # Page header
│   ├── footer.php     # Page footer
│   └── auth.php       # Authentication functions
├── models/
│   ├── User.php       # User model
│   ├── Project.php    # Project model
│   ├── Progress.php   # Progress model
│   ├── Document.php   # Document model
│   └── Dashboard.php  # Dashboard model
├── uploads/           # Uploaded files
├── views/
│   ├── auth/          # Authentication views
│   ├── dashboard/     # Dashboard views
│   ├── projects/      # Project management views
│   ├── progress/      # Progress tracking views
│   ├── documents/     # Document management views
│   ├── reports/       # Reporting views
│   └── settings/      # User settings views
├── index.php          # Main landing page
└── README.md          # This file
```

## Roles and Permissions

| Role             | Permissions |
|------------------|-------------|
| **Director**     | Full access to all features, project approval, user management |
| **Project Engineer** | Create/edit projects, upload documents, manage project details |
| **Project Manager** | Create progress reports, view projects and documents |
| **Viewer**       | Read-only access to projects, progress, and documents |

## Key Features by Module

### Dashboard
- Project statistics overview
- Recent projects and progress reports
- Quick access to key functions

### Projects
- Create new projects (Project Engineers and Directors)
- View project details
- Manage project sections and trades
- Approve projects (Directors only)

### Progress Tracking
- Create progress reports
- Track completion percentages
- Financial progress monitoring
- View historical reports

### Documents
- Upload project documents
- Categorize by document type
- Associate with projects or reports
- Preview and download files

### Reports
- Generate summary reports
- Create progress reports
- Financial analysis
- District performance metrics

## Security Features

- Password hashing with PHP's `password_hash()`
- Session-based authentication
- Role-based access control
- Input validation and sanitization
- SQL injection prevention with prepared statements
- File upload security checks

## Responsive Design

The application is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile devices

Built with Bootstrap 5 for consistent cross-device experience.

## Testing

To test the application:

1. Navigate to the main page
2. Register a new user account
3. Log in with your credentials
4. Test each module:
   - Create a project
   - Add project sections and trades
   - Create progress reports
   - Upload documents
   - Generate reports
   - Update profile settings

## Customization

To customize the application:

1. **Styling**: Modify `assets/css/style.css`
2. **JavaScript**: Edit `assets/js/main.js`
3. **Database**: Update `database/schema.sql` for schema changes
4. **Models**: Extend functionality in the `models/` directory
5. **Views**: Customize templates in the `views/` directory

## Deployment

For production deployment:

1. Set up a production database
2. Configure database credentials in `config/database.php`
3. Set appropriate file permissions
4. Configure your web server for optimal performance
5. Set up SSL certificate for secure connections
6. Regularly backup the database and uploaded files

## Troubleshooting

Common issues and solutions:

1. **Database Connection Failed**
   - Check database credentials in `config/database.php`
   - Ensure MySQL service is running
   - Verify database exists and has proper permissions

2. **File Upload Issues**
   - Check `uploads/` directory permissions
   - Verify PHP upload limits in `php.ini`
   - Ensure sufficient disk space

3. **Permission Errors**
   - Verify user roles in the database
   - Check that users have appropriate district assignments

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a pull request

## License

This project is proprietary software designed for construction companies in Zambia.

## Support

For support, contact the development team or system administrator.