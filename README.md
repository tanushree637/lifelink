# LifeLink - Blood Donation Emergency Platform

A complete web application for emergency blood donation matching built with React, Node.js, and Firebase.

## Project Structure

```
LifeLink/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── pages/          # Page components for each role
│   │   ├── components/     # Reusable components
│   │   ├── context/        # Authentication context
│   │   ├── utils/          # API utilities
│   │   ├── styles/         # CSS files
│   │   └── App.js          # Main app with routing
│   └── package.json
│
├── server/                 # Node.js/Express Backend
│   ├── routes/             # API endpoints
│   ├── middleware/         # Authentication middleware
│   ├── config/             # Firebase configuration
│   ├── server.js           # Main server file
│   └── package.json
│
└── SETUP.md               # Complete setup guide
```

## Key Features

### 🩸 Donor Role

- Register with blood type and location
- Toggle availability status
- View nearby emergency blood requests
- Accept donation requests
- Track donation history

### 🆘 Recipient Role

- Create emergency blood requests
- Specify blood type and urgency level
- Track request status
- Receive matched donor notifications
- Cancel requests if needed

### 🏥 Hospital Admin Role

- View and manage blood donations
- Verify donated blood using OTP
- Track donation history
- Manage inventory

### 👨‍💼 Platform Admin Role

- Approve/reject user registrations
- Monitor suspicious activity
- View system statistics
- Manage all users and requests

## Tech Stack

- **Frontend**: React 19, React Router 6, Axios
- **Backend**: Node.js, Express 5
- **Database**: Firebase Firestore
- **Authentication**: JWT + bcryptjs
- **Styling**: CSS3

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- Firebase Account
- Modern web browser

### Installation

1. **Setup Firebase** (See `FIREBASE_SETUP.md`)

2. **Install Backend Dependencies**

```bash
cd server
npm install
```

3. **Configure Backend Environment**

```bash
# Create/update .env file
PORT=5000
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
JWT_SECRET=your-secret-key
```

4. **Install Frontend Dependencies**

```bash
cd client
npm install
```

5. **Start Backend Server**

```bash
cd server
npm run dev  # Uses nodemon for hot reload
```

6. **Start Frontend Development Server** (In another terminal)

```bash
cd client
npm start
```

Access the application at `http://localhost:3000`

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Donor APIs

- `GET /api/donors/profile` - Get donor profile
- `PUT /api/donors/availability` - Update availability
- `GET /api/donors/requests/nearby` - Get nearby requests
- `POST /api/donors/accept-request/:requestId` - Accept donation
- `GET /api/donors/history` - Get donation history

### Recipient APIs

- `POST /api/recipients/emergency-request` - Create blood request
- `GET /api/recipients/request/:requestId` - Get request details
- `GET /api/recipients/my-requests` - Get all requests
- `PUT /api/recipients/request/:requestId/cancel` - Cancel request

### Hospital APIs

- `GET /api/hospitals/profile` - Get hospital profile
- `GET /api/hospitals/pending-donations` - Get pending donations
- `POST /api/hospitals/verify-donation/:donationId` - Verify donation
- `GET /api/hospitals/donation-history` - Get all donations

### Admin APIs

- `GET /api/admin/pending-users` - Get pending approvals
- `POST /api/admin/approve-user/:userId` - Approve user
- `POST /api/admin/reject-user/:userId` - Reject user
- `GET /api/admin/suspicious-activity` - View suspicious activities
- `GET /api/admin/statistics` - Get system statistics

## User Roles & Workflow

### Registration Steps:

1. User registers with their role (Donor/Recipient/Hospital/Admin)
2. Provide required information
3. Admin receives notice of new registration
4. Admin reviews and approves/rejects
5. User receives approval notification
6. User can login

### Donation Workflow:

1. Recipient creates emergency blood request
2. System finds compatible donors
3. Donor receives notification
4. Donor accepts request
5. Donor goes to hospital
6. Hospital verifies donation with OTP
7. Donation is recorded

## Security Features

- **Password Hashing**: bcryptjs for secure password storage
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Different permissions for each role
- **Email Verification**: Planned for production
- **OTP Verification**: For hospital donation verification

## Development

### Project Structure Files

#### Backend (server/)

- `server.js` - Express app setup
- `config/firebase.js` - Firebase initialization
- `middleware/auth.js` - JWT & role verification
- `routes/auth.js` - Authentication endpoints
- `routes/donors.js` - Donor functionality
- `routes/recipients.js` - Recipient functionality
- `routes/hospitals.js` - Hospital functionality
- `routes/admin.js` - Admin functionality

#### Frontend (client/)

- `App.js` - Main routing component
- `context/AuthContext.js` - Authentication state management
- `pages/Login.js` - Login page
- `pages/Signup.js` - Registration page
- `pages/DonorDashboard.js` - Donor dashboard
- `pages/RecipientDashboard.js` - Recipient dashboard
- `pages/HospitalDashboard.js` - Hospital dashboard
- `pages/AdminDashboard.js` - Admin dashboard
- `components/Navigation.js` - Navigation bar
- `utils/api.js` - API client with Axios

## Future Enhancements

- [ ] Real-time GPS tracking for donors
- [ ] Automatic donor-recipient matching algorithm
- [ ] SMS/Email notifications
- [ ] Payment integration for blood bank supplies
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Machine learning for demand forecasting
- [ ] Emergency alert system
- [ ] Medical eligibility screening
- [ ] Donation history medical recommendations

## Testing

### Test User Accounts (Create manually after setup):

**Admin User**:

- Email: admin@lifelink.com
- Password: AdminPass123
- Role: admin

**Hospital User**:

- Email: hospital@lifelink.com
- Password: HospitalPass123
- Role: hospital

**Donor User**:

- Email: donor@lifelink.com
- Password: DonorPass123
- Role: donor
- Blood Group: O+

**Recipient User**:

- Email: recipient@lifelink.com
- Password: RecipientPass123
- Role: recipient

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 5000
lsof -i :5000
# Kill the process
kill -9 PID
```

### Firebase Connection Issues

- Verify `.env` credentials are correct
- Check Firestore is enabled in Firebase Console
- Verify firestore rules allow operations

### CORS Errors

- Check backend has CORS middleware enabled
- Verify frontend API URL is correct

## Deployment

### Backend (Firebase Functions or Heroku)

1. Set environment variables in deployment platform
2. Deploy server code
3. Update frontend API URL

### Frontend (Vercel/Netlify)

1. Build: `npm run build`
2. Deploy build folder
3. Set API URL as environment variable

## Contributing

1. Create a feature branch
2. Make changes
3. Test thoroughly
4. Submit pull request

## License

MIT

## Support

For issues and questions:

- Check FIREBASE_SETUP.md for setup help
- Review API documentation above
- Check browser console for errors
- Review server logs for API issues

---

**Made with ❤️ for saving lives**
