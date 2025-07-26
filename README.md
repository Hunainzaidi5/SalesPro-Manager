# SalesPro Manager

A comprehensive sales management application for tracking inventory, sales, and profits. Built with React, TypeScript, Tailwind CSS, and Supabase.

## 🚀 Live Demo

**Live Application:** https://sales-pro-manager.vercel.app

## ✨ Features

- **Dashboard:** Overview of sales, revenue, and inventory statistics
- **Products Management:** Add, edit, delete products with pricing and stock tracking
- **Inventory Tracking:** Monitor stock levels and inventory values
- **Sales Recording:** Track sales transactions and calculate profits
- **Settings:** Data export/import functionality
- **Responsive Design:** Works seamlessly on desktop and mobile
- **Real-time Database:** Powered by Supabase for data persistence
- **Modern UI:** Clean black and white theme with professional design

## 🛠️ Tech Stack

- **Frontend:** React 18, TypeScript, Vite
- **Styling:** Tailwind CSS, shadcn/ui components
- **Database:** Supabase (PostgreSQL)
- **Deployment:** Vercel
- **State Management:** React Hooks
- **Routing:** React Router

## 📦 Installation & Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### 1. Clone the Repository

```bash
git clone https://github.com/Hunainzaidi5/SalesPro-Manager.git
cd SalesPro-Manager
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase Database

1. **Create a Supabase Project:**
   - Go to [supabase.com](https://supabase.com)
   - Sign up/Login and create a new project
   - Note down your Project URL and anon public key

2. **Set Up Database Tables:**
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Run the SQL script from `database-setup.sql`

3. **Configure Environment Variables:**
   - Create a `.env.local` file in the root directory
   - Add your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Update Supabase Configuration

Edit `src/lib/supabase.ts` and replace the placeholder values with your actual Supabase credentials:

```typescript
const supabaseUrl = 'your_supabase_project_url'
const supabaseAnonKey = 'your_supabase_anon_key'
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view it in the browser.

## 🗄️ Database Schema

### Products Table
- `id` - UUID (Primary Key)
- `name` - Product name
- `sku` - Stock Keeping Unit (Unique)
- `retail_price` - Selling price
- `manufacturing_cost` - Production cost
- `current_stock` - Available quantity
- `category` - Product category
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

### Sales Table
- `id` - UUID (Primary Key)
- `product_id` - Reference to products table
- `product_name` - Product name at time of sale
- `quantity_sold` - Number of units sold
- `date` - Sale date
- `retail_price` - Price per unit
- `manufacturing_cost` - Cost per unit
- `revenue` - Total revenue
- `profit` - Total profit
- `created_at` - Creation timestamp

## 🚀 Deployment

### Deploy to Vercel

1. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Configure build settings:
     - Framework Preset: Vite
     - Build Command: `npm run build`
     - Output Directory: `dist`

2. **Set Environment Variables:**
   - Add your Supabase environment variables in Vercel dashboard
   - Redeploy the application

### Deploy to Other Platforms

The app can be deployed to any static hosting service:
- Netlify
- GitHub Pages
- AWS S3 + CloudFront
- DigitalOcean App Platform

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 📱 Features in Detail

### Dashboard
- Total revenue and profit overview
- Product count and sales statistics
- Recent sales activity
- Low stock alerts
- Quick action buttons

### Products Management
- Add new products with SKU, pricing, and stock
- Edit existing product details
- Delete products
- Search and filter products
- View sales statistics per product

### Inventory Management
- Real-time stock tracking
- Low stock warnings
- Inventory value calculation
- Stock status indicators

### Sales Recording
- Record new sales transactions
- Automatic profit calculation
- Stock deduction on sales
- Sales history and analytics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/Hunainzaidi5/SalesPro-Manager/issues) page
2. Create a new issue with detailed description
3. Contact the maintainer

## 🔄 Updates

- **v1.0.0** - Initial release with basic POS functionality
- **v1.1.0** - Added Supabase database integration
- **v1.2.0** - Enhanced UI and added real-time updates

---

**Built with ❤️ using React, TypeScript, and Supabase**
