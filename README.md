# YouTube Analytics Platform

A full-stack application for analyzing YouTube channel performance, comparing short-form vs long-form content analytics.

## 🚀 Features

- YouTube channel analytics dashboard
- Performance comparison between short and long-form content
- Real-time data visualization
- User authentication and authorization
- Machine learning insights using TensorFlow.js
- Responsive design with Tailwind CSS

## 🏗️ Project Structure

```
youtube-analytics-platform/
├── frontend/                 # React.js frontend
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   └── ...
│   ├── public/
│   └── package.json
├── backend/                  # Node.js/Express backend
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── server.js
│   └── package.json
└── package.json             # Root package.json
```

## 🛠️ Technology Stack

### Frontend
- **React.js** - UI framework
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization
- **Axios** - HTTP client
- **React Router** - Navigation

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB/Mongoose** - Database
- **PostgreSQL** - Additional database
- **Redis** - Caching
- **TensorFlow.js** - Machine learning
- **JWT** - Authentication

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MongoDB
- PostgreSQL
- Redis

## 🚀 Installation & Setup

### 1. Clone the repository
```bash
git clone <repository-url>
cd youtube-analytics-platform
```

### 2. Install root dependencies
```bash
npm install
```

### 3. Setup Backend
```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
POSTGRES_URI=your_postgres_connection_string
REDIS_URL=your_redis_url
JWT_SECRET=your_jwt_secret
YOUTUBE_API_KEY=your_youtube_api_key
```

### 4. Setup Frontend
```bash
cd frontend
npm install
```

## 🏃‍♂️ Running the Application

### Development Mode

#### Start Backend
```bash
cd backend
npm run dev
```

#### Start Frontend
```bash
cd frontend
npm start
```

The frontend will be available at `http://localhost:3000` and the backend at `http://localhost:5000`.

### Production Mode

#### Build Frontend
```bash
cd frontend
npm run build
```

#### Start Backend
```bash
cd backend
npm start
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Analytics
- `GET /api/analytics/channel/:channelId` - Get channel analytics
- `GET /api/analytics/videos/:channelId` - Get video analytics
- `POST /api/analytics/compare` - Compare short vs long-form content

### Channels
- `GET /api/channels` - Get user channels
- `POST /api/channels` - Add new channel
- `DELETE /api/channels/:id` - Remove channel

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 🚀 Deployment

### Using Heroku

1. Install Heroku CLI
2. Login to Heroku: `heroku login`
3. Create apps for frontend and backend
4. Deploy using Git

### Using Vercel (Frontend) & Railway (Backend)

1. Connect your GitHub repository to Vercel for frontend
2. Connect your GitHub repository to Railway for backend
3. Set environment variables in respective platforms

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- Your Name - [Your GitHub Profile](https://github.com/yourusername)

## 🙏 Acknowledgments

- YouTube Data API v3
- TensorFlow.js community
- React and Node.js communities